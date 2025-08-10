## Phase 4 — Orchestration with LangGraph (Supervisor + Routing)

### Objectives

- Model the workflow as a graph: nodes = agents, edges = routing logic, state = shared memory.
- Implement a Supervisor that decides the next step and terminates when done.

### Deliverables

- `src/graph/types.ts` (state structure)
- `src/graph/supervisor.ts` (routing policy)
- `src/graph/build.ts` (graph construction)
- Updated `src/index.ts` as a CLI runner

### Estimated time

- 90–120 minutes

---

## 1) Define state

Create `src/graph/types.ts`:

```ts
export type AgentState = {
  user_goal: string;
  research_notes?: string;
  draft_brief?: string;
  critique?: string;
  iterations: number;
  done: boolean;
};
```

---

## 2) Supervisor policy

Create `src/graph/supervisor.ts`:

```ts
export type Route = 'RESEARCH' | 'WRITE' | 'CRITIC' | 'DONE';

export function decideNext(state: {
  research_notes?: string;
  draft_brief?: string;
  critique?: string;
  iterations: number;
}): Route {
  if (!state.research_notes) return 'RESEARCH';
  if (!state.draft_brief) return 'WRITE';
  if (state.iterations < 2 && !state.critique) return 'CRITIC';
  return 'DONE';
}
```

Notes:

- Keep policy simple for now; you will iterate in later phases.

---

## 3) Build the graph

Create `src/graph/build.ts`:

```ts
import { StateGraph } from '@langchain/langgraph';
import { AgentState } from './types.js';
import { decideNext } from './supervisor.js';
import { runResearchAgent } from '../agents/researchAgent.js';
import { runWriterAgent } from '../agents/writerAgent.js';
import { runCriticAgent } from '../agents/criticAgent.js';

export function buildGraph() {
  const graph = new StateGraph<AgentState>({
    channels: {
      user_goal: { value: x => x, default: '' },
      research_notes: { value: x => x, default: undefined },
      draft_brief: { value: x => x, default: undefined },
      critique: { value: x => x, default: undefined },
      iterations: { value: x => x, default: 0 },
      done: { value: x => x, default: false },
    },
  });

  graph.addNode('RESEARCH', async state => {
    const res = await runResearchAgent(state.user_goal);
    return { research_notes: String(res.content) };
  });

  graph.addNode('WRITE', async state => {
    const res = await runWriterAgent(state.research_notes ?? '');
    return { draft_brief: String(res.content) };
  });

  graph.addNode('CRITIC', async state => {
    const res = await runCriticAgent(state.draft_brief ?? '');
    return { critique: String(res.content), iterations: (state.iterations ?? 0) + 1 };
  });

  graph.addNode('SUPERVISOR', async state => {
    const route = decideNext(state);
    if (route === 'RESEARCH') return { next: 'RESEARCH' } as any;
    if (route === 'WRITE') return { next: 'WRITE' } as any;
    if (route === 'CRITIC') return { next: 'CRITIC' } as any;
    return { done: true } as any;
  });

  graph.addEdge('SUPERVISOR', 'RESEARCH', s => !s.research_notes && !s.done);
  graph.addEdge('SUPERVISOR', 'WRITE', s => !!s.research_notes && !s.draft_brief && !s.done);
  graph.addEdge('SUPERVISOR', 'CRITIC', s => !!s.draft_brief && !s.done && (s.iterations ?? 0) < 2 && !s.critique);
  graph.addEdge('RESEARCH', 'SUPERVISOR');
  graph.addEdge('WRITE', 'SUPERVISOR');
  graph.addEdge('CRITIC', 'SUPERVISOR');

  return graph;
}
```

---

## 4) CLI runner

Update `src/index.ts`:

```ts
import 'dotenv/config';
import { buildGraph } from './graph/build.js';

async function main() {
  const user_goal = process.argv.slice(2).join(' ') || 'Create a competitive brief for Product X for SMB market.';
  const graph = buildGraph();
  let state: any = { user_goal, iterations: 0, done: false };

  while (!state.done) {
    const { value: supUpdate } = await graph.run('SUPERVISOR', state);
    state = { ...state, ...supUpdate };
    if (state.done) break;
    const next = (supUpdate as any).next;
    const { value: update } = await graph.run(next, state);
    state = { ...state, ...update };
    if (next === 'WRITE') state.critique = undefined;
  }

  console.log('\n===== FINAL BRIEF =====\n');
  console.log(state.draft_brief);
  console.log('\n===== CRITIQUE =====\n');
  console.log(state.critique ?? '(none)');
}

main();
```

Run:

```bash
yarn dev "Create a competitive brief for Product X for SMB market"
```

Acceptance:

- You see a final brief and a critique.
- Traces show multiple nodes with a tool call in Research.

---

## 5) Exercises

- Add a maximum iteration cap in the Supervisor and enforce it in the routing policy.
- Add a second critique pass if the critique detects missing citations.
- Log the chosen route and elapsed time per node to the console.

Acceptance:

- No infinite loops; clear, readable logs; useful routing behavior.

---

## 6) Next (Phase 5 preview)

You will add memory (short‑term and long‑term) to make the system consistent across iterations.
