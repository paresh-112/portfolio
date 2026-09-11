// Netlify Functions v2 (ESM). v2 handlers can return a Response whose body is a
// ReadableStream, which is what lets the deployed site stream tokens over SSE.
// The previous v1 handler returned a buffered JSON payload, so ChatModel's
// per-token callback was never wired up and nothing streamed in production.
import ChatModel from "../../src/models/ChatModel.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed. Use POST." }, 405);
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const message = body.message || body.input;
  const sessionId = body.session_id || "default_session";

  if (!message || typeof message !== "string" || !message.trim()) {
    return json({ error: "Field 'message' must be a non-empty string." }, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Passing `send` as onEvent is the whole point: trace steps, tokens and
        // meta now reach the client as they happen instead of after completion.
        await ChatModel.streamReply(message.trim(), sessionId, send);
        send({ done: true });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("Netlify chat stream error:", error);
        send({ error: error.message || "Internal Server Error" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Stops nginx-style proxies from buffering the stream into one response.
      "X-Accel-Buffering": "no"
    }
  });
};

// v2 functions declare their own routes, replacing the netlify.toml redirects.
export const config = {
  path: ["/api/chat", "/chat"]
};
