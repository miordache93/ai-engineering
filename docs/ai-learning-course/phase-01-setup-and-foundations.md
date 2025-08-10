## Phase 1 — Setup and Foundations (OpenAI + LangSmith + Tools)

### Objectives

- Configure a clean TypeScript project with OpenAI, LangChain, LangGraph (installed now, used more in later phases), and
  LangSmith.
- Produce your first traced LLM call (sanity check) and implement basic tools/function‑calling.
- Build muscle memory for environment variables, scripts, and debugging with traces.

### Deliverables

- A working repo at `~/agents-lab` (or your preferred path) with:
  - `src/index.ts` hello‑LLM example
  - `src/tools/simpleTools.ts` with two tools
  - `src/agents/toolAgent.ts` that binds tools to the model
- LangSmith project shows traces for both a simple chat and a tool‑enhanced run.

### Estimated time

- 60–90 minutes total (including optional exercises)

---

## 1) Prerequisites

### You need

- Node 20+
- Yarn
- Accounts/API keys:
  - OpenAI: set `OPENAI_API_KEY`
  - LangSmith: set `LANGCHAIN_API_KEY`, `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_PROJECT`

### Folder structure (created in the next step)

```
agents-lab/
  src/
    agents/
    tools/
    rag/
    graph/
    eval/
  data/
    knowledge/
  .env
  package.json
  tsconfig.json
```

---

## 2) Project bootstrap

Run these commands (adjust path as desired):

```bash
mkdir -p ~/agents-lab && cd ~/agents-lab
yarn init -y
yarn add typescript tsx @types/node -D
yarn tsc --init --moduleResolution node --module esnext --target es2021 --rootDir src --outDir dist
mkdir -p src/{graph,agents,tools,rag,eval} data/knowledge
yarn add @langchain/openai langchain @langchain/langgraph langsmith dotenv zod uuid
```

Update `package.json` scripts:

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

Create `.env`:

```
OPENAI_API_KEY=YOUR_OPENAI_KEY
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=YOUR_LANGSMITH_KEY
LANGCHAIN_PROJECT=agents-lab
```

Smoke test the setup by running:

```bash
yarn dev # this will fail until you add code in the next section; failure is expected for now
```

---

## 3) First traced LLM call (sanity check)

Create `src/index.ts`:

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

Run:

```bash
yarn dev
```

Acceptance criteria:

- Terminal prints a one‑sentence greeting.
- A trace appears in LangSmith under the `agents-lab` project.

Notes:

- If you don’t see traces, verify `.env` values and ensure `LANGCHAIN_TRACING_V2=true`.
- Check that your LangSmith account has the project (it will be created on first trace).

---

## 4) Tools and function‑calling

Concepts:

- Tools are strongly‑typed functions the model can call. Use Zod schemas to validate inputs.
- Start with two simple tools to build the habit: math + date.

Create `src/tools/simpleTools.ts`:

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

Create `src/agents/toolAgent.ts`:

```ts
import { ChatOpenAI } from '@langchain/openai';
import { addNumbersTool, getTodayTool } from '../tools/simpleTools.js';

export async function runToolAgent(question: string) {
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
  const modelWithTools = model.bindTools([addNumbersTool, getTodayTool]);
  return modelWithTools.invoke([{ role: 'user', content: question }]);
}
```

Update `src/index.ts` to call the tool agent:

```ts
import 'dotenv/config';
import { runToolAgent } from './agents/toolAgent.js';

async function main() {
  const res = await runToolAgent('What is 123 + 456 and what date is today?');
  console.log(res.content);
}

main();
```

Run:

```bash
yarn dev
```

Acceptance criteria:

- Output includes the correct sum (579) and today’s date.
- LangSmith trace shows one or more tool calls with structured inputs.

Troubleshooting:

- If tool calls don’t show, confirm you used `model.bindTools([...])` and that you invoked the bound model.
- Ensure your OpenAI account/model has function‑calling capability (gpt‑4o‑mini does).

---

## 5) Quality bar and debugging checklists

Minimum quality:

- Deterministic behavior: set `temperature` low (0–0.2) for these utility tasks.
- Clear outputs: the tool agent answers the user’s compound question coherently.

Debugging tips:

- Inspect the LangSmith tree: verify tool arguments match the schema and return strings/JSON as you expect.
- Add console logs for inputs/outputs if needed (keep them temporary).

---

## 6) Practice exercises (optional but recommended)

- Prompting variations: ask the model to show its reasoning steps in a concise bullet list (no chain‑of‑thought, just a
  short plan), then answer.
- Schema errors: change `add_numbers` to accept strings `{ a: string, b: string }` and coerce; validate with Zod;
  observe error handling.
- Add a new tool: `format_currency` that takes `{ amount: number, currency: string }` and returns a formatted string.

Acceptance for exercises:

- The agent correctly uses any new tools without hallucinated arguments.
- Traces clearly show tool selection and inputs.

---

## 7) Phase completion checklist

- Repo bootstrapped with scripts and `.env` configured.
- Single LLM call works and is traced in LangSmith.
- Tool‑bound agent returns correct results for math/date query; tool calls visible in traces.
- You can confidently read a trace and explain each node/call.

---

## 8) What’s next (Phase 2 preview)

In Phase 2, you will:

- Build a minimal RAG pipeline (in‑memory vector store) and a retrieval tool.
- Prepare a small `data/knowledge/` set and verify relevant chunk retrieval.
- Ground answers with citations to build the research agent in Phase 3.
