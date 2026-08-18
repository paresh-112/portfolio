const { getGroqClient } = require("../config/groq");

class GroqService {
  static async streamCompletion(systemPrompt, historyMessages, userMessage, onChunk) {
    const groq = getGroqClient();
    if (!groq) {
      throw new Error("GROQ_API_KEY_MISSING");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: userMessage }
    ];

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        if (typeof onChunk === "function") {
          onChunk(content);
        }
      }
    }

    return fullResponse;
  }
}

module.exports = GroqService;
