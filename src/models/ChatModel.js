const GroqService = require("../services/GroqService");
const KnowledgeModel = require("./KnowledgeModel");

const sessionsStore = new Map();
const MAX_HISTORY_MESSAGES = 10;

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

  static async streamReply(message, sessionId = "default_session", onChunk) {
    if (!message || typeof message !== "string") {
      throw new Error("Message text is required.");
    }

    const history = this.getSessionHistory(sessionId);
    const systemPrompt = KnowledgeModel.getSystemPrompt();

    try {
      const fullReply = await GroqService.streamCompletion(systemPrompt, history, message, onChunk);
      this.addSessionMessage(sessionId, "user", message);
      this.addSessionMessage(sessionId, "assistant", fullReply);
      return fullReply;
    } catch (error) {
      console.warn("Groq API streaming notice:", error.message);
      
      // Fall back to the built-in knowledge base silently — visitors should
      // never see internal API-key or provider errors.
      const fallbackReply = KnowledgeModel.getFallbackResponse(message);

      // Stream fallback reply chunk by chunk to simulate smooth streaming UX
      const chunkSize = 8;
      for (let i = 0; i < fallbackReply.length; i += chunkSize) {
        const chunk = fallbackReply.slice(i, i + chunkSize);
        if (typeof onChunk === "function") {
          onChunk(chunk);
        }
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      this.addSessionMessage(sessionId, "user", message);
      this.addSessionMessage(sessionId, "assistant", fallbackReply);
      return fallbackReply;
    }
  }
}

module.exports = ChatModel;
