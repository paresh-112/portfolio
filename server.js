const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const chatRoutes = require("./src/routes/ChatRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// 10mb: voice queries arrive as base64 audio in the JSON body
app.use(express.json({ limit: "10mb" }));

// Content + admin API: the same handlers the Netlify Functions use, adapted
// from Express to web Request/Response. Locally, data lives in .data/.
async function toWebRequest(req) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (key !== "content-length" && value !== undefined) headers.set(key, String(value));
    }
    const hasBody = !["GET", "HEAD"].includes(req.method);
    return new Request(`http://${req.headers.host}${req.originalUrl}`, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body ?? {}) : undefined
    });
}

async function sendWebResponse(res, response) {
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(Buffer.from(await response.arrayBuffer()));
}

app.all(["/api/content", "/api/content.js", "/api/admin/*"], async (req, res) => {
    try {
        const { handleContent, handleAdmin } = await import("./src/admin/api.mjs");
        const request = await toWebRequest(req);
        const response = req.path.startsWith("/api/admin")
            ? await handleAdmin(request, { ip: req.ip })
            : await handleContent(request);
        await sendWebResponse(res, response);
    } catch (err) {
        console.error("Admin API error:", err);
        res.status(500).json({ error: "Something went wrong on the server." });
    }
});

// Serve static portfolio files
app.use(express.static(path.join(__dirname)));

// Routes
app.use(chatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Node.js MVC Portfolio Backend is operational!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Node.js MVC Server running on http://localhost:${PORT}`);
  console.log(`💬 Chat API available at http://localhost:${PORT}/api/chat`);
});
