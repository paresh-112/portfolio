const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const chatRoutes = require("./src/routes/ChatRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

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
