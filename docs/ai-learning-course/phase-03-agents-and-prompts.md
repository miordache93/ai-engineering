## Phase 3 — Role Agents (Research, Writer, Critic)

### Objectives

- Define three role‑specific agents with tailored system prompts.
- Enable the Research agent to use the retrieval tool to ground outputs with citations.
- Produce structured outputs (notes → draft brief → critique).

### Deliverables

- `src/agents/researchAgent.ts`
- `src/agents/writerAgent.ts`
- `src/agents/criticAgent.ts`

### Estimated time

- 60–90 minutes

---

## 1) Research agent

Create `src/agents/researchAgent.ts`:

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

Notes:

- The agent is encouraged (but not forced) to call `retrieve_docs`. Check LangSmith traces to verify tool usage.

---

## 2) Writer agent

Create `src/agents/writerAgent.ts`:

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

---

## 3) Critic agent

Create `src/agents/criticAgent.ts`:

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

---

## 4) Test locally

Quick scratch test in `src/index.ts`:

```ts
import 'dotenv/config';
import { runResearchAgent } from './agents/researchAgent.js';
import { runWriterAgent } from './agents/writerAgent.js';
import { runCriticAgent } from './agents/criticAgent.js';

async function main() {
  const research = await runResearchAgent('SMB CRM competitors and differentiators for a new entrant');
  const notes = String(research.content);
  const draft = await runWriterAgent(notes);
  const brief = String(draft.content);
  const critique = await runCriticAgent(brief);
  console.log('\n=== NOTES ===\n', notes);
  console.log('\n=== BRIEF ===\n', brief);
  console.log('\n=== CRITIQUE ===\n', String(critique.content));
}

main();
```

Run:

```bash
yarn dev
```

Acceptance:

- Research output includes citations like `[source: file.md]`.
- Writer output follows the requested headings.
- Critic output lists issues and actionable edits.

---

## 5) Exercises

- Add a “tone” parameter to the Writer agent (e.g., `professional`, `casual`) and condition the prompt accordingly.
- Enforce a strict output format (JSON with sections) then render to markdown.
- Make the Critic provide an overall score (1–5) and top 3 improvement actions.

Acceptance:

- Outputs adhere to formats; traces show parameterized prompting.

---

## 6) Next (Phase 4 preview)

You will orchestrate these agents with a Supervisor in LangGraph, routing tasks and iterating until done.
