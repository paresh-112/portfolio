import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# LangChain Imports
from langchain_groq import ChatGroq
from langchain_community.document_loaders import PyPDFLoader, BSHTMLLoader
from langchain_community.vectorstores import FAISS
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_ollama import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables from .env in current or parent directory
load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Initialize FastAPI
app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_file_path(filename):
    # Check current directory (for Docker)
    path_current = os.path.join(BASE_DIR, filename)
    if os.path.exists(path_current):
        return path_current
    # Check parent directory (for local dev)
    path_parent = os.path.join(BASE_DIR, "..", filename)
    if os.path.exists(path_parent):
        return path_parent
    return path_current # Fallback

RESUME_PATH = get_file_path("Paresh_Prajapati_Resume_edited_1-1.pdf")
HTML_PATH = get_file_path("index.html")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
# Note: Use "http://host.docker.internal:11434" when running inside Docker on Windows/Mac
# Initialize Global Variables
vectorstore = None
conversational_rag_chain = None
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def setup_rag():
    global vectorstore, conversational_rag_chain
    try:
        print("🔧 Setting up RAG pipeline...")
        # 1. Load Resume & HTML Content
        all_documents = []
        try:
            loader_pdf = PyPDFLoader(RESUME_PATH)
            all_documents.extend(loader_pdf.load())
            print(f"📄 Loaded PDF: {len(all_documents)} pages")
        except Exception as e:
            print(f"⚠️ PDF Load Error: {e}")

        try:
            if os.path.exists(HTML_PATH):
                loader_html = BSHTMLLoader(HTML_PATH)
                html_docs = loader_html.load()
                all_documents.extend(html_docs)
                print(f"🌐 Loaded HTML content: {len(html_docs)} documents")
        except Exception as e:
            print(f"⚠️ HTML Load Error: {e}")

        # 2. Setup Splitter and Embeddings
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(all_documents)
        print(f"✂️ Split into {len(chunks)} chunks")

        embeddings = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=OLLAMA_BASE_URL
        )
        
        # 3. Create Vector Store
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # 4. Initialize Groq LLM
        llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
        )

        # 5. History-Aware Retriever
        contextualize_q_system_prompt = (
            "Given a chat history and the latest user question "
            "which might reference context in the chat history, "
            "formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed and otherwise return it as is."
        )
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        history_aware_retriever = create_history_aware_retriever(
            llm,
            vectorstore.as_retriever(search_kwargs={"k": 6}), 
            contextualize_q_prompt
        )

        # 6. Question-Answering Chain
        system_prompt = (
            "You are an AI Assistant representing Paresh Prajapati. "
            "Answer questions about Paresh's skills, experience, and projects based ONLY on the provided context. "
            "If the answer is not in the context, politely say you don't know and encourage the user to reach out to Paresh directly. "
            "\n\n"
            "SPECIAL INSTRUCTIONS FOR users:\n"
            "- If asked if Paresh is fit for a specific role:\n"
            "  * If the role is related to AI, ML, NLP, Generative AI, LLMs, or Python development, answer enthusiastically in a POSITIVE way, highlighting relevant projects like Legal IntelliSearch or Intelligent HR Assistant.\n"
            "  * If the job description (JD) is totally unrelated (e.g., Sales, HR Manager, UI Designer), politely state that 'This role does not align with Paresh's core expertise in AI/ML.'\n"
            "  * If there is a partial match, highlight Paresh's transferable technical skills.\n"
            "\n"
            "FORMATTING:\n"
            "- Use Markdown to format your response for better readability.\n"
            "- Use bullet points for lists and bold for key terms.\n"
            "- Keep answers professional, persuasive, and helpful."
            "\n\n"
            "{context}"
        )
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

        # 7. Final Conversational RAG Chain
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        conversational_rag_chain = RunnableWithMessageHistory(
            rag_chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )
        print("✅ RAG pipeline ready!")
    except Exception as e:
        print(f"❌ Error during setup: {e}")

# Run setup on startup
@app.on_event("startup")
async def startup_event():
    setup_rag()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not conversational_rag_chain:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        response = conversational_rag_chain.invoke(
            {"input": request.message},
            config={"configurable": {"session_id": request.session_id}}
        )
        return {"reply": response["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
