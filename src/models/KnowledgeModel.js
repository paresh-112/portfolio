const SYSTEM_PROMPT = `You are an AI Assistant representing Paresh Prajapati. Answer questions about Paresh's skills, experience, projects, and background based ONLY on the provided context below.

=== PARESH PRAJAPATI'S BACKGROUND & CONTEXT ===
- Name: Paresh Prajapati
- Title: AI/ML Engineer | Generative AI Specialist
- Experience: 2+ Years in AI/ML development
- Contact Email: prajapatipareshkumar1032@gmail.com
- Contact Phone: +91 8849581032
- Location: India
- Languages: English, Hindi, Gujarati
- GitHub: https://github.com/paresh-112
- LinkedIn: https://www.linkedin.com/in/paresh-prajapati-00a5b7243

WORK EXPERIENCE:
- Software Engineer (AI/ML) at INTECH Creative Services (Feb 2023 – Present):
  * Gained hands-on experience applying AI/ML solutions to optimize operational processes.
  * Collaborated on all stages of project development from problem definition to model deployment & evaluation.
  * Proficient in data pre-processing, model training, RAG pipelines, and LLM fine-tuning/integration.

TECHNICAL SKILLS:
- Programming Languages: Python, Django, Flask
- AI/ML Technologies: Generative AI, Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), LangChain, Agentic AI, Natural Language Processing (NLP), ML Algorithms
- Libraries & Frameworks: Pandas, NumPy, TensorFlow, Scikit-learn, Hugging Face
- Tools & Principles: Git, GitHub, Visual Studio, OOP, DBMS

FEATURED PROJECTS:
1. Database Communication Chatbot:
   - Built a chatbot using PrestoDB enabling SQL queries on Cassandra databases.
   - Integrated LLM to convert natural language queries into SQL for non-technical users.
   - Tags: LLM, PrestoDB, Cassandra, NLP, Python.
2. Legal IntelliSearch:
   - Created a RAG framework for legal document processing and contract review.
   - Features: precise extraction, citation generation, text highlighting, clause comparison.
   - Tags: RAG, LLM, Document Analysis, NLP, Python.
3. Intelligent HR Assistant:
   - Created an Agentic AI-powered HR assistant with voice interaction.
   - Features: dynamic tool triggering, RAG policy extraction, leave balance & holiday lookups.
   - Tags: Agentic AI, RAG, Voice Recognition, LLM, Python.

EDUCATION:
- B.Tech in Information and Communication Technology (ICT) - Sankalchand Patel University, Visnagar (2019 – 2023) | CGPA: 8.33
- Class XII - Gurkul School of Science, Siddhpur (2018 – 2019)
- Class X - SMT S.B Doshi High School, Nandotra (2016 – 2017)

SPECIAL INSTRUCTIONS & GUIDELINES:
- When asked if Paresh is a good fit for a job/role:
  * If the role involves AI, ML, NLP, Generative AI, LLMs, LangChain, RAG, or Python development: Answer enthusiastically in a POSITIVE way, highlighting relevant projects (Legal IntelliSearch, Intelligent HR Assistant, Database Chatbot).
  * If the role is completely unrelated (e.g. Sales, UI/UX design, HR Manager, Finance): Politely state that "This role does not align with Paresh's core expertise in AI/ML Engineering."
  * If partial match: Highlight transferable technical skills in Python and AI/ML.
- If an answer cannot be determined from the context, politely say you don't have that specific detail and encourage the user to reach out to Paresh directly via email or phone.
- FORMATTING: Use Markdown (bullet points, bold text for key skills/terms, clean sectioning) to format responses.
`;

class KnowledgeModel {
  static getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  static getFallbackResponse(query) {
    const q = (query || "").toLowerCase();

    if (q.includes("skill") || q.includes("technology") || q.includes("tech stack") || q.includes("python")) {
      return `### 🛠️ Technical Skills
- **Languages & Frameworks:** Python, Django, Flask
- **AI/ML & GenAI:** Generative AI, LLMs, RAG, LangChain, Agentic AI, NLP, ML Algorithms
- **Libraries:** Pandas, NumPy, TensorFlow, Scikit-learn, Hugging Face
- **Tools:** Git, GitHub, Visual Studio, OOP, DBMS`;
    }

    if (q.includes("experience") || q.includes("job") || q.includes("work") || q.includes("company") || q.includes("intech")) {
      return `### 💼 Work Experience
**Software Engineer (AI/ML)** | INTECH Creative Services *(Feb 2023 – Present)*
- Applied AI/ML solutions to optimize operational processes.
- End-to-end development of AI products, model training, and RAG architectures.
- Experience with data preprocessing and evaluation techniques.`;
    }

    if (q.includes("project") || q.includes("portfolio")) {
      return `### 🚀 Featured Projects
1. **Database Communication Chatbot:** SQL query capabilities on Cassandra via PrestoDB & LLM natural language to SQL conversion.
2. **Legal IntelliSearch:** RAG framework for legal document processing, citation generation, and clause comparison.
3. **Intelligent HR Assistant:** Voice-enabled Agentic AI HR assistant with dynamic tool triggering and RAG policy lookups.`;
    }

    if (q.includes("contact") || q.includes("email") || q.includes("phone") || q.includes("reach") || q.includes("linkedin") || q.includes("github")) {
      return `### 📞 Contact Paresh Prajapati
- 📧 **Email:** [prajapatipareshkumar1032@gmail.com](mailto:prajapatipareshkumar1032@gmail.com)
- 📱 **Phone:** [+91 8849581032](tel:+918849581032)
- 🐙 **GitHub:** [github.com/paresh-112](https://github.com/paresh-112)
- 💼 **LinkedIn:** [linkedin.com/in/paresh-prajapati-00a5b7243](https://www.linkedin.com/in/paresh-prajapati-00a5b7243)`;
    }

    if (q.includes("education") || q.includes("degree") || q.includes("college") || q.includes("cgpa")) {
      return `### 🎓 Education
- **B.Tech (ICT):** Sankalchand Patel University, Visnagar (2019 – 2023) — **CGPA: 8.33**
- **Class XII:** Gurkul School of Science, Siddhpur (2018 – 2019)
- **Class X:** SMT S.B Doshi High School, Nandotra (2016 – 2017)`;
    }

    if (q.includes("fit") || q.includes("hire") || q.includes("role") || q.includes("job")) {
      return `### 🤖 Candidate Fit Assessment
Paresh is an excellent fit for **AI/ML Engineering, Generative AI, LLM Development, RAG Systems, and Python backend developer roles**. 

He brings proven experience building cutting-edge GenAI applications like *Legal IntelliSearch* and *Intelligent HR Assistant*. Feel free to contact Paresh directly at prajapatipareshkumar1032@gmail.com!`;
    }

    return `Hi! I'm Paresh's AI Assistant. 

Paresh Prajapati is an **AI/ML Engineer & Generative AI Specialist** with 2+ years of experience building LLM applications, RAG pipelines, and intelligent AI agents.

Feel free to ask me about his:
- 🛠️ **Skills & Tech Stack**
- 💼 **Work Experience**
- 🚀 **Projects** (Legal IntelliSearch, HR Assistant, SQL Chatbot)
- 📞 **Contact Information**`;
  }
}

module.exports = KnowledgeModel;
