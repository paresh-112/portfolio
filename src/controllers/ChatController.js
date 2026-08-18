const ChatModel = require("../models/ChatModel");

class ChatController {
  // Express streaming handler
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

      await ChatModel.streamReply(message.trim(), sessionId, (chunk) => {
        sendEvent({ content: chunk });
      });

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

  // Netlify Serverless Function streaming event handler
  static async handleNetlifyStreamEvent(event, context) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ status: "OK" })
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
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
          headers: corsHeaders,
          body: JSON.stringify({ error: "Field 'message' must be a non-empty string." })
        };
      }

      let fullReply = "";
      await ChatModel.streamReply(message.trim(), sessionId, (chunk) => {
        fullReply += chunk;
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ reply: fullReply })
      };
    } catch (error) {
      console.error("Netlify Event Error:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message || "Internal Server Error" })
      };
    }
  }
}

module.exports = ChatController;
