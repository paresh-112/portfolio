"""Builds Paresh_Prajapati_Resume.pdf from the content below.

Run from the repo root:  python3 scripts/build_resume.py
Needs reportlab (pip install reportlab).
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
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

INK = HexColor("#1a2333")
ACCENT = HexColor("#4f46e5")
MUTED = HexColor("#5a6478")
RULE = HexColor("#c9d0de")

EMAIL = "prajapatipareshkumar1032@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/paresh-prajapati-00a5b7243"
GITHUB = "https://github.com/paresh-112"

# Helvetica has no arrow glyph; the Symbol font does.
ARROW = '<font name="Symbol">→</font>'

# --- Content -----------------------------------------------------------------

SUMMARY = (
    "AI/ML Engineer with 3+ years of experience taking Generative AI products from design to "
    "production. Shipped three live AI platforms — a catering marketplace assistant, a compliance "
    "and safeguarding engine for schools, and a travel companion — alongside agentic report "
    "writers, text-to-SQL agents with strict data guardrails, and a fine-tuning data pipeline. "
    "Builds on LangChain/LangGraph, hybrid RAG, and async FastAPI services on AWS, with a focus on "
    "evaluation, human oversight, cost efficiency, and latency."
)

SKILLS = [
    ("GenAI &amp; Agents", "LLMs, LangChain, LangGraph, Deep Agents, ReAct &amp; tool-calling agents, "
     "multi-agent workflows, text-to-SQL, prompt engineering, structured outputs (Pydantic)"),
    ("RAG &amp; Search", "Hybrid dense + sparse retrieval, Qdrant, OpenSearch, FastEmbed, Docling, "
     "chunking &amp; embedding pipelines, metadata-filtered retrieval"),
    ("LLM Providers", "AWS Bedrock, Anthropic Claude, OpenAI, OpenRouter"),
    ("Speech, Vision &amp; Fine-tuning", "AssemblyAI (speaker diarization), AWS Textract, Tesseract OCR, "
     "QLoRA, synthetic training data, Hugging Face Transformers"),
    ("Backend", "Python, FastAPI, Django, Flask, REST APIs, SSE streaming, ARQ/Redis job queues, JWT auth"),
    ("Data", "PostgreSQL, MySQL, MongoDB, Redis, SQLAlchemy, Alembic, sqlglot, PrestoDB, Cassandra"),
    ("Cloud &amp; DevOps", "AWS (ECS Fargate, S3, Bedrock, Textract), Docker, Docker Compose"),
    ("LLMOps &amp; Quality", "LLM evals with labelled sets &amp; replay, OpenTelemetry tracing "
     "(Arize Phoenix), Sentry, token &amp; cost tracking, pytest, mypy --strict, ruff, pre-commit"),
    ("ML Libraries", "Pandas, NumPy, TensorFlow, Scikit-learn"),
]

EXPERIENCE = [
    ("AI Engineer — Encodedots", "Feb 2026 – Present", [
        "Own end-to-end AI solution development — system design, agent architecture, deployment, "
        "and monitoring on AWS.",
        "Design scalable multi-agent workflows (LangGraph) powering conversational assistants, "
        "semantic search, and document intelligence in production.",
        "Drive cost efficiency across LLM workloads through model selection, caching strategies, "
        "token-usage tracking, and streaming architectures.",
    ]),
    ("Software Engineer (AI/ML)", "Feb 2023 – Oct 2025", [
        "Built and shipped AI/ML solutions optimizing operational processes — RAG frameworks, LLM "
        "integrations, and NLP pipelines.",
        "Collaborated across all project stages, from problem definition and data preparation to "
        "model evaluation and delivery.",
        "Developed production chatbots, document-analysis systems, and recommendation engines used "
        "by real clients.",
    ]),
]

FEATURED = [
    ("CaterNest — AI-Powered Catering Marketplace", [
        ("Business", "built the AI layer of a catering marketplace — customers assemble orders "
         "conversationally in plain English, and caterers digitize PDF/photo menus into structured, "
         "searchable listings in minutes instead of hours of manual entry."),
        ("Agent stack", "LangGraph multi-step agent on AWS Bedrock (Claude) with tool-calling into "
         "hybrid keyword + vector semantic search over OpenSearch."),
        ("Production hardening", "persistent conversation memory via LangGraph PostgreSQL "
         "checkpointer, PII-safe SSE token streaming, Redis caching, containerized services on ECS "
         "Fargate."),
        ("Menu extraction", "AWS Textract OCR + LLM structuring pipeline converting raw menu "
         "documents into normalized catalog data."),
    ]),
    ("PolicyGuard — AI Compliance &amp; Safeguarding Engine for Schools", [
        ("Business", "AI engine for a school safeguarding and compliance platform — policy scans "
         "against the legislation register with gap lists and rewrites, incident and complaint "
         "triage, excursion risk assessments, supplier certificate checks, CV parsing, and an AI "
         "tool safety scanner graded against AI-in-education frameworks."),
        ("Async job engine", "FastAPI with ARQ/Redis workers; every service queues work, returns a "
         "job ID immediately, and streams staged progress over SSE with cancel and retry. "
         "Contract-first Pydantic JSON lets the backend switch from mock to live with a config flag."),
        ("Hybrid RAG", "dense + sparse retrieval on Qdrant (FastEmbed) over legislation and framework "
         "libraries, scoped by jurisdiction and category; Docling parses PDF/DOCX for ingestion, "
         "with stale chunks evicted when a document is replaced."),
        ("Safety &amp; quality", "escalate-on-doubt triage with human sign-off (AI can raise "
         "severity, never lower it); every scan records prompt version, model, and engine build; "
         "an eval harness replays labelled cases; per-request cost tracking via OpenRouter."),
    ]),
    ("IsleWay — AI Travel Companion", [
        ("Business", "AI concierge for an island travel platform — answers destination, itinerary, "
         "and logistics questions from curated knowledge, turning static content into an "
         "interactive planning experience."),
        ("Backend", f"FastAPI service with clean route {ARROW} controller {ARROW} service architecture, agentic "
         "chat with knowledge-base retrieval, and background workers."),
        ("Production hygiene", "per-request tracing, structured logging, uniform response "
         "envelopes, centralized error handling, strict typing (mypy --strict), Docker; consumed "
         "by a Flutter cross-platform client."),
    ]),
]

ADDITIONAL = [
    ("FinScribe", "agent that writes and edits financial reports — a LangChain ReAct agent (Deep "
     "Agents) behind FastAPI, streamed over SSE. Every figure is bound to the calculation engine "
     "instead of typed by the model, so the agent cannot invent a number. LangGraph checkpointing "
     "on Redis plus a custom MySQL saver, OpenTelemetry tracing (Arize Phoenix), token cost tracking."),
    ("CarePilot", "role-based assistant for a care-services app with per-role toolsets "
     "(participant, carer, support worker). Text-to-SQL runs through a guard that parses each "
     "query (sqlglot), allows reads only, and rewrites it to the user's permitted data. Also "
     "generates on-demand AI reports; FastAPI + ARQ workers on ECS."),
    ("AthleteIQ", "generates baseline, concussion, and injury assessment reports from athlete data "
     "with LangChain + Claude, and treatment plans from session recordings via AssemblyAI speaker "
     "diarization; async Redis job queues, MySQL, JWT-secured API."),
    ("MenuForge", f"training-data pipeline for an OCR {ARROW} structured JSON fine-tune. Labels are "
     "generated first, then typeset into menu pages and degraded like real photos, so ground "
     "truth is exact by construction; every page is verified against its label. Set up for QLoRA "
     "fine-tuning of a vision-language model."),
    ("QueryMind", "LLM converts natural-language questions into SQL executed via PrestoDB over "
     "Cassandra, opening complex datasets to non-technical users."),
    ("ClauseLens", "RAG framework for legal document analysis — precise extraction with citations, "
     "in-document highlighting, and clause comparison across contracts."),
    ("AskHR", "voice-enabled agentic assistant with dynamic tool triggering for leave balances, "
     "holiday lookups, and RAG-grounded policy answers."),
    ("MatchMind", "LLM-based matchmaking recommendations with demographic rules; early-stopping cut "
     "unnecessary API spend and parallel batch execution processed thousands of profiles "
     "efficiently."),
]

EDUCATION = [
    ("<b>B.Tech, Information &amp; Communication Technology (ICT)</b> — Sankalchand Patel "
     "University, Visnagar&nbsp;&nbsp;|&nbsp;&nbsp;CGPA: 8.33", "2019 – 2023"),
    ("<b>Class XII</b> — Gurkul School of Science, Siddhpur", "2018 – 2019"),
    ("<b>Class X</b> — SMT S.B Doshi High School, Nandotra", "2016 – 2017"),
]

LANGUAGES = "English (Proficient)&nbsp;&nbsp;•&nbsp;&nbsp;Hindi (Proficient)&nbsp;&nbsp;•&nbsp;&nbsp;Gujarati (Native)"

# --- Layout ------------------------------------------------------------------

base = ParagraphStyle("base", fontName="Helvetica", fontSize=9.5, leading=12.9, textColor=INK)
name_s = ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=22, leading=26,
                        alignment=TA_CENTER)
title_s = ParagraphStyle("title", parent=base, fontName="Helvetica-Bold", fontSize=10.5,
                         leading=14, textColor=ACCENT, alignment=TA_CENTER)
contact_s = ParagraphStyle("contact", parent=base, textColor=MUTED, alignment=TA_CENTER)
section_s = ParagraphStyle("section", parent=base, fontName="Helvetica-Bold", fontSize=11.5,
                           leading=14, textColor=ACCENT, spaceBefore=9)
entry_s = ParagraphStyle("entry", parent=base, fontName="Helvetica-Bold", fontSize=10.5, leading=14)
right_s = ParagraphStyle("right", parent=base, textColor=MUTED, alignment=2)
skill_s = ParagraphStyle("skill", parent=base, spaceAfter=1.5)

CONTENT_W = A4[0] - 2 * 20 * mm


def section(title):
    heading = Paragraph(title.upper(), section_s)
    rule = HRFlowable(width="100%", thickness=0.8, color=RULE, spaceBefore=2, spaceAfter=5)
    heading.keepWithNext = rule.keepWithNext = True
    return [heading, rule]


def header_row(left, right, left_style=entry_s):
    t = Table([[Paragraph(left, left_style), Paragraph(right, right_s)]],
              colWidths=[CONTENT_W * 0.78, CONTENT_W * 0.22])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    t.keepWithNext = True
    return t


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(text, base), leftIndent=10, value="•") for text in items],
        bulletType="bullet", bulletFontSize=10, leftIndent=10, bulletOffsetY=0, spaceBefore=1,
    )


def labelled(items):
    return bullets([f"<b>{label}:</b> {text}" for label, text in items])


def build():
    link = f'<font color="{ACCENT.hexval().replace("0x", "#")}">'
    story = [
        Paragraph("Paresh Prajapati", name_s),
        Paragraph("AI/ML Engineer&nbsp;&nbsp;|&nbsp;&nbsp;Generative AI Specialist", title_s),
        Paragraph(
            f'+91 8849581032&nbsp;&nbsp;|&nbsp;&nbsp;{link}<a href="mailto:{EMAIL}">{EMAIL}</a></font>&nbsp;&nbsp;|&nbsp;&nbsp;'
            f'{link}<a href="{LINKEDIN}">LinkedIn</a></font>&nbsp;&nbsp;|&nbsp;&nbsp;'
            f'{link}<a href="{GITHUB}">GitHub</a></font>',
            contact_s,
        ),
        Spacer(1, 4),
    ]

    story += section("Summary") + [Paragraph(SUMMARY, base)]

    story += section("Technical Skills")
    story += [Paragraph(f"<b>{k}:</b> {v}", skill_s) for k, v in SKILLS]

    story += section("Experience")
    for role, dates, items in EXPERIENCE:
        story.append(KeepTogether([header_row(role, dates), bullets(items)]))

    # Projects may break across a page; their title rows stay with the bullets.
    story += section("Featured Production Projects")
    for title, items in FEATURED:
        story += [header_row(title, "In Production"), labelled(items)]

    story += section("Additional Projects")
    story.append(labelled(ADDITIONAL))

    story += section("Education")
    for left, right in EDUCATION:
        story.append(header_row(left, right, left_style=base))

    story += section("Languages") + [Paragraph(LANGUAGES, base)]

    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=14 * mm, bottomMargin=14 * mm,
        title="Paresh Prajapati — Resume", author="Paresh Prajapati",
    )
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
