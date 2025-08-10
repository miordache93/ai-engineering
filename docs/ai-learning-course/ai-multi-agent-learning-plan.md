## AI Multi‑Agent Engineering Roadmap (TypeScript)

### Goal

- Build a multi‑agent system in TypeScript using OpenAI, LangGraph, LangChain, RAG, Memory, and LangSmith.
- Learn, by doing, the core concepts behind agents: prompting, tools/function‑calling, retrieval, memory, orchestration,
  evaluation, and observability.
- Deliver a working supervisor‑agent architecture with 2–3 specialized agents and a CLI to run tasks end‑to‑end.

### Use case: Product Research & Brief Generator

- **Supervisor agent**: decomposes a user request, routes subtasks, checks completion criteria.
- **Research agent**: performs RAG over a local knowledge base (+ optional web search).
- **Writer agent**: synthesizes a crisp, structured one‑pager from research notes.
- **Critic agent**: reviews for clarity, gaps, and adds actionable improvements.

Example task: “Create a competitive brief for Product X in the SMB market with top 5 competitors, key differentiators,
and a one‑page launch brief.”

---

## 0) Prerequisites & Setup (30–45 min)

### Concepts

- Start observability early: use LangSmith to trace and debug.
- Keep the first RAG store simple (in‑memory), then swap to a vector DB later.

### Do

1. Ensure Node 20+, Yarn, and a clean project folder for this lab (separate from your production repo).
2. Get API keys: OpenAI, LangSmith.
3. Create the project skeleton:

```bash
mkdir -p ~/agents-lab && cd ~/agents-lab
yarn init -y
yarn add typescript tsx @types/node -D
yarn tsc --init --moduleResolution node --module esnext --target es2021 --rootDir src --outDir dist
mkdir -p src/{graph,agents,tools,rag,eval} data/knowledge
yarn add @langchain/openai langchain @langchain/langgraph langsmith dotenv zod uuid
```

4. Add scripts to `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "ingest": "tsx src/rag/ingest.ts",
    "build": "tsc -p .",
    "run": "node dist/index.js",
    "eval": "tsx src/eval/run-eval.ts"
  }
}
```

5. Create `.env`:

```
OPENAI_API_KEY=YOUR_KEY
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=YOUR_KEY
LANGCHAIN_PROJECT=agents-lab
```

### Acceptance

- `yarn dev` runs and prints a message (we’ll add code next).
- A LangSmith project is visible once you run your first chain.

---

## 1) Single‑agent sanity check (20–30 min)

### Concept

Make one LLM call and verify LangSmith tracing works.

### Do: `src/index.ts`

```ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';

async function main() {
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });
  const res = await model.invoke([{ role: 'user', content: 'Say hello in one sentence.' }]);
  console.log(res.content);
}

main();
```

### Run

```bash
yarn dev
```

### Acceptance

- Terminal prints a one‑sentence greeting.
- A trace appears in LangSmith.

---

## 2) Tools & function‑calling (45–60 min)

### Concept

Agents call tools with structured I/O. Use Zod schemas for validation.

### Do: Simple tools

`src/tools/simpleTools.ts`

```ts
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const addNumbersTool = tool({
  name: 'add_numbers',
  description: 'Add two numbers',
  schema: z.object({ a: z.number(), b: z.number() }),
  func: async ({ a, b }) => String(a + b),
});

export const getTodayTool = tool({
  name: 'get_today',
  description: 'Get today’s ISO date (local machine)',
  schema: z.object({}),
  func: async () => new Date().toISOString().slice(0, 10),
});
```

`src/agents/toolAgent.ts`

```ts
import { ChatOpenAI } from '@langchain/openai';
import { addNumbersTool, getTodayTool } from '../tools/simpleTools.js';

export async function runToolAgent(question: string) {
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const modelWithTools = model.bindTools([addNumbersTool, getTodayTool]);
  return modelWithTools.invoke([{ role: 'user', content: question }]);
}
```

Update `src/index.ts`:

```ts
import 'dotenv/config';
import { runToolAgent } from './agents/toolAgent.js';

async function main() {
  const res = await runToolAgent('What is 123 + 456 and what date is today?');
  console.log(res.content);
}

main();
```

### Acceptance

- Model uses tools (inspect LangSmith trace) and returns correct sum and today’s date.

---

## 3) RAG v1: In‑memory vector store (60–90 min)

### Concept

RAG = embed docs → store vectors → retrieve chunks → ground answers with citations.

### Do

1. Add a few `.md`/`.txt` into `data/knowledge/` (product docs, competitor notes, etc.).
2. Ingest to an in‑memory store.

`src/rag/ingest.ts`

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

`src/tools/ragTool.ts`

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

### Run

```bash
yarn ingest
```

### Acceptance

- Ingest prints success.
- `retrieve_docs` returns relevant chunks (see LangSmith tool traces).

---

## 4) Define agents (Research, Writer, Critic) (60–90 min)

### Concept

Each agent = role prompt + toolset + output contract. Research uses RAG; Writer synthesizes; Critic reviews.

### Do: Research agent

`src/agents/researchAgent.ts`

```ts
import { ChatOpenAI } from '@langchain/openai';
import { retrieveDocsTool } from '../tools/ragTool.js';

export async function runResearchAgent(question: string) {
  const sys = `You are a focused research agent. Use retrieve_docs to ground your answers. Always cite sources as [source: FILENAME]. Output bullet notes.`;
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const llm = model.bindTools([retrieveDocsTool]);
  return llm.invoke([
    { role: 'system', content: sys },
    { role: 'user', content: question },
  ]);
}
```

### Do: Writer agent

`src/agents/writerAgent.ts`

```ts
import { ChatOpenAI } from '@langchain/openai';

export async function runWriterAgent(notes: string) {
  const sys = `You are a concise product brief writer. Transform research notes into a one-page brief with headings: Summary, Competitors, Differentiators, Launch Plan.`;
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });
  return model.invoke([
    { role: 'system', content: sys },
    { role: 'user', content: `Research notes:\n\n${notes}` },
  ]);
}
```

### Do: Critic agent

`src/agents/criticAgent.ts`

```ts
import { ChatOpenAI } from '@langchain/openai';

export async function runCriticAgent(brief: string) {
  const sys = `You are an exacting critic. Identify unclear claims, missing data, and biased statements. Suggest concrete edits.`;
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  return model.invoke([
    { role: 'system', content: sys },
    { role: 'user', content: `Draft brief:\n\n${brief}` },
  ]);
}
```

### Acceptance

- Each agent returns appropriately formatted outputs.
- Research responses include citations like `[source: foo.md]`.

---

## 5) Orchestration with LangGraph: Supervisor & routing (90–120 min)

### Concept

Represent the workflow as a graph: nodes = agents; edges = routing logic; state = shared memory.

### Do: Minimal graph with supervisor

`src/graph/types.ts`

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

`src/graph/supervisor.ts`

```ts
import { v4 as uuidv4 } from 'uuid';

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

export function newRunId() {
  return uuidv4();
}
```

`src/graph/build.ts`

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

`src/index.ts` (CLI runner)

```ts
import 'dotenv/config';
import { buildGraph } from './graph/build.js';

async function main() {
  const user_goal = process.argv.slice(2).join(' ') || 'Create a competitive brief for Product X for SMB market.';
  const graph = buildGraph();
  let state = { user_goal, iterations: 0, done: false } as any;

  while (!state.done) {
    // Always start from supervisor to decide routing
    const { value: supUpdate } = await graph.run('SUPERVISOR', state);
    state = { ...state, ...supUpdate };
    if (state.done) break;

    const next = (supUpdate as any).next;
    const { value: update } = await graph.run(next, state);
    state = { ...state, ...update };

    // Reset critique so we re-critic on a new draft if needed
    if (next === 'WRITE') state.critique = undefined;
  }

  console.log('\n===== FINAL BRIEF =====\n');
  console.log(state.draft_brief);
  console.log('\n===== CRITIQUE =====\n');
  console.log(state.critique ?? '(none)');
}

main();
```

### Run

```bash
yarn dev "Create a competitive brief for Product X for SMB market"
```

### Acceptance

- You see a final brief and an accompanying critique.
- LangSmith shows a multi‑step trace with tool calls from the research node.

---

## 6) Memory: short‑term, long‑term, and per‑agent context (60–90 min)

### Concept

- Short‑term: chat history per agent turn (windowed memory to control drift).
- Long‑term: vector memory for entities/decisions (RAG store with a “memory” namespace).
- Per‑agent: prepend agent‑specific instructions and relevant memory on each node.

### Do (lightweight)

- Maintain a rolling `conversation` array in `AgentState` and append system summaries after each iteration (or keep last
  N turns per node).
- Persist notable decisions into the vector store as separate documents with tag `type: "memory"`.

### Acceptance

- Across iterations, the writer maintains consistency with prior decisions.

---

## 7) Guardrails: retries, timeouts, and tool errors (30–60 min)

### Concept

- Add basic resilience: timeouts, retries with backoff, and defensive parsing for tool JSON.

### Do

- Wrap each node call with a helper that retries once on 429/500 and times out after 45s.
- Validate tool outputs (Zod). If invalid, ask the model to “self‑heal” by re‑emitting correct schema.

### Acceptance

- Induced failures (e.g., disconnect network) don’t crash the run; they retry and either skip or report a clear error.

---

## 8) Evaluation with LangSmith (90–120 min)

### Concept

Measure quality: faithfulness (uses sources), relevance, structure. Automate regression checks.

### Do

1. Create a small dataset in LangSmith (5–10 prompts with expected traits).
2. Write an eval script that:
   - Runs the graph on each prompt
   - Scores outputs with an LLM‑as‑judge rubric (faithfulness, completeness)
   - Logs runs and metrics to LangSmith

`src/eval/run-eval.ts`

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

### Acceptance

- Eval prints a small table with 3 metrics per prompt.
- Traces appear in LangSmith and are grouped per run.

---

## 9) Improve retrieval quality (45–90 min)

### Concept

Chunking strategy, query rewriting, and top‑k tuning have outsized impact on RAG.

### Do

- Split on headings and sentences; try chunk size 500–1,000 tokens with 50–100 overlap.
- Add a “query‑rewrite” step before retrieval (condense long goals → keyword‑rich subqueries).
- Try `k` in 3–8 range and measure eval changes.

### Acceptance

- Eval metrics improve by at least one point on average or you can explain tradeoffs.

---

## 10) Observability & tracing discipline (30–60 min)

### Concept

Good traces = faster debugging. Name nodes clearly, add tags, log key state fields.

### Do

- Wrap each node with a small logger to print current route, token usage (if available), and elapsed time.
- Add LangSmith run metadata for `user_goal`, `route`, and `iteration`.

### Acceptance

- Traces are easy to read and correlate to CLI output.

---

## 11) Optional: External vector DB and web search (60–120 min)

### Concept

Swap the in‑memory vector store for a persistent store and add a web search tool for freshness.

### Do

- Replace MemoryVectorStore with one of: Supabase (pgvector), Qdrant, Pinecone. Keep the same `retrieve_docs` API.
- Add a simple search tool (Tavily/Bing/Serper) and let the Research agent decide when to use it.

### Acceptance

- Retrieval persists across runs and can scale beyond RAM.

---

## 12) Ship a polished CLI UX (30–60 min)

### Concept

Make the lab easy to run and share.

### Do

- Accept flags `--goal`, `--k`, `--iterations`, `--verbose`.
- Output final brief to `./outputs/<timestamp>.md` and save the research notes as an appendix.

### Acceptance

- One command generates a ready‑to‑share brief with references.

---

## Daily practice prompts

- Rebuild one node with a different prompting style and compare outputs.
- Swap the writer model to a smaller/cheaper variant and measure quality delta.
- Add an additional agent: “Pricing analyst” that estimates pricing tiers and margins.

---

## Debugging checklist

- **Bad citations**: confirm retrieval chunks are relevant; lower chunk size and increase overlap.
- **Hallucinations**: raise faithfulness penalty via system prompts; force citation requirement; add self‑check step.
- **Tool schema errors**: add Zod validation + self‑heal loop.
- **Routing loops**: cap iterations and log route transitions.
- **Slow runs**: add timeouts and parallelize retrieval and judging when possible.

---

## Glossary

- **Agent**: an LLM with a role, tools, and context; emits actions or text.
- **Tool**: a function with a schema the model can call via function‑calling.
- **RAG**: pipeline that retrieves relevant documents to ground model outputs.
- **LangGraph**: graph‑based orchestration layer for multi‑step/multi‑agent flows.
- **LangSmith**: tracing/evaluation platform to observe and measure LLM apps.

---

## References

- LangGraph (concepts and API) — search for “LangGraph documentation”
- LangChain (retrievers, vector stores) — search for “LangChain JS documentation”
- LangSmith (tracing/evals) — search for “LangSmith docs”
- OpenAI models — search for “OpenAI API reference”

---

## What to do next

1. Create the `~/agents-lab` project and complete steps 1–5.
2. Populate `data/knowledge/` with 5–10 focused docs.
3. Run the CLI with your own product idea and inspect traces.
4. Add memory and guardrails (steps 6–7).
5. Run evals and iterate based on the scores (step 8–9).
