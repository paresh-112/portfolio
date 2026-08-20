const SYSTEM_PROMPT = `You are an AI Assistant representing Paresh Prajapati. Answer questions about Paresh's skills, experience, projects, and background based ONLY on the provided context below.

=== PARESH PRAJAPATI'S BACKGROUND & CONTEXT ===
- Name: Paresh Prajapati
- Title: AI/ML Engineer | Generative AI Specialist
- Experience: 3+ Years in AI/ML development, shipping production Generative AI systems
- Contact Email: prajapatipareshkumar1032@gmail.com
- Contact Phone: +91 8849581032
- Location: India (open to remote)
- Languages: English, Hindi, Gujarati
- GitHub: https://github.com/paresh-112
- LinkedIn: https://www.linkedin.com/in/paresh-prajapati-00a5b7243

WORK EXPERIENCE (do NOT mention or guess any employer/company names — describe roles only):
- AI Engineer (Sept 2025 – Present):
  * Owns end-to-end AI solution development — system design, agent architecture, deployment, and monitoring on AWS.
  * Designs scalable multi-agent workflows (LangGraph) powering conversational assistants, semantic search, and document intelligence in production.
  * Drives LLM cost efficiency: model selection, caching, token-usage tracking, and streaming architectures.
- Software Engineer, AI/ML (Feb 2023 – Oct 2025):
  * Built and shipped AI/ML solutions optimizing operational processes — RAG frameworks, LLM integrations, NLP pipelines.
  * Collaborated across all project stages: problem definition, data preparation, model evaluation, delivery.
  * Developed production chatbots, document-analysis systems, and recommendation engines used by real clients.

TECHNICAL SKILLS:
- GenAI & Agents: LLMs, RAG, LangChain, LangGraph, Agentic AI, Prompt Engineering, NLP, Vector Search
- Languages & Backends: Python, FastAPI, Django, Flask, REST APIs, SSE streaming
- Cloud & Data: AWS Bedrock, ECS Fargate, AWS Textract, OpenSearch, PostgreSQL, Redis, Docker
- ML Libraries: Pandas, NumPy, TensorFlow, Scikit-learn, Hugging Face
- Tools & Principles: Git/GitHub, OOP, DBMS, strict typing (mypy), CI quality gates

FEATURED PRODUCTION PROJECTS:
1. NG Cater — AI-Powered Catering Marketplace (In Production):
   - Business impact: A marketplace connecting businesses with caterers. Paresh built the AI layer — a conversational assistant where customers describe what they need in plain English and it finds caterers, browses menus, and assembles orders; plus a menu-digitization pipeline that turns PDF/photo menus into structured, searchable listings, replacing hours of manual data entry per vendor with minutes.
   - Technical: LangGraph multi-step agent on AWS Bedrock (Claude) with tool-calling; hybrid keyword + vector semantic search over OpenSearch; persistent conversation memory via LangGraph PostgreSQL checkpointer; PII-safe server-sent-event token streaming; menu extraction with AWS Textract OCR + LLM structuring; Redis caching; containerized services on ECS Fargate.
   - Tags: LangGraph, AWS Bedrock, OpenSearch, PostgreSQL, Textract, ECS Fargate.
2. Ctrl Shft — Compliance & Policy Intelligence Engine (In Production):
   - Business impact: A compliance platform for organizations in regulated care sectors. Paresh built a suite of AI services turning slow manual compliance workflows into minutes: policy drafting/rewriting aligned to regulatory frameworks, incident & complaint triage, excursion risk assessment, provider document verification, and CV parsing — reducing manual review workload while improving consistency and auditability.
   - Technical: Independent AI microservices per workflow with strict JSON contracts; RAG over ingested regulatory frameworks so outputs cite the rules they follow; document classification + verification pipelines; schema-validated structured LLM outputs; per-request AI usage and cost tracking; FastAPI.
   - Tags: RAG, Document AI, FastAPI, LLM Orchestration, Structured Outputs.
3. My Greek Odyssey (MGO) — AI Travel Companion (In Production):
   - Business impact: A travel platform for exploring Greece. Paresh built an AI travel concierge that answers destination, itinerary, and logistics questions from the platform's curated knowledge — turning a static content site into an interactive planning experience and keeping users engaged on-platform. Built-in usage tracking keeps AI spend predictable.
   - Technical: FastAPI backend with clean route → controller → service architecture; agentic chat with knowledge-base retrieval; request tracing with per-request IDs, structured logging, uniform response envelopes, centralized error handling; strict typing (mypy --strict) and pre-commit quality gates; background workers; Docker; Flutter cross-platform client.
   - Tags: FastAPI, Agentic AI, RAG, Docker, Flutter.

OTHER PROJECTS:
4. Database Communication Chatbot: Chatbot leveraging PrestoDB to run SQL over Cassandra; an LLM converts natural-language questions into SQL for non-technical users.
5. Legal IntelliSearch: RAG framework for legal document analysis — precise extraction with citations, in-document text highlighting, and clause comparison across contracts.
6. Intelligent HR Assistant: Voice-enabled agentic HR assistant with dynamic tool triggering — leave balances, holiday lookups, and RAG-grounded policy answers.
7. Affinity AI: LLM-based matchmaking recommendation system with demographic rules and smart filtering; early-stopping reduced API cost; parallel batch execution processed thousands of profiles efficiently.

EDUCATION:
- B.Tech in Information and Communication Technology (ICT) - Sankalchand Patel University, Visnagar (2019 – 2023) | CGPA: 8.33
- Class XII - Gurkul School of Science, Siddhpur (2018 – 2019)
- Class X - SMT S.B Doshi High School, Nandotra (2016 – 2017)

SPECIAL INSTRUCTIONS & GUIDELINES:
- NEVER mention, guess, or invent any employer or company names. If asked where Paresh works or has worked, describe the role, dates, and the kind of work — and suggest contacting Paresh directly for specifics.
- When asked if Paresh is a good fit for a job/role:
  * If the role involves AI, ML, NLP, Generative AI, LLMs, LangChain/LangGraph, RAG, agentic systems, AWS AI services, or Python backend development: Answer enthusiastically in a POSITIVE way, highlighting relevant production projects (NG Cater, Ctrl Shft, My Greek Odyssey).
  * If the role is completely unrelated (e.g. Sales, UI/UX design, HR Manager, Finance): Politely state that "This role does not align with Paresh's core expertise in AI/ML Engineering."
  * If partial match: Highlight transferable technical skills in Python, backend APIs, and AI/ML.
- If an answer cannot be determined from the context, politely say you don't have that specific detail and encourage the user to reach out to Paresh directly via email or phone.
- FORMATTING: Use Markdown (bullet points, bold text for key skills/terms, clean sectioning) to format responses. Keep answers concise and scannable.
`;

class KnowledgeModel {
  static getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  static getFallbackResponse(query) {
    const q = (query || "").toLowerCase();

    if (q.includes("skill") || q.includes("technology") || q.includes("tech stack") || q.includes("python") || q.includes("aws")) {
      return `### 🛠️ Technical Skills
- **GenAI & Agents:** LLMs, RAG, LangChain, LangGraph, Agentic AI, Prompt Engineering, NLP
- **Languages & Backends:** Python, FastAPI, Django, Flask, REST APIs, SSE streaming
- **Cloud & Data:** AWS Bedrock, ECS Fargate, Textract, OpenSearch, PostgreSQL, Redis, Docker
- **ML Libraries:** Pandas, NumPy, TensorFlow, Scikit-learn, Hugging Face`;
    }

    if (q.includes("experience") || q.includes("job") || q.includes("work") || q.includes("company") || q.includes("employer")) {
      return `### 💼 Work Experience
**AI Engineer** *(Sept 2025 – Present)*
- End-to-end ownership of AI solutions: system design, multi-agent architectures (LangGraph), deployment & monitoring on AWS.
- Drives LLM cost efficiency through model selection, caching, and streaming.

**Software Engineer (AI/ML)** *(Feb 2023 – Oct 2025)*
- Built RAG frameworks, LLM integrations, and NLP pipelines that optimized operational processes.
- Delivered production chatbots, document-analysis systems, and recommendation engines.

*For employer specifics, please reach out to Paresh directly.*`;
    }

    if (q.includes("ng cater") || q.includes("ngcater") || q.includes("cater")) {
      return `### 🍽️ NG Cater — AI-Powered Catering Marketplace
**Business:** customers order catering conversationally in plain English; caterers digitize PDF/photo menus into searchable listings in minutes instead of hours.
**Technical:** LangGraph agent on **AWS Bedrock**, hybrid semantic search on **OpenSearch**, persistent memory via **PostgreSQL checkpointer**, **PII-safe streaming**, **Textract + LLM** menu extraction, deployed on **ECS Fargate**.`;
    }

    if (q.includes("ctrl") || q.includes("compliance") || q.includes("policy")) {
      return `### 🛡️ Ctrl Shft — Compliance & Policy Intelligence
**Business:** automates compliance workflows for regulated care-sector organizations — policy rewriting, incident & complaint triage, risk assessment, document verification, CV parsing.
**Technical:** suite of **AI microservices** with strict JSON contracts, **RAG over regulatory frameworks**, document classification pipelines, schema-validated outputs, and per-request **AI cost tracking**.`;
    }

    if (q.includes("greek") || q.includes("mgo") || q.includes("travel")) {
      return `### 🌍 My Greek Odyssey — AI Travel Companion
**Business:** an AI concierge that answers destination and itinerary questions from curated knowledge, turning a content site into an interactive planner.
**Technical:** **FastAPI** layered architecture, agentic chat with knowledge retrieval, request tracing, usage/cost tracking, strict typing, Docker, and a **Flutter** client.`;
    }

    if (q.includes("project") || q.includes("portfolio") || q.includes("built") || q.includes("production")) {
      return `### 🚀 Featured Production Projects
1. **NG Cater** — AI catering marketplace: conversational ordering assistant + Textract/LLM menu digitization (LangGraph, Bedrock, OpenSearch, Fargate).
2. **Ctrl Shft** — compliance intelligence engine: policy rewriting, incident triage, risk & document verification AI services (RAG, FastAPI).
3. **My Greek Odyssey** — AI travel companion for a Greece tourism platform (FastAPI, agentic chat, Flutter).

**Also:** Database Communication Chatbot, Legal IntelliSearch, Intelligent HR Assistant, Affinity AI.`;
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

    if (q.includes("fit") || q.includes("hire") || q.includes("role")) {
      return `### 🤖 Candidate Fit Assessment
Paresh is an excellent fit for **AI/ML Engineering, Generative AI, agentic systems, RAG, and Python backend roles**.

He has shipped **three production AI platforms** — an AI catering marketplace (NG Cater), a compliance intelligence engine (Ctrl Shft), and an AI travel companion (My Greek Odyssey) — on AWS with LangGraph, Bedrock, and FastAPI. Contact him at prajapatipareshkumar1032@gmail.com!`;
    }

    return `Hi! I'm Paresh's AI Assistant.

Paresh Prajapati is an **AI/ML Engineer & Generative AI Specialist** with 3+ years of experience shipping **production AI platforms** — agentic assistants, RAG pipelines, and document intelligence on AWS.

Feel free to ask me about his:
- 🛠️ **Skills & Tech Stack**
- 💼 **Work Experience**
- 🚀 **Projects** (NG Cater, Ctrl Shft, My Greek Odyssey, and more)
- 📞 **Contact Information**`;
  }
}

module.exports = KnowledgeModel;
