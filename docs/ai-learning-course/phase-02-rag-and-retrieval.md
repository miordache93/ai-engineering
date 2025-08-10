## Phase 2 — RAG Foundations (In‑Memory Vector Store + Retrieval Tool)

### Objectives

- Prepare a minimal Retrieval‑Augmented Generation pipeline.
- Ingest local documents into an in‑memory vector store with OpenAI embeddings.
- Expose retrieval as a callable tool that returns relevant chunks and metadata.

### Deliverables

- `src/rag/ingest.ts` that builds an in‑memory `MemoryVectorStore` from `data/knowledge/`.
- `src/tools/ragTool.ts` with a `retrieve_docs` tool returning top‑k chunks.
- Validated retrieval session in LangSmith tracing (tool calls visible).

### Estimated time

- 60–90 minutes

---

## 1) Prepare knowledge data

Populate `data/knowledge/` with 5–10 short `.md`/`.txt` files relevant to your target domain (product docs, competitor
notes, features). Keep each 200–1,000 words for fast iteration.

Tips:

- Use descriptive filenames (e.g., `competitor_hubspot.md`, `feature_checklist.txt`).
- Prefer clean, factual content over marketing fluff to improve grounding.

---

## 2) Implement ingestion (in‑memory)

Create `src/rag/ingest.ts`:

```ts
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';

const DATA_DIR = path.resolve('data/knowledge');

export async function buildMemoryStore() {
  const files = await fs.readdir(DATA_DIR);
  const texts: string[] = [];
  const metas: { source: string }[] = [];
  for (const f of files) {
    const full = path.join(DATA_DIR, f);
    const content = await fs.readFile(full, 'utf-8');
    texts.push(content);
    metas.push({ source: f });
  }
  const store = await MemoryVectorStore.fromTexts(
    texts,
    metas,
    new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
  );
  return store;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildMemoryStore().then(() => console.log('In-memory store ready'));
}
```

Command:

```bash
yarn ingest
```

Acceptance:

- Command prints a success message without errors.

---

## 3) Retrieval as a tool

Create `src/tools/ragTool.ts`:

```ts
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { buildMemoryStore } from '../rag/ingest.js';

let cachedStore: Awaited<ReturnType<typeof buildMemoryStore>> | null = null;

export const retrieveDocsTool = tool({
  name: 'retrieve_docs',
  description: 'Retrieve relevant knowledge base chunks for a query',
  schema: z.object({ query: z.string(), k: z.number().default(4) }),
  func: async ({ query, k }) => {
    if (!cachedStore) cachedStore = await buildMemoryStore();
    const results = await cachedStore.similaritySearch(query, k);
    return results.map(r => ({ text: r.pageContent, meta: r.metadata }));
  },
});
```

Smoke test (temporary):

```ts
// Add in a scratch file or REPL
// import { retrieveDocsTool } from './src/tools/ragTool.ts'
// await retrieveDocsTool.invoke({ query: 'SMB market CRM competitors', k: 3 })
```

Acceptance:

- The tool returns an array of objects like `{ text, meta: { source: 'file.md' } }`.
- LangSmith trace shows a tool call with the `query` and top‑k results.

---

## 4) Grounded answer prototype (optional)

Create a quick prototype that calls `retrieve_docs` then asks the model to answer using only the retrieved text:

```ts
import { ChatOpenAI } from '@langchain/openai';
import { retrieveDocsTool } from '../tools/ragTool.js';

export async function answerWithRag(question: string) {
  const docs = (await retrieveDocsTool.invoke({ query: question, k: 4 })) as any[];
  const context = docs.map(d => `SOURCE(${d.meta.source}): ${d.text}`).join('\n\n');
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const sys = 'Answer using ONLY the provided sources. Cite as [source: FILENAME]. If missing, say you do not know.';
  const res = await model.invoke([
    { role: 'system', content: sys },
    { role: 'user', content: `QUESTION: ${question}\n\nSOURCES:\n${context}` },
  ]);
  return String(res.content);
}
```

Acceptance:

- Answers include citations such as `[source: competitor_hubspot.md]`.
- If no relevant sources, it says it does not know.

---

## 5) Quality levers and troubleshooting

Levers:

- k (top‑k): start with 3–6.
- Content quality: prefer factual docs; remove duplicates.
- Embeddings: `text-embedding-3-small` is cost‑effective; consider `-large` later.

Troubleshooting:

- Empty results: verify `data/knowledge/` files exist and are readable.
- Irrelevant chunks: reduce file size or split large files; later, implement chunking.
- No traces: re‑check `.env` and LangSmith project name.

---

## 6) Exercises

- Add a `k` clamp: enforce 1 ≤ k ≤ 10 via Zod refinement; handle invalid inputs gracefully.
- Add a filter param: `sourceIncludes?: string` that filters by filename substring after retrieval.
- Evaluate different queries on the same docs and compare retrieved filenames.

Acceptance:

- Tool validates inputs and documents changes are visible in LangSmith traces.

---

## 7) Phase completion checklist

- Knowledge documents ingested into an in‑memory vector store.
- Retrieval tool (`retrieve_docs`) returns relevant chunks with sources.
- Prototype grounded answer works and properly cites sources.

---

## 8) What’s next (Phase 3 preview)

In Phase 3, you will:

- Define three role agents (Research, Writer, Critic) with tailored system prompts.
- Allow the Research agent to call `retrieve_docs` and produce cited notes.
- Prepare for orchestration with a Supervisor in Phase 4.
