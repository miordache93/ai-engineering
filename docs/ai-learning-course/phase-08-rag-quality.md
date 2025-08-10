## Phase 8 — Improve RAG Quality (Chunking, Query Rewrite, Top‑K)

### Objectives

- Improve retrieval relevance using better chunking and optional query rewrite.
- Tune top‑k and measure impact with the evaluation harness.

### Deliverables

- Updated ingestion to split on headings/sentences with overlap.
- Optional query rewrite step before retrieval.

### Estimated time

- 45–90 minutes

---

## 1) Better chunking (conceptual)

Guidelines:

- Chunk size: 500–1000 tokens; overlap: 50–100 tokens.
- Split on headings and sentences to preserve semantic boundaries.

Implementation options:

- Pre‑split files in ingestion and feed chunks to the vector store.
- Or use a text splitter from LangChain (e.g., RecursiveCharacterTextSplitter) in JS.

---

## 2) Query rewrite (optional)

Add a pre‑retrieval step:

- Given a long goal, ask a small model to produce a concise, keyword‑rich query (1–2 lines).
- Use that query for similarity search.

Pseudo:

```ts
import { ChatOpenAI } from '@langchain/openai';

export async function rewriteQuery(input: string) {
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const res = await model.invoke([
    { role: 'user', content: `Rewrite as 1-2 line keyword-rich search query: ${input}` },
  ]);
  return String(res.content).trim();
}
```

Wire into `retrieve_docs` before calling the vector store.

---

## 3) Tune k and evaluate

Steps:

- Try k in {3, 4, 6, 8} and run `yarn eval`.
- Compare average scores across runs; pick the best tradeoff.

Acceptance:

- You can explain how chunking and k affected faithfulness and completeness.

---

## 4) Next (Phase 9 preview)

You will enhance observability and tracing discipline to accelerate debugging.
