const { loadLangChain } = require("./langchain");

// .env is only for local development; deployed functions get real env vars.
try {
  require("dotenv").config();
} catch {
  // dotenv is not shipped with the chat function, which is fine.
}

const GROQ_MODEL = "llama-3.3-70b-versatile";
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
      maxTokens: 600
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
