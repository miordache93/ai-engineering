## Phase 10 — Persistent RAG and Web Search (Optional)

### Objectives

- Replace in‑memory vector store with a persistent store (Supabase pgvector, Qdrant, or Pinecone).
- Add a simple web search tool to complement local KB with fresh info.

### Deliverables

- A drop‑in replacement for `buildMemoryStore` (keep the same `retrieve_docs` API).
- `search_web` tool that returns top results with titles/URLs/snippets.

### Estimated time

- 60–120 minutes

---

## 1) Persistent vector store

Pick one:

- Supabase (pgvector)
- Qdrant
- Pinecone

Steps:

- Install client SDK.
- Create a collection/index and upsert chunks at ingestion.
- Implement `similaritySearch(query, k)` compatible wrapper.

Acceptance:

- Retrieval persists across restarts; scale beyond RAM.

---

## 2) Web search tool

Pick a provider (Tavily, Bing, Serper). Implement a tool:

```ts
import { z } from 'zod';
import { tool } from '@langchain/core/tools';

export const searchWebTool = tool({
  name: 'search_web',
  description: 'Search the web and return top results with title, url, snippet',
  schema: z.object({ query: z.string(), k: z.number().default(3) }),
  func: async ({ query, k }) => {
    // call provider SDK or REST
    // return [{ title, url, snippet }]
    return [];
  },
});
```

Wire into the Research agent and allow it to choose between `retrieve_docs` and `search_web`.

Acceptance:

- For fresh topics, the agent leverages web results appropriately.

---

## 3) Next (Phase 11 preview)

You will polish the CLI UX and export final outputs with references.
