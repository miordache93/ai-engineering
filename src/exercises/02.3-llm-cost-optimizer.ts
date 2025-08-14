// exercises/02-llm-interaction.ts
// Implementation for Exercise 2.3: Cost Optimizer (simple version)
// Stack: TypeScript + LangChain.js
//
// Install deps:
//   npm i @langchain/openai @langchain/core
//   export OPENAI_API_KEY="..."

import { ChatOpenAI } from '@langchain/openai';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

// --- Pricing table (update to your rates) ---
const PRICING = {
  'gpt-4o-mini': { inputPer1K: 0.0005, outputPer1K: 0.0015 },
  'gpt-4o': { inputPer1K: 0.005, outputPer1K: 0.015 },
} as const;

type ModelKey = keyof typeof PRICING;

function estimateCostUsd(
  model: ModelKey,
  inputTokens: number,
  outputTokens: number
) {
  const p = PRICING[model];
  return round(
    (inputTokens / 1000) * p.inputPer1K + (outputTokens / 1000) * p.outputPer1K
  );
}

function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

function alerts(
  { dailyUsd, monthlyUsd }: { dailyUsd: number; monthlyUsd: number },
  budget: { dailyUsd?: number; monthlyUsd?: number; warnAt?: number }
) {
  const warnAt = budget.warnAt ?? 0.8;
  const msgs: string[] = [];
  if (budget.dailyUsd && dailyUsd >= budget.dailyUsd * warnAt)
    msgs.push(`Daily spend warning: $${round(dailyUsd)}`);
  if (budget.monthlyUsd && monthlyUsd >= budget.monthlyUsd * warnAt)
    msgs.push(`Monthly spend warning: $${round(monthlyUsd)}`);
  return msgs;
}

function suggestions(avgIn: number, avgOut: number): string[] {
  const s: string[] = [];
  if (avgIn > 3000)
    s.push(
      'Reduce prompt/context size (summaries, top-k, shorter system prompt)'
    );
  if (avgOut > 800) s.push('Constrain output (bullets/JSON, lower max tokens)');
  return s;
}

export async function exercise2_3() {
  // Configure
  const modelName: ModelKey = 'gpt-4o-mini';
  const budget = { dailyUsd: 2, monthlyUsd: 50, warnAt: 0.8 };

  const model = new ChatOpenAI({ modelName, temperature: 0 });

  // Build a tiny wrapper that records usage/cost per call
  let dailyTotal = 0;
  let monthlyTotal = 0;
  const call = async (messages: BaseMessage[]) => {
    const res = await model.invoke(messages);
    const usage: any = (res as any).usage_metadata || {};
    const inTok = usage.input_tokens ?? 0;
    const outTok = usage.output_tokens ?? 0;
    const cost = estimateCostUsd(modelName, inTok, outTok);
    dailyTotal += cost;
    monthlyTotal += cost;
    return { res, inTok, outTok, cost };
  };

  // --- Example: make one request (adapt as needed) ---
  const messages: BaseMessage[] = [
    new SystemMessage('Be concise.'),
    new HumanMessage('Give me 3 ideas for onboarding UX in bullet points.'),
  ];

  const { res, inTok, outTok, cost } = await call(messages);

  // Compute simple optimization hints using this one call as the average
  const hints = suggestions(inTok, outTok);

  // Check budget
  const budgetAlerts = alerts(
    { dailyUsd: dailyTotal, monthlyUsd: monthlyTotal },
    budget
  );

  // Return a compact report (you can log or display this in your app)
  return {
    model: modelName,
    output: String((res as any).content ?? ''),
    tokens: { input: inTok, output: outTok },
    cost: {
      lastCallUsd: cost,
      totals: { dailyUsd: round(dailyTotal), monthlyUsd: round(monthlyTotal) },
    },
    alerts: budgetAlerts,
    suggestions: hints,
  };
}
