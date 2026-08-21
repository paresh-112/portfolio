const { toFile } = require("groq-sdk");
const { getGroqClient, WHISPER_MODEL } = require("../config/groq");

// ~6MB of raw audio once base64 is decoded — plenty for a voice query,
// and safely under Netlify's function payload limit.
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

const MIME_EXTENSIONS = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac"
};

function httpError(statusCode, publicMessage) {
  const err = new Error(publicMessage);
  err.statusCode = statusCode;
  err.publicMessage = publicMessage;
  return err;
}

class TranscriptionService {
  // Transcribes a base64-encoded audio clip with Groq Whisper.
  static async transcribeBase64(audioBase64, mime) {
    if (!audioBase64 || typeof audioBase64 !== "string") {
      throw httpError(400, "Field 'audio' must be a base64-encoded audio clip.");
    }

    const groq = getGroqClient();
    if (!groq) {
      throw httpError(503, "Voice transcription is not available right now.");
    }

    let buffer;
    try {
      buffer = Buffer.from(audioBase64, "base64");
    } catch {
      throw httpError(400, "Field 'audio' is not valid base64.");
    }

    if (buffer.length === 0) {
      throw httpError(400, "Audio clip is empty.");
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      throw httpError(413, "Audio clip is too large. Keep recordings short.");
    }

    const baseMime = (mime || "audio/webm").split(";")[0].trim().toLowerCase();
    const extension = MIME_EXTENSIONS[baseMime] || "webm";

    const transcription = await groq.audio.transcriptions.create({
      file: await toFile(buffer, `voice-query.${extension}`),
      model: WHISPER_MODEL,
      response_format: "json"
    });

    return {
      text: (transcription.text || "").trim(),
      model: WHISPER_MODEL
    };
  }
}

module.exports = TranscriptionService;
