const AgentService = require("../services/AgentService");
const KnowledgeModel = require("./KnowledgeModel");
const { PortfolioRetriever, extractTopics } = require("../services/RetrieverService");

const sessionsStore = new Map();
const MAX_HISTORY_MESSAGES = 10;

const retriever = new PortfolioRetriever({ k: 3 });

class ChatModel {
  static getSessionHistory(sessionId) {
    if (!sessionsStore.has(sessionId)) {
      sessionsStore.set(sessionId, []);
    }
    return sessionsStore.get(sessionId);
  }

  static addSessionMessage(sessionId, role, content) {
    const history = this.getSessionHistory(sessionId);
    history.push({ role, content });

    if (history.length > MAX_HISTORY_MESSAGES * 2) {
      history.splice(0, history.length - MAX_HISTORY_MESSAGES * 2);
    }
  }

  // Runs the agent pipeline (analyze -> retrieve -> generate), emitting
  // events as it goes: {trace}, {content}, {meta}. Also returns the collected
  // trace + reply + meta so buffered transports (Netlify) can replay them.
  static async streamReply(message, sessionId = "default_session", onEvent) {
    if (!message || typeof message !== "string") {
      throw new Error("Message text is required.");
    }

    const emit = typeof onEvent === "function" ? onEvent : () => {};
    const collectedTrace = [];
    const traceEvent = (data) => {
      if (data.status === "done") {
        collectedTrace.push(data);
      }
      emit({ trace: data });
    };

    const startedAt = Date.now();

    // 1. Analyze — extract the query terms that drive retrieval.
    let stepStart = Date.now();
    traceEvent({ step: "analyze", status: "start", label: "Analyzing query" });
    const topics = extractTopics(message);
    traceEvent({
      step: "analyze",
      status: "done",
      label: "Analyzing query",
      detail: topics.length ? `intent: ${topics.slice(0, 4).join(", ")}` : "general question",
      ms: Date.now() - stepStart
    });

    // 2. Retrieve — LangChain retriever over the chunked knowledge base.
    stepStart = Date.now();
    traceEvent({ step: "retrieve", status: "start", label: "Searching knowledge base" });
    const docs = await retriever.invoke(message);
    const docTitles = docs.map((d) => d.metadata.title).join(", ");
    traceEvent({
      step: "retrieve",
      status: "done",
      label: "Searching knowledge base",
      detail: `${docs.length} chunk${docs.length === 1 ? "" : "s"} · ${docTitles}`,
      ms: Date.now() - stepStart
    });

    // 3. Generate — LangChain prompt -> ChatGroq stream, with silent fallback
    // to the curated knowledge base so visitors never see provider errors.
    stepStart = Date.now();
    const liveModel = AgentService.isAvailable();
    traceEvent({
      step: "generate",
      status: "start",
      label: "Generating response",
      detail: liveModel ? `${AgentService.model} · Groq` : "curated response"
    });

    const history = this.getSessionHistory(sessionId);
    let reply = "";
    let usage = null;
    let engine = AgentService.model;

    try {
      const result = await AgentService.generate(message, history, docs, (token) => {
        emit({ content: token });
      });
      reply = result.reply;
      usage = result.usage;
    } catch (error) {
      console.warn("Groq API streaming notice:", error.message);
      engine = "curated";
      reply = KnowledgeModel.getFallbackResponse(message);

      // Stream fallback reply chunk by chunk to simulate smooth streaming UX
      const chunkSize = 8;
      for (let i = 0; i < reply.length; i += chunkSize) {
        emit({ content: reply.slice(i, i + chunkSize) });
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    traceEvent({
      step: "generate",
      status: "done",
      label: "Generating response",
      detail: engine === "curated" ? "curated response" : `${engine} · Groq`,
      ms: Date.now() - stepStart
    });

    // Token accounting: real usage from the provider when available,
    // otherwise a chars/4 estimate (flagged so the UI can mark it "~").
    const estimated = !usage;
    const promptChars =
      KnowledgeModel.getPersonaPrompt().length +
      docs.reduce((sum, d) => sum + d.pageContent.length, 0) +
      message.length;

    const meta = {
      total_ms: Date.now() - startedAt,
      model: engine,
      chunks: docs.length,
      input_tokens: usage ? usage.input_tokens : Math.round(promptChars / 4),
      output_tokens: usage ? usage.output_tokens : Math.round(reply.length / 4),
      estimated
    };
    emit({ meta });

    this.addSessionMessage(sessionId, "user", message);
    this.addSessionMessage(sessionId, "assistant", reply);

    return { reply, trace: collectedTrace, meta };
  }
}

module.exports = ChatModel;
