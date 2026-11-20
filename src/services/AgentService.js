const { getChatModel, hasGroqApiKey, GROQ_MODEL } = require("../config/groq");
const { loadLangChain } = require("../config/langchain");
const KnowledgeModel = require("../models/KnowledgeModel");

// Persona/context/question flow in as template variables, so braces inside
// the knowledge content are never parsed as template syntax.
let promptTemplate = null;

async function getPromptTemplate() {
  if (!promptTemplate) {
    const { ChatPromptTemplate, MessagesPlaceholder } = await loadLangChain();
    promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "{persona}\n\n=== CONTEXT DOCUMENTS (retrieved for this question) ===\n{context}"],
      new MessagesPlaceholder("history"),
      ["human", "{question}"]
    ]);
  }
  return promptTemplate;
}

function formatContext(docs) {
  return docs
    .map((doc, i) => `[Document ${i + 1}: ${doc.metadata.title}]\n${doc.pageContent}`)
    .join("\n\n");
}

async function toLangChainHistory(historyMessages) {
  const { HumanMessage, AIMessage } = await loadLangChain();
  return historyMessages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
}

class AgentService {
  static isAvailable() {
    return hasGroqApiKey();
  }

  static get model() {
    return GROQ_MODEL;
  }

  // Streams the RAG generation chain: prompt(context docs + history) -> ChatGroq.
  // Returns the full reply plus token usage when the provider reports it.
  static async generate(message, historyMessages, docs, onToken) {
    const model = await getChatModel();
    if (!model) {
      throw new Error("GROQ_API_KEY_MISSING");
    }

    const chain = (await getPromptTemplate()).pipe(model);

    const stream = await chain.stream({
      persona: KnowledgeModel.getPersonaPrompt(),
      context: formatContext(docs),
      history: await toLangChainHistory(historyMessages),
      question: message
    });

    let reply = "";
    let usage = null;

    for await (const chunk of stream) {
      const text =
        typeof chunk.text === "string"
          ? chunk.text
          : typeof chunk.content === "string"
            ? chunk.content
            : "";

      if (text) {
        reply += text;
        if (typeof onToken === "function") {
          onToken(text);
        }
      }

      if (chunk.usage_metadata) {
        usage = chunk.usage_metadata;
      }
    }

    return { reply, usage, model: GROQ_MODEL };
  }
}

module.exports = AgentService;
