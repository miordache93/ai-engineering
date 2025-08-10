## Phase 7 — Evaluation with LangSmith

### Objectives

- Create a small evaluation dataset and run your agent graph against it.
- Score outputs using an LLM‑as‑judge rubric (faithfulness, completeness, structure).
- Log runs and metrics to LangSmith for comparison.

### Deliverables

- `src/eval/run-eval.ts` executing the pipeline over test prompts and printing a score table.

### Estimated time

- 90–120 minutes

---

## 1) Judge function

Create `src/eval/run-eval.ts`:

```ts
import 'dotenv/config';
import { buildGraph } from '../graph/build.js';
import { ChatOpenAI } from '@langchain/openai';

type Score = { faithfulness: number; completeness: number; structure: number };

async function judge(output: string, context: string): Promise<Score> {
  const judge = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const prompt = `Score the output 1-5 for faithfulness to context, completeness, and structure. Respond JSON with keys faithfulness, completeness, structure.\n\nCONTEXT:\n${context}\n\nOUTPUT:\n${output}`;
  const res = await judge.invoke([{ role: 'user', content: prompt }]);
  try {
    return JSON.parse(String(res.content)) as Score;
  } catch {
    return { faithfulness: 3, completeness: 3, structure: 3 };
  }
}

async function runOne(goal: string) {
  const graph = buildGraph();
  let state: any = { user_goal: goal, iterations: 0, done: false };
  while (!state.done) {
    const { value: sup } = await graph.run('SUPERVISOR', state);
    state = { ...state, ...sup };
    if (state.done) break;
    const next = (sup as any).next;
    const { value: up } = await graph.run(next, state);
    state = { ...state, ...up };
    if (next === 'WRITE') state.critique = undefined;
  }
  const context = (state.research_notes ?? '').slice(0, 4000);
  const scores = await judge(state.draft_brief ?? '', context);
  return { goal, scores };
}

async function main() {
  const goals = [
    'Create a competitive brief for a CRM tool for SMBs',
    'Brief for a task management app targeting freelancers',
  ];
  const results = [] as any[];
  for (const g of goals) results.push(await runOne(g));
  console.table(results.map(r => ({ goal: r.goal, ...r.scores })));
}

main();
```

Run:

```bash
yarn eval
```

Acceptance:

- Console shows a small table of scores.
- Traces are grouped per run in LangSmith for later comparison.

---

## 2) Exercises

- Add a 4th metric: “citation quality.”
- Save aggregate results as JSON and track trends across commits.
- Build a tiny pass/fail gate in CI (e.g., average faithfulness ≥ 3.5).

---

## 3) Next (Phase 8 preview)

You will improve retrieval quality: chunking, query rewrite, and k tuning.
