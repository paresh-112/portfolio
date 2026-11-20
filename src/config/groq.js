const { loadLangChain } = require("./langchain");

// .env is only for local development; deployed functions get real env vars.
try {
  require("dotenv").config();
} catch {
  // dotenv is not shipped with the chat function, which is fine.
}

// Groq shut down llama-3.3-70b-versatile on 2026-08-16 and named
// openai/gpt-oss-120b as its replacement (console.groq.com/docs/deprecations).
const GROQ_MODEL = "openai/gpt-oss-120b";
const WHISPER_MODEL = "whisper-large-v3-turbo";

function getGroqApiKey() {
  let apiKey = (process.env.GROQ_API_KEY || "").trim();
  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1).trim();
  }
  return apiKey || null;
}

function hasGroqApiKey() {
  return getGroqApiKey() !== null;
}

// Raw Groq client — used for Whisper audio transcription.
function getGroqClient() {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    // Loaded here so the chat function never needs groq-sdk directly.
    const { Groq } = require("groq-sdk");
    return new Groq({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize Groq client:", err.message);
    return null;
  }
}

// LangChain chat model — used by the agent pipeline.
async function getChatModel() {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return null;
  }

  const { ChatGroq } = await loadLangChain();
  try {
    return new ChatGroq({
      apiKey,
      model: GROQ_MODEL,
      temperature: 0.6,
      // gpt-oss is a reasoning model: its hidden reasoning tokens count
      // toward this limit, so it is higher than the visible reply needs.
      // Low effort keeps replies fast; the reasoning never reaches the chat.
      reasoningEffort: "low",
      maxTokens: 1500
    });
  } catch (err) {
    console.warn("Failed to initialize ChatGroq model:", err.message);
    return null;
  }
}

module.exports = {
  getGroqClient,
  getChatModel,
  hasGroqApiKey,
  GROQ_MODEL,
  WHISPER_MODEL
};
