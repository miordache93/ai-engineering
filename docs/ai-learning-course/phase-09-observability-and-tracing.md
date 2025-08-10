## Phase 9 — Observability and Tracing Discipline

### Objectives

- Make traces easier to read and debug.
- Log key state, route choices, and performance info.

### Deliverables

- Lightweight logging wrapper for nodes.
- Run metadata (goal, route, iteration) attached to traces.

### Estimated time

- 30–60 minutes

---

## 1) Console logging

Add per‑node logs:

- Node name, elapsed time, token estimate (if available), chosen next route.

Example:

```ts
const start = Date.now();
const res = await runResearchAgent(state.user_goal);
console.log(`[RESEARCH] ${Date.now() - start}ms`);
```

---

## 2) Trace metadata

When invoking models, add tags/metadata (supported via LangChain run metadata):

- `user_goal`, `route`, `iteration`.

This helps filter and compare runs in LangSmith.

---

## 3) Acceptance

- You can quickly locate slow nodes and verify routing decisions from traces alone.

---

## 4) Next (Phase 10 preview)

You will optionally swap to a persistent vector DB and add a web search tool for freshness.
