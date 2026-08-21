const ChatModel = require("../models/ChatModel");
const TranscriptionService = require("../services/TranscriptionService");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Content-Type": "application/json"
};

class ChatController {
  // Express streaming handler — SSE events: {trace}, {content}, {meta}, {done}
  static async handleStreamChatMessage(req, res) {
    try {
      const message = req.body?.message || req.body?.input;
      const sessionId = req.body?.session_id || "default_session";

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Field 'message' must be a non-empty string." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      await ChatModel.streamReply(message.trim(), sessionId, sendEvent);

      sendEvent({ done: true });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("ChatController Stream Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message || "Internal Server Error" });
      }
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  // Netlify Serverless Function handler — buffered JSON. The pipeline trace
  // (with real per-step timings) is returned so the frontend can replay it.
  static async handleNetlifyStreamEvent(event, context) {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: "OK" })
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Method Not Allowed. Use POST." })
      };
    }

    try {
      let body = {};
      if (event.body) {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      }

      const message = body.message || body.input;
      const sessionId = body.session_id || "default_session";

      if (!message || typeof message !== "string" || !message.trim()) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Field 'message' must be a non-empty string." })
        };
      }

      const { reply, trace, meta } = await ChatModel.streamReply(message.trim(), sessionId);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ reply, trace, meta })
      };
    } catch (error) {
      console.error("Netlify Event Error:", error);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: error.message || "Internal Server Error" })
      };
    }
  }

  // Express voice transcription handler — body: {audio: base64, mime}
  static async handleTranscribe(req, res) {
    try {
      const result = await TranscriptionService.transcribeBase64(req.body?.audio, req.body?.mime);
      return res.json(result);
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("Transcription Error:", error.message);
      return res.status(status).json({ error: error.publicMessage || "Transcription failed." });
    }
  }

  // Netlify voice transcription handler
  static async handleNetlifyTranscribeEvent(event, context) {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: "OK" })
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Method Not Allowed. Use POST." })
      };
    }

    try {
      let body = {};
      if (event.body) {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      }

      const result = await TranscriptionService.transcribeBase64(body.audio, body.mime);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result)
      };
    } catch (error) {
      console.error("Netlify Transcription Error:", error.message);
      return {
        statusCode: error.statusCode || 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: error.publicMessage || "Transcription failed." })
      };
    }
  }
}

module.exports = ChatController;
