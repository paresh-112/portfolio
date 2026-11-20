// Loads the LangChain packages with import() instead of require().
//
// The Netlify chat function bundles this CommonJS code into an ES module, and
// require() calls to packages inside that bundle are not followed when
// Netlify collects node_modules, so the live function crashed with
// "Cannot find module '@langchain/core/prompts'". import() with a literal
// specifier is followed (or inlined by esbuild), and it loads the packages'
// native ESM builds. Express (server.js) uses the same path.
let loading = null;

function loadLangChain() {
  if (!loading) {
    loading = Promise.all([
      import("@langchain/core/prompts"),
      import("@langchain/core/messages"),
      import("@langchain/core/retrievers"),
      import("@langchain/core/documents"),
      import("@langchain/groq")
    ]).then(([prompts, messages, retrievers, documents, groq]) => ({
      ChatPromptTemplate: prompts.ChatPromptTemplate,
      MessagesPlaceholder: prompts.MessagesPlaceholder,
      HumanMessage: messages.HumanMessage,
      AIMessage: messages.AIMessage,
      BaseRetriever: retrievers.BaseRetriever,
      Document: documents.Document,
      ChatGroq: groq.ChatGroq
    }));
    // A failed load should be retried on the next request, not cached.
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

module.exports = { loadLangChain };
