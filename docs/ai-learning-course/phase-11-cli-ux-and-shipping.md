## Phase 11 — CLI UX and Shipping

### Objectives

- Provide a clean CLI to run goals, configure options, and export artifacts.
- Save outputs (brief + appendix) to timestamped files for sharing.

### Deliverables

- Updated `src/index.ts` to accept flags and write outputs to `outputs/`.

### Estimated time

- 30–60 minutes

---

## 1) Flags

Support:

- `--goal "..."`
- `--k 4`
- `--iterations 2`
- `--verbose`

Minimal parsing approach:

- Use `process.argv` or a tiny parser like `minimist`.

---

## 2) Export outputs

Write final brief and research notes to disk:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';

async function writeOutputs(brief: string, notes: string) {
  const outDir = path.resolve('outputs');
  await fs.mkdir(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.writeFile(path.join(outDir, `${ts}-brief.md`), brief, 'utf-8');
  await fs.writeFile(path.join(outDir, `${ts}-appendix-notes.md`), notes, 'utf-8');
}
```

Acceptance:

- A single command generates a ready‑to‑share brief with references and an appendix.

---

## 3) Final polish

- Print a short summary table (tokens, time per node, iterations).
- Add `--dry-run` to preview routing without calling the LLM.

---

## 4) Congratulations

You now have an end‑to‑end multi‑agent system with supervision, RAG, memory, guardrails, evaluation, and a shareable UX.
