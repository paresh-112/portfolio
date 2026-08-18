const { Groq } = require("groq-sdk");
require("dotenv").config();

function getGroqClient() {
  let apiKey = (process.env.GROQ_API_KEY || "").trim();
  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1).trim();
  }
  
  if (!apiKey) {
    return null;
  }
  
  try {
    return new Groq({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize Groq client:", err.message);
    return null;
  }
}

module.exports = {
  getGroqClient
};
