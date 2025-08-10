## Phase 5 — Memory and Persistence

### Objectives

- Add short‑term memory (rolling conversation/state summaries) and optional long‑term memory (vector "memories").
- Persist notable decisions to be reused by downstream nodes or later runs.

### Deliverables

- Extended `AgentState` with `conversation?: string[]` and/or `summary?: string`.
- A simple memory write: store decisions as vector docs with tag `type: "memory"`.

### Estimated time

- 60–90 minutes

---

## 1) Short‑term memory

Extend `src/graph/types.ts`:

```ts
export type AgentState = {
  user_goal: string;
  research_notes?: string;
  draft_brief?: string;
  critique?: string;
  iterations: number;
  done: boolean;
  conversation?: string[]; // optional rolling log
  summary?: string; // optional state summary
};
```

Update nodes to append brief log lines, e.g., in Research node after invocation:

```ts
return {
  research_notes: String(res.content),
  conversation: [...(state.conversation ?? []), 'Research completed with citations'],
};
```

Optionally, create a compact summary after each full cycle (Research→Write→Critic):

- Ask the model to produce a 3–5 line summary of decisions and key facts.
- Store as `state.summary` and include it in prompts for Writer/Critic.

---

## 2) Long‑term memory (optional)

Use the existing vector store to upsert “memory” documents:

```ts
// pseudo-utility
export async function storeMemory(text: string, meta: Record<string, any> = {}) {
  const store = await buildMemoryStore();
  await store.addDocuments([{ pageContent: text, metadata: { ...meta, type: 'memory' } } as any]);
}
```

Examples of what to store:

- Chosen positioning statement
- Target persona
- Key differentiators agreed upon in critique

Retrieve these in Research or Writer by querying for the goal or tags and prepend to prompts.

---

## 3) Acceptance

- System carries decisions forward across iterations (e.g., Writer remains consistent with persona/differentiators).
- You can show at least one example of a stored memory being reused in a later run.

---

## 4) Exercises

- Add time decay: down‑weight older memories, or only include the latest N.
- Distinguish “hard facts” vs “preferences” with different tags and selection logic.

---

## 5) Next (Phase 6 preview)

You will add guardrails: retries, timeouts, and schema validation for tools, ensuring robustness.
