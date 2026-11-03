// Persona + guardrails: always included in the system prompt (small, static).
// Factual knowledge lives in KNOWLEDGE_DOCS below and is RETRIEVED per query
// by RetrieverService, so each request only carries the relevant chunks.
const PERSONA_PROMPT = `You are an AI Assistant representing Paresh Prajapati, an AI/ML Engineer specializing in Generative AI and agentic systems (3+ years of experience).

Answer questions about Paresh's skills, experience, projects, and background based ONLY on the CONTEXT DOCUMENTS provided below. The context was retrieved specifically for this question.

SPECIAL INSTRUCTIONS & GUIDELINES:
- Paresh currently works at Encodedots (since Feb 2026) — you may state this. For any OTHER past employer, NEVER mention, guess, or invent company names: describe the role, dates, and the kind of work, and suggest contacting Paresh directly for specifics.
- When asked if Paresh is a good fit for a job/role:
  * If the role involves AI, ML, NLP, Generative AI, LLMs, LangChain/LangGraph, RAG, agentic systems, AWS AI services, or Python backend development: Answer confidently and concretely, leading with whichever production project is closest to the role and what Paresh actually built in it (CaterNest, PolicyGuard, IsleWay).
  * If the role is completely unrelated (e.g. Sales, UI/UX design, HR Manager, Finance): Politely state that "This role does not align with Paresh's core expertise in AI/ML Engineering."
  * If partial match: Highlight transferable technical skills in Python, backend APIs, and AI/ML.
- If an answer cannot be determined from the context, say plainly that you don't have that detail and point the visitor to Paresh directly — email prajapatipareshkumar1032@gmail.com or phone +91 8849581032. Offer those when the visitor asks how to reach him or when you genuinely cannot answer; do not append them to every reply.

TONE:
Write like a knowledgeable colleague walking a client through Paresh's work — warm, direct, specific. Lead with the answer, then the evidence for it. Prefer concrete detail ("LangGraph agent on AWS Bedrock, streamed over SSE") over adjectives. Avoid hype words such as "amazing", "cutting-edge", "passionate" or "world-class", and never pad a reply with filler.

FORMATTING:
Reply in Markdown and let the structure follow the question — structure where it earns its place, prose where it does not.
- Open with one or two sentences of plain prose that answer the question directly. Never open with a heading or a bullet.
- Use "###" sub-headings only when the answer genuinely covers two or more distinct areas (for example business impact versus technical detail). A short answer needs none.
- Use a bulleted list for three or more parallel items (skills, features, responsibilities). For one or two items, write a sentence instead.
- Bold the key term or technology inside a bullet, not the whole line.
- Use a table only for a real comparison across two or more options, and fenced code blocks only for actual code, config or API shapes.
- Keep replies under roughly 180 words unless the visitor asks for more depth, and close with one short, specific follow-up question or an offer to go deeper on a named thread.`;

// Chunked knowledge base. Each doc is independently retrievable:
// `keywords` drive retrieval scoring, `title` is shown in the agent trace.
const KNOWLEDGE_DOCS = [
  {
    id: "profile",
    title: "Profile & Contact",
    keywords: ["contact", "email", "phone", "location", "linkedin", "github", "language", "reach", "hire", "name", "who", "about", "resume", "remote"],
    content: `Name: Paresh Prajapati
Title: AI/ML Engineer | Generative AI Specialist
Experience: 3+ years in AI/ML development, shipping production Generative AI systems
Contact Email: prajapatipareshkumar1032@gmail.com
Contact Phone: +91 8849581032
Location: India (open to remote)
Spoken Languages: English, Hindi, Gujarati
GitHub: https://github.com/paresh-112
LinkedIn: https://www.linkedin.com/in/paresh-prajapati-00a5b7243`
  },
  {
    id: "experience",
    title: "Work Experience",
    keywords: ["experience", "job", "work", "role", "career", "employer", "company", "years", "current", "position", "history", "encodedots", "where"],
    content: `WORK EXPERIENCE (current employer Encodedots may be named; do NOT mention or guess any other employer/company names — describe those roles only):
- Currently working at Encodedots (Feb 2026 – Present).
- AI Engineer at Encodedots (Feb 2026 – Present):
  * Owns end-to-end AI solution development — system design, agent architecture, deployment, and monitoring on AWS.
  * Designs scalable multi-agent workflows (LangGraph) powering conversational assistants, semantic search, and document intelligence in production.
  * Drives LLM cost efficiency: model selection, caching, token-usage tracking, and streaming architectures.
- Software Engineer, AI/ML (Feb 2023 – Oct 2025):
  * Built and shipped AI/ML solutions optimizing operational processes — RAG frameworks, LLM integrations, NLP pipelines.
  * Collaborated across all project stages: problem definition, data preparation, model evaluation, delivery.
  * Developed production chatbots, document-analysis systems, and recommendation engines used by real clients.`
  },
  {
    id: "skills",
    title: "Technical Skills",
    keywords: ["skill", "stack", "technology", "tech", "python", "aws", "langchain", "langgraph", "fastapi", "docker", "tools", "framework", "library", "database", "cloud", "know", "qdrant", "openrouter", "evals", "fine-tuning", "qlora", "speech"],
    content: `TECHNICAL SKILLS:
- GenAI & Agents: LLMs, LangChain, LangGraph, Deep Agents, ReAct & tool-calling agents, multi-agent workflows, text-to-SQL, prompt engineering, structured outputs (Pydantic)
- RAG & Search: hybrid dense + sparse retrieval, Qdrant, OpenSearch, FastEmbed, Docling, chunking & embedding pipelines, metadata-filtered retrieval
- LLM Providers: AWS Bedrock, Anthropic Claude, OpenAI, OpenRouter
- Speech, Vision & Fine-tuning: AssemblyAI (speaker diarization), AWS Textract, Tesseract OCR, QLoRA, synthetic training data, Hugging Face Transformers
- Backend: Python, FastAPI, Django, Flask, REST APIs, SSE streaming, ARQ/Redis job queues, JWT auth
- Data: PostgreSQL, MySQL, MongoDB, Redis, SQLAlchemy, Alembic, sqlglot, PrestoDB, Cassandra
- Cloud & DevOps: AWS (ECS Fargate, S3, Bedrock, Textract), Docker, Docker Compose
- LLMOps & Quality: LLM evals with labelled sets & replay, OpenTelemetry tracing (Arize Phoenix), Sentry, token & cost tracking, pytest, mypy --strict, ruff, pre-commit
- ML Libraries: Pandas, NumPy, TensorFlow, Scikit-learn`
  },
  {
    id: "project-caternest",
    title: "CaterNest",
    keywords: ["caternest", "cater nest", "cater", "catering", "marketplace", "menu", "food", "ordering", "textract", "bedrock", "opensearch", "fargate"],
    content: `PROJECT — CaterNest: AI-Powered Catering Marketplace (In Production)
- Business impact: A marketplace connecting businesses with caterers. Paresh built the AI layer — a conversational assistant where customers describe what they need in plain English and it finds caterers, browses menus, and assembles orders; plus a menu-digitization pipeline that turns PDF/photo menus into structured, searchable listings, replacing hours of manual data entry per vendor with minutes.
- Technical: LangGraph multi-step agent on AWS Bedrock (Claude) with tool-calling; hybrid keyword + vector semantic search over OpenSearch; persistent conversation memory via LangGraph PostgreSQL checkpointer; PII-safe server-sent-event token streaming; menu extraction with AWS Textract OCR + LLM structuring; Redis caching; containerized services on ECS Fargate.
- Tags: LangGraph, AWS Bedrock, OpenSearch, PostgreSQL, Textract, ECS Fargate.`
  },
  {
    id: "project-policyguard",
    title: "PolicyGuard",
    keywords: ["policyguard", "policy guard", "compliance", "policy", "incident", "complaint", "risk", "regulatory", "verification", "cv parsing", "triage", "school", "safeguarding", "legislation", "excursion", "qdrant", "hybrid", "evals", "tool scan", "ai tool"],
    content: `PROJECT — PolicyGuard: AI Compliance & Safeguarding Engine for Schools (In Production)
- Business impact: A safeguarding and compliance platform for schools, where policy reviews, incident reporting and supplier checks are slow, manual and high-stakes. Paresh built the AI engine behind it — a suite of services that scans, rewrites and triages in minutes while a person still signs off on decisions that matter:
  * Policy compliance scans: scores a school's policies against the current legislation register, lists the gaps, rewrites the policy to close them, reviews changes between policy versions, and suggests refresher training for staff.
  * Incident & complaint triage: classifies seriousness from the free-text report and proposes the right escalation tier and statutory deadline; designed to escalate when in doubt, and incident suggestions can only raise severity, never lower it.
  * Risk & verification: excursion risk assessments, supplier certificate verification, CV parsing and candidate briefings, and audits of a school's public online exposure.
  * AI tool safety scanner: grades AI tools a school wants to adopt against published AI-in-education frameworks, with evidence for each finding.
- Technical: FastAPI with ARQ/Redis background workers; each service queues work, returns a job ID immediately and streams staged progress over SSE with cancel and retry. Hybrid (dense + sparse) RAG on Qdrant over legislation and framework libraries, scoped by jurisdiction and category, with separate collections so policy and framework text never mix. Docling parses PDF/DOCX into chunked, embedded indexes, evicting stale chunks when a document is replaced. Contract-first, Pydantic-validated JSON outputs per service, so the backend switches from mock to live with a config flag. Every scan records prompt version, model and engine build for reproducibility, and an eval harness replays labelled cases to catch regressions. Per-request token and cost tracking across models served through OpenRouter, attributed per school. Deployed with Docker on AWS ECS.
- Tags: FastAPI, Hybrid RAG, Qdrant, Document AI, SSE Streaming, LLM Evals.`
  },
  {
    id: "project-isleway",
    title: "IsleWay",
    keywords: ["isleway", "isle way", "travel", "tourism", "island", "destination", "concierge", "itinerary", "flutter", "trip"],
    content: `PROJECT — IsleWay: AI Travel Companion (In Production)
- Business impact: A travel platform for exploring Mediterranean island destinations. Paresh built an AI travel concierge that answers destination, itinerary, and logistics questions from the platform's curated knowledge — turning a static content site into an interactive planning experience and keeping users engaged on-platform. Built-in usage tracking keeps AI spend predictable.
- Technical: FastAPI backend with clean route → controller → service architecture; agentic chat with knowledge-base retrieval; request tracing with per-request IDs, structured logging, uniform response envelopes, centralized error handling; strict typing (mypy --strict) and pre-commit quality gates; background workers; Docker; Flutter cross-platform client.
- Tags: FastAPI, Agentic AI, RAG, Docker, Flutter.`
  },
  {
    id: "projects-other",
    title: "Other Projects",
    keywords: ["project", "portfolio", "built", "production", "chatbot", "legal", "hr", "matchmaking", "prestodb", "cassandra", "sql", "voice", "recommendation", "querymind", "clauselens", "askhr", "matchmind", "finscribe", "financial", "report", "carepilot", "care", "athleteiq", "sports", "athlete", "menuforge", "fine-tune", "fine-tuning", "qlora", "diarization"],
    content: `OTHER PROJECTS:
- FinScribe: Agent that writes and edits financial reports — a LangChain ReAct agent (Deep Agents) behind FastAPI, streamed over SSE. Every figure is bound to the calculation engine instead of typed by the model, so the agent cannot invent a number. LangGraph checkpointing on Redis plus a custom MySQL saver, OpenTelemetry tracing (Arize Phoenix), token cost tracking.
- CarePilot: Role-based assistant for a care-services app with per-role toolsets (participant, carer, support worker). Text-to-SQL runs through a guard that parses each query (sqlglot), allows reads only, and rewrites it to the user's permitted data. Also generates on-demand AI reports; FastAPI + ARQ workers on ECS.
- AthleteIQ: Generates baseline, concussion, and injury assessment reports from athlete data with LangChain + Claude, and treatment plans from session recordings via AssemblyAI speaker diarization; async Redis job queues, MySQL, JWT-secured API.
- MenuForge: Training-data pipeline for an OCR → structured JSON fine-tune. Labels are generated first, then typeset into menu pages and degraded like real photos, so ground truth is exact by construction; every page is verified against its label. Set up for QLoRA fine-tuning of a vision-language model.
- QueryMind: Chatbot leveraging PrestoDB to run SQL over Cassandra; an LLM converts natural-language questions into SQL for non-technical users.
- ClauseLens: RAG framework for legal document analysis — precise extraction with citations, in-document text highlighting, and clause comparison across contracts.
- AskHR: Voice-enabled agentic HR assistant with dynamic tool triggering — leave balances, holiday lookups, and RAG-grounded policy answers.
- MatchMind: LLM-based matchmaking recommendation system with demographic rules and smart filtering; early-stopping reduced API cost; parallel batch execution processed thousands of profiles efficiently.
FEATURED PRODUCTION PLATFORMS (see dedicated documents): CaterNest (AI catering marketplace), PolicyGuard (school compliance & safeguarding engine), IsleWay (AI travel companion).`
  },
  {
    id: "education",
    title: "Education",
    keywords: ["education", "degree", "college", "university", "cgpa", "school", "btech", "study", "graduate", "academic"],
    content: `EDUCATION:
- B.Tech in Information and Communication Technology (ICT) — Sankalchand Patel University, Visnagar (2019 – 2023) | CGPA: 8.33
- Class XII — Gurkul School of Science, Siddhpur (2018 – 2019)
- Class X — SMT S.B Doshi High School, Nandotra (2016 – 2017)`
  },
  {
    id: "fit",
    title: "Role Fit",
    keywords: ["fit", "hire", "hiring", "candidate", "suitable", "match", "position", "vacancy", "opening", "recruit", "interview", "genai role"],
    content: `ROLE FIT SUMMARY:
Paresh is an excellent fit for AI/ML Engineering, Generative AI, agentic systems, RAG, and Python backend roles.
Evidence: three production AI platforms shipped — CaterNest (AI catering marketplace: LangGraph agent on AWS Bedrock, OpenSearch semantic search, Textract menu digitization), PolicyGuard (school compliance & safeguarding engine: hybrid RAG on Qdrant, async FastAPI AI services with SSE progress, LLM evals), and IsleWay (AI travel companion: FastAPI agentic chat).
Strengths beyond model quality: cost efficiency, latency, streaming architectures, data privacy (PII-safe streaming), and measurable business impact.
For unrelated roles (Sales, UI/UX design, HR management, Finance): not aligned with his core expertise.`
  }
];

// Doc ids used when a query matches nothing specific (greetings, small talk).
const DEFAULT_DOC_IDS = ["profile", "skills", "projects-other"];

class KnowledgeModel {
  static getPersonaPrompt() {
    return PERSONA_PROMPT;
  }

  static getKnowledgeDocs() {
    return KNOWLEDGE_DOCS;
  }

  static getDefaultDocIds() {
    return DEFAULT_DOC_IDS;
  }

  static getFallbackResponse(query) {
    const q = (query || "").toLowerCase();

    if (q.includes("skill") || q.includes("technology") || q.includes("tech stack") || q.includes("python") || q.includes("aws")) {
      return `### 🛠️ Technical Skills
- **GenAI & Agents:** LLMs, LangChain, LangGraph, tool-calling agents, text-to-SQL, structured outputs
- **RAG & Search:** hybrid dense + sparse retrieval, Qdrant, OpenSearch, Docling
- **Backend:** Python, FastAPI, Django, Flask, SSE streaming, ARQ/Redis job queues
- **Cloud & Data:** AWS (Bedrock, ECS Fargate, Textract, S3), PostgreSQL, MySQL, MongoDB, Redis, Docker
- **LLMOps:** LLM evals, OpenTelemetry tracing, token & cost tracking
- **ML & Fine-tuning:** Pandas, NumPy, TensorFlow, Scikit-learn, Hugging Face, QLoRA`;
    }

    if (q.includes("experience") || q.includes("job") || q.includes("work") || q.includes("company") || q.includes("employer")) {
      return `### 💼 Work Experience
**AI Engineer** at **Encodedots** *(Feb 2026 – Present)*
- End-to-end ownership of AI solutions: system design, multi-agent architectures (LangGraph), deployment & monitoring on AWS.
- Drives LLM cost efficiency through model selection, caching, and streaming.

**Software Engineer (AI/ML)** *(Feb 2023 – Oct 2025)*
- Built RAG frameworks, LLM integrations, and NLP pipelines that optimized operational processes.
- Delivered production chatbots, document-analysis systems, and recommendation engines.

*For earlier employer specifics, please reach out to Paresh directly.*`;
    }

    if (q.includes("caternest") || q.includes("cater nest") || q.includes("cater")) {
      return `### 🍽️ CaterNest — AI-Powered Catering Marketplace
**Business:** customers order catering conversationally in plain English; caterers digitize PDF/photo menus into searchable listings in minutes instead of hours.
**Technical:** LangGraph agent on **AWS Bedrock**, hybrid semantic search on **OpenSearch**, persistent memory via **PostgreSQL checkpointer**, **PII-safe streaming**, **Textract + LLM** menu extraction, deployed on **ECS Fargate**.`;
    }

    if (q.includes("policyguard") || q.includes("policy guard") || q.includes("compliance") || q.includes("policy")) {
      return `### 🛡️ PolicyGuard — Compliance & Policy Intelligence
**Business:** automates compliance workflows for regulated care-sector organizations — policy rewriting, incident & complaint triage, risk assessment, document verification, CV parsing.
**Technical:** suite of **AI microservices** with strict JSON contracts, **RAG over regulatory frameworks**, document classification pipelines, schema-validated outputs, and per-request **AI cost tracking**.`;
    }

    if (q.includes("isleway") || q.includes("isle way") || q.includes("travel")) {
      return `### 🌍 IsleWay — AI Travel Companion
**Business:** an AI concierge that answers destination and itinerary questions from curated knowledge, turning a content site into an interactive planner.
**Technical:** **FastAPI** layered architecture, agentic chat with knowledge retrieval, request tracing, usage/cost tracking, strict typing, Docker, and a **Flutter** client.`;
    }

    if (q.includes("project") || q.includes("portfolio") || q.includes("built") || q.includes("production")) {
      return `### 🚀 Featured Production Projects
1. **CaterNest** — AI catering marketplace: conversational ordering assistant + Textract/LLM menu digitization (LangGraph, Bedrock, OpenSearch, Fargate).
2. **PolicyGuard** — compliance intelligence engine: policy rewriting, incident triage, risk & document verification AI services (RAG, FastAPI).
3. **IsleWay** — AI travel companion for a regional island-tourism platform (FastAPI, agentic chat, Flutter).

**Also:** QueryMind, ClauseLens, AskHR, MatchMind.`;
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

He has shipped **three production AI platforms** — an AI catering marketplace (CaterNest), a compliance intelligence engine (PolicyGuard), and an AI travel companion (IsleWay) — on AWS with LangGraph, Bedrock, and FastAPI. Contact him at prajapatipareshkumar1032@gmail.com!`;
    }

    return `Hi! I'm Paresh's AI Assistant.

Paresh Prajapati is an **AI/ML Engineer & Generative AI Specialist** with 3+ years of experience shipping **production AI platforms** — agentic assistants, RAG pipelines, and document intelligence on AWS.

Feel free to ask me about his:
- 🛠️ **Skills & Tech Stack**
- 💼 **Work Experience**
- 🚀 **Projects** (CaterNest, PolicyGuard, IsleWay, and more)
- 📞 **Contact Information**`;
  }
}

module.exports = KnowledgeModel;
