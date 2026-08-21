const { BaseRetriever } = require("@langchain/core/retrievers");
const { Document } = require("@langchain/core/documents");
const KnowledgeModel = require("../models/KnowledgeModel");

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "do", "does",
  "did", "have", "has", "had", "i", "you", "he", "she", "it", "we", "they",
  "his", "her", "its", "their", "my", "your", "me", "him", "them", "us",
  "what", "which", "who", "whom", "this", "that", "these", "those", "am",
  "and", "or", "but", "if", "then", "else", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "some", "such", "can",
  "will", "just", "should", "could", "would", "may", "might", "of", "at",
  "by", "for", "with", "about", "to", "from", "in", "on", "up", "out", "so",
  "than", "too", "very", "s", "t", "not", "no", "there", "here", "tell",
  "give", "show", "please", "paresh", "prajapati"
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Query terms worth surfacing in the agent trace (what the "analyze" step found).
function extractTopics(query) {
  return [...new Set(tokenize(query))];
}

// Keyword/lexical scoring over the chunked knowledge base:
// exact keyword-phrase hits weigh most, then title words, then content words.
function scoreDocuments(query, k = 3) {
  const q = (query || "").toLowerCase();
  const qTokens = new Set(tokenize(query));
  const docs = KnowledgeModel.getKnowledgeDocs();

  const scored = docs.map((doc) => {
    let score = 0;

    for (const keyword of doc.keywords) {
      if (keyword.includes(" ")) {
        if (q.includes(keyword)) score += 4;
      } else if (qTokens.has(keyword)) {
        score += 3;
      } else if ([...qTokens].some((t) => t.length > 3 && (keyword.startsWith(t) || t.startsWith(keyword)))) {
        score += 1.5;
      }
    }

    const titleTokens = new Set(tokenize(doc.title));
    for (const t of qTokens) {
      if (titleTokens.has(t)) score += 2;
    }

    const contentTokens = new Set(tokenize(doc.content));
    for (const t of qTokens) {
      if (contentTokens.has(t)) score += 1;
    }

    return { doc, score };
  });

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  // Generic queries (greetings, small talk) fall back to an overview set.
  if (top.length === 0) {
    const defaults = new Set(KnowledgeModel.getDefaultDocIds());
    return docs.filter((d) => defaults.has(d.id)).map((doc) => ({ doc, score: 0 }));
  }

  return top;
}

class PortfolioRetriever extends BaseRetriever {
  static lc_name() {
    return "PortfolioRetriever";
  }

  constructor(fields = {}) {
    super(fields);
    this.lc_namespace = ["portfolio", "retrievers"];
    this.k = fields.k ?? 3;
  }

  async _getRelevantDocuments(query) {
    return scoreDocuments(query, this.k).map(
      ({ doc, score }) =>
        new Document({
          pageContent: doc.content,
          metadata: { id: doc.id, title: doc.title, score }
        })
    );
  }
}

module.exports = {
  PortfolioRetriever,
  extractTopics,
  tokenize
};
