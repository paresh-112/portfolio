const express = require("express");
const ChatController = require("../controllers/ChatController");

const router = express.Router();

router.post("/chat", ChatController.handleStreamChatMessage);
router.post("/api/chat", ChatController.handleStreamChatMessage);

module.exports = router;
