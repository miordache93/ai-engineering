## Phase 6 — Guardrails and Reliability

### Objectives

- Add resilience: timeouts, retries with backoff, and schema validation for tool I/O.
- Ensure the system fails gracefully and surfaces actionable errors.

### Deliverables

- A wrapper utility around LLM/tool calls that enforces timeouts and retries.
- Zod validation for tool inputs/outputs; self‑healing prompt on validation failure.

### Estimated time

- 30–60 minutes

---

## 1) Timeout and retry wrapper

Create `src/utils/resilience.ts`:

```ts
export async function withTimeout<T>(p: Promise<T>, ms = 45000): Promise<T> {
  let t: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => (t = setTimeout(() => rej(new Error('Timeout')), ms)));
  return Promise.race([p.finally(() => clearTimeout(t)), timeout]);
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries <= 0) throw e;
    const retriable = String(e?.message || '').match(/(429|5\d\d|Timeout)/);
    if (!retriable) throw e;
    await new Promise(r => setTimeout(r, 1000));
    return withRetry(fn, retries - 1);
  }
}
```

Use in nodes:

```ts
import { withTimeout, withRetry } from '../utils/resilience.js';

graph.addNode('RESEARCH', async state => {
  const res = await withRetry(() => withTimeout(runResearchAgent(state.user_goal)));
  return { research_notes: String(res.content) };
});
```

---

## 2) Tool output validation

If a tool returns JSON text, validate it with Zod. On failure, ask the model to re‑emit valid JSON.

Example schema:

```ts
import { z } from 'zod';

export const DocChunk = z.object({ text: z.string(), meta: z.object({ source: z.string() }) });
export const DocChunkArray = z.array(DocChunk).min(1);
```

Self‑healing prompt idea:

- “The previous output was invalid JSON for schema X. Please re‑emit valid JSON only.”

---

## 3) Acceptance

- Induced 429/timeout causes a retry; run completes or fails with a clear message.
- Invalid tool outputs are detected and corrected or the error is surfaced.

---

## 4) Next (Phase 7 preview)

You will implement evaluation with LangSmith: dataset runs, LLM‑as‑judge metrics, and regression checks.
