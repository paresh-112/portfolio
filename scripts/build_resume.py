"""Builds Paresh_Prajapati_Resume.pdf from the content below.

Run from the repo root:  python3 scripts/build_resume.py
Needs reportlab (pip install reportlab).

The layout follows Paresh's original Word/Canva resume: centred name and
contact line, centred section titles over a thin rule, bold labels for
skills, and plain bullet points written in simple language.
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent.parent / "Paresh_Prajapati_Resume.pdf"

BLACK = HexColor("#000000")
LINK = HexColor("#1155cc")
RULE = HexColor("#7f7f7f")

PHONE = "+91 8849581032"
EMAIL = "prajapatipareshkumar1032@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/paresh-prajapati-00a5b7243"
GITHUB = "https://github.com/paresh-112"
WEBSITE = "https://pareshprajapati.netlify.app"

# --- Content -----------------------------------------------------------------

SUMMARY = (
    "AI/ML Engineer with 3+ years of experience in Generative AI and LLM-based solutions. "
    "I have built and deployed AI products that are running in production, including a catering "
    "marketplace assistant, a compliance engine for schools and a travel assistant. I work on the "
    "complete solution, from design and development to deployment on AWS, using tools like "
    "LangChain, LangGraph, RAG and FastAPI, while continuously upgrading my skills."
)

SKILLS = [
    ("Programming Languages and related framework", "Python, FastAPI, Django, Flask, REST APIs"),
    ("AI/ML Tools", "Generative AI, LLMs, Natural Language Processing (NLP), AI Agents, "
     "Multi-agent workflows, RAG, Prompt engineering, Text-to-SQL, Fine-tuning (QLoRA), ML Algorithms"),
    ("Libraries &amp; Frameworks", "LangChain, LangGraph, Deep Agents, Pydantic, Hugging Face "
     "Transformers, Pandas, NumPy, TensorFlow, Scikit-learn"),
    ("LLM Providers", "AWS Bedrock, Anthropic Claude, OpenAI, OpenRouter"),
    ("Vector DB &amp; Search", "Qdrant, OpenSearch, FastEmbed, Docling"),
    ("OCR &amp; Speech", "AWS Textract, Tesseract OCR, AssemblyAI"),
    ("Databases", "PostgreSQL, MySQL, MongoDB, Redis, Cassandra, PrestoDB, SQLAlchemy, Alembic"),
    ("Cloud &amp; DevOps", "AWS (ECS Fargate, S3, Bedrock, Textract), Docker, Docker Compose, Git/GitHub"),
    ("Testing &amp; Monitoring", "pytest, mypy, ruff, Sentry, OpenTelemetry, Arize Phoenix, LLM evaluation"),
    ("Relevant Coursework", "Object Oriented Programming, Database Management System, Software Engineering"),
]

EXPERIENCE = [
    ("Encodedots - AI Engineer", "Feb 2026 – Present", [
        "Took full ownership of end-to-end AI solution development, from system design and agent "
        "architecture to deployment and monitoring on AWS.",
        "Designed scalable multi-agent workflows using LangGraph for chat assistants, semantic "
        "search and document processing.",
        "Reduced LLM cost and response time through model selection, caching, token usage "
        "tracking and streaming responses.",
    ]),
    ("Software Engineer (AI/ML)", "Feb 2023 – Oct 2025", [
        "Gained hands-on experience in applying AI/ML solutions to optimize operational processes, "
        "including RAG systems, LLM integrations and NLP pipelines.",
        "Collaborated with team members on all stages of project development, from brainstorming "
        "problem definitions to implementing and evaluating solutions.",
        "Developed chatbots, document analysis systems and recommendation engines for clients.",
        "Developed proficiency in data pre-processing, model training and evaluation techniques.",
    ]),
]

PROJECTS = [
    ("CaterNest - AI Catering Marketplace", [
        "Built the AI part of a catering marketplace where customers can place orders by chatting "
        "in plain English.",
        "Developed a LangGraph agent on AWS Bedrock (Claude) that uses tool calling and hybrid "
        "keyword and vector search on OpenSearch to find the right menu items.",
        "Built a menu extraction pipeline with AWS Textract and an LLM that turns PDF and photo "
        "menus into structured listings, which cut menu setup from hours to minutes.",
        "Added conversation memory with a PostgreSQL checkpointer, Redis caching and streaming "
        "responses with PII protection, and deployed the services on AWS ECS Fargate.",
    ]),
    ("PolicyGuard - AI Compliance Engine for Schools", [
        "Developed the AI engine for a school safeguarding and compliance platform that checks "
        "school policies against legislation, lists the gaps and suggests rewrites.",
        "It also handles incident and complaint triage, excursion risk assessments, supplier "
        "certificate checks, CV parsing and safety checks for AI tools used in schools.",
        "Built hybrid RAG (dense and sparse retrieval) on Qdrant over legislation documents, and "
        "used Docling to read PDF and DOCX files.",
        "Used FastAPI with ARQ/Redis background workers, so long tasks run as jobs and show live "
        "progress to the user with cancel and retry.",
        "Added human sign-off for triage results, tracking of prompt and model versions, an "
        "evaluation set to test changes, and cost tracking for every request.",
    ]),
    ("IsleWay - AI Travel Assistant", [
        "Developed an AI assistant for an island travel platform that answers questions about "
        "destinations, itineraries and travel planning.",
        "Built the backend in FastAPI with a clean route, controller and service structure, "
        "knowledge base retrieval and background workers.",
        "Added request tracing, structured logging, error handling and strict type checking. The "
        "API is used by a Flutter mobile app.",
    ]),
    ("FinScribe - Financial Report Writer", [
        "Built an AI agent that writes and edits financial reports using LangChain (Deep Agents) "
        "and FastAPI, with streaming responses.",
        "Every number in the report comes from the calculation engine and not from the model, so "
        "the agent cannot make up figures.",
        "Used Redis and MySQL to save the agent state, and OpenTelemetry (Arize Phoenix) for "
        "tracing and token cost tracking.",
    ]),
    ("CarePilot - Care Services Assistant", [
        "Developed a role-based assistant for a care services app, where participants, carers and "
        "support workers each get their own set of tools.",
        "Built a text-to-SQL feature with a safety check (sqlglot) that only allows read queries "
        "and limits results to the data each user is allowed to see.",
        "Added AI-generated reports using FastAPI and ARQ workers on AWS ECS.",
    ]),
    ("AthleteIQ - Athlete Assessment Reports", [
        "Generated baseline, concussion and injury assessment reports from athlete data using "
        "LangChain and Claude.",
        "Created treatment plans from session recordings using AssemblyAI speech-to-text with "
        "speaker detection.",
        "Used Redis job queues, MySQL and a JWT-secured API.",
    ]),
    ("MenuForge - Training Data Pipeline", [
        "Built a pipeline that creates training data for a model that reads menu images and "
        "returns structured JSON.",
        "The labels are created first and then turned into realistic menu pages, so every "
        "training sample has an exact correct answer.",
        "Prepared the data for QLoRA fine-tuning of a vision-language model.",
    ]),
    ("QueryMind - Database Communication Chatbot", [
        "Developed a database communication chatbot leveraging PrestoDB to enable SQL query "
        "capabilities on Cassandra databases. Integrated an LLM to convert natural language "
        "queries into SQL.",
        "This solution simplified database queries for non-technical users and improved access "
        "to complex datasets.",
    ]),
    ("ClauseLens - Legal Document Search", [
        "Developed a Retrieval-Augmented Generation (RAG) framework for legal document processing "
        "and analysis, giving accurate answers from multiple documents.",
        "Generated citations with direct links to specific document pages and highlighted the "
        "relevant text within the source documents.",
        "Compared clauses across documents to find key similarities and differences, which made "
        "contract review faster.",
    ]),
    ("AskHR - Intelligent HR Assistant", [
        "Developed an agentic AI HR assistant that gives employees easy access to HR services and "
        "internal policy documents.",
        "Designed a multi-tool system where tools are triggered based on user intent, for tasks "
        "like leave balance queries, holiday lookups and policy questions.",
        "Integrated voice input using speech recognition, and used RAG to answer from HR policy "
        "documents.",
    ]),
    ("MatchMind - Matchmaking Recommendations", [
        "Worked on an AI-based recommendation system that suggests the best matchmaking profiles "
        "using LLMs and smart filtering.",
        "Improved matching accuracy by applying demographic rules (age, gender, preferences).",
        "Reduced API cost with an early-stopping feature and processed thousands of profiles "
        "with parallel batch processing.",
    ]),
]

EDUCATION = [
    ("Sankalchand Patel University, Visnagar", "B.Tech (ICT)&nbsp;&nbsp;|&nbsp;&nbsp;CGPA: <b>8.33</b>",
     "2019 – 2023"),
    ("Gurkul School of Science, Siddhpur", "Class XII", "2018 – 2019"),
    ("SMT S.B Doshi High School, Nandotra", "Class X", "2016 – 2017"),
]

LANGUAGES = [("English", "Proficient"), ("Hindi", "Proficient"), ("Gujarati", "Native")]

# --- Layout ------------------------------------------------------------------

# Embed Arial when it is available so the PDF looks the same in every viewer;
# otherwise fall back to ReportLab's built-in Helvetica.
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
try:
    pdfmetrics.registerFont(TTFont("Body", str(FONT_DIR / "Arial.ttf")))
    pdfmetrics.registerFont(TTFont("Body-Bold", str(FONT_DIR / "Arial Bold.ttf")))
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold")
    FONT, BOLD, DOT = "Body", "Body-Bold", "\u25cf"
except Exception:
    FONT, BOLD, DOT = "Helvetica", "Helvetica-Bold", "*"

base = ParagraphStyle("base", fontName=FONT, fontSize=9.6, leading=12.6, textColor=BLACK)
name_s = ParagraphStyle("name", parent=base, fontName=BOLD, fontSize=21, leading=25,
                        alignment=TA_CENTER)
contact_s = ParagraphStyle("contact", parent=base, fontSize=9.5, alignment=TA_CENTER)
section_s = ParagraphStyle("section", parent=base, fontSize=11.5, leading=14, alignment=TA_CENTER,
                           spaceBefore=10)
entry_s = ParagraphStyle("entry", parent=base, fontName=BOLD, spaceBefore=6)
date_s = ParagraphStyle("date", parent=base, spaceAfter=1)
skill_s = ParagraphStyle("skill", parent=base, leftIndent=8, spaceAfter=2)
right_s = ParagraphStyle("right", parent=base, alignment=2)

MARGIN = 16 * mm
CONTENT_W = A4[0] - 2 * MARGIN


def link(url, text):
    return f'<font color="{LINK.hexval().replace("0x", "#")}"><u><a href="{url}">{text}</a></u></font>'


def section(title, first):
    """A centred section title over a rule, kept on the same page as its first entry."""
    heading = Paragraph(title, section_s)
    rule = HRFlowable(width="100%", thickness=0.6, color=RULE, spaceBefore=2, spaceAfter=4)
    return [KeepTogether([heading, rule] + (first if isinstance(first, list) else [first]))]


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(text, base), leftIndent=22, value="•") for text in items],
        bulletType="bullet", bulletFontName=FONT, bulletFontSize=10, leftIndent=22, bulletOffsetY=0, spaceBefore=1,
    )


def entry(title, items, date=None):
    parts = [Paragraph(title, entry_s)]
    if date:
        parts.append(Paragraph(date, date_s))
    parts.append(bullets(items))
    return parts


def education_row(school, detail, years):
    t = Table([
        [Paragraph(f"<b>{school}</b>", base), ""],
        [Paragraph(detail, base), Paragraph(years, right_s)],
    ], colWidths=[CONTENT_W * 0.75, CONTENT_W * 0.25])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return [t, Spacer(1, 3)]


def languages_row():
    dots = f'<font size="8">{DOT * 5}</font>'
    cells = [Paragraph(f"{lang} ({level})&nbsp;&nbsp;&nbsp;{dots}", ParagraphStyle(
        "lang", parent=base, alignment=TA_CENTER)) for lang, level in LANGUAGES]
    t = Table([cells], colWidths=[CONTENT_W / 3] * 3)
    t.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2)]))
    return t


def build():
    sep = "&nbsp;|&nbsp;"
    story = [
        Paragraph("Paresh Prajapati", name_s),
        Paragraph(
            f"{PHONE}{sep}{link('mailto:' + EMAIL, EMAIL)}{sep}{link(LINKEDIN, 'LinkedIn')}"
            f"{sep}{link(GITHUB, 'GitHub')}{sep}{link(WEBSITE, 'Portfolio')}",
            contact_s,
        ),
        Spacer(1, 2),
    ]

    story += section("Summary", Paragraph(SUMMARY, base))

    story += section("Technical Skills", [Paragraph(f"<b>{k}:</b> {v}", skill_s) for k, v in SKILLS])

    jobs = [entry(title, items, dates) for title, dates, items in EXPERIENCE]
    story += section("Experience", jobs[0]) + [KeepTogether(j) for j in jobs[1:]]

    projects = [entry(title, items) for title, items in PROJECTS]
    story += section("Projects", projects[0]) + [KeepTogether(p) for p in projects[1:]]

    rows = [education_row(*row) for row in EDUCATION]
    story += section("Education", [Spacer(1, 3)] + [f for r in rows for f in r])

    story += section("Languages", languages_row())

    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=14 * mm, bottomMargin=14 * mm,
        title="Paresh Prajapati - Resume", author="Paresh Prajapati",
        subject="Resume of Paresh Prajapati, AI/ML Engineer",
        keywords="Paresh Prajapati, AI/ML Engineer, Generative AI, LLM, RAG, LangChain, LangGraph",
    )
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
