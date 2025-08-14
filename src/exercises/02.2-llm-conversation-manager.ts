// Conversation Manager for LLM apps (RAG-friendly)
// Features:
// - Maintains conversation history per thread
// - Sliding window by token budget
// - Progressive compression (running summary of old messages)
// - Works with LangChain.js + OpenAI Chat models
//
// Notes:
// - Replace the naive token estimator with `js-tiktoken` for accuracy.
// - Storage is in-memory for simplicity; swap with Redis/DB by implementing Storage interface.

import { ChatOpenAI } from '@langchain/openai';
import { config } from '../../config';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';

// -------------------- Types & Interfaces --------------------
export type Role = 'system' | 'user' | 'assistant';

export interface MessageRecord {
  id: string;
  role: Role;
  content: string;
  createdAt: number; // epoch ms
}

export interface ThreadState {
  id: string;
  messages: MessageRecord[]; // full history
  summary: string; // progressive compressed summary of old messages
  lastUpdated: number;
}

export interface Storage {
  getThread(threadId: string): Promise<ThreadState | undefined>;
  saveThread(state: ThreadState): Promise<void>;
}

// Simple in-memory storage (swap with Redis/DB in prod)
export class MemoryStorage implements Storage {
  private store = new Map<string, ThreadState>();
  async getThread(threadId: string) {
    return this.store.get(threadId);
  }
  async saveThread(state: ThreadState) {
    this.store.set(state.id, state);
  }
}

// -------------------- Utilities --------------------
function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Very rough token estimator (replace with js-tiktoken)
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words * 1.3));
}

// Convert MessageRecord -> LangChain BaseMessage
function toBaseMessage(m: MessageRecord): BaseMessage {
  if (m.role === 'user') return new HumanMessage(m.content);
  if (m.role === 'assistant') return new AIMessage(m.content);
  return new SystemMessage(m.content);
}

// -------------------- ConversationManager --------------------
export interface ConversationManagerOptions {
  model: ChatOpenAI;
  storage?: Storage;
  // max tokens to send to the model (prompt + summary + recent msgs)
  maxPromptTokens?: number; // e.g., 6_000 for a 8k context model
  // when history exceeds this many tokens, start compressing older chunks
  compressAfterTokens?: number; // e.g., 4_000
  // number of most-recent messages to always keep verbatim (if space allows)
  keepRecent?: number; // e.g., 8
  systemPrompt?: string; // default system behavior across threads
}

export class ConversationManager {
  private model: ChatOpenAI;
  private storage: Storage;
  private maxPromptTokens: number;
  private compressAfterTokens: number;
  private keepRecent: number;
  private systemPrompt: string;

  constructor(opts: ConversationManagerOptions) {
    this.model = opts.model;
    this.storage = opts.storage ?? new MemoryStorage();
    this.maxPromptTokens = opts.maxPromptTokens ?? 6000;
    this.compressAfterTokens = opts.compressAfterTokens ?? 4000;
    this.keepRecent = opts.keepRecent ?? 8;
    this.systemPrompt =
      opts.systemPrompt ??
      'You are a helpful, concise assistant. Use the `Thread Summary` for long-term context.';
  }

  async initThread(threadId?: string): Promise<string> {
    const id = threadId ?? uuid();
    const existing = await this.storage.getThread(id);
    if (!existing) {
      const state: ThreadState = {
        id,
        messages: [],
        summary: '',
        lastUpdated: Date.now(),
      };
      await this.storage.saveThread(state);
    }
    return id;
  }

  async addUserMessage(threadId: string, content: string) {
    const state = await this.requireThread(threadId);
    state.messages.push({
      id: uuid(),
      role: 'user',
      content,
      createdAt: Date.now(),
    });
    state.lastUpdated = Date.now();
    await this.storage.saveThread(state);
  }

  async addAssistantMessage(threadId: string, content: string) {
    const state = await this.requireThread(threadId);
    state.messages.push({
      id: uuid(),
      role: 'assistant',
      content,
      createdAt: Date.now(),
    });
    state.lastUpdated = Date.now();
    await this.storage.saveThread(state);
  }

  // Build the prompt messages with sliding-window + summary
  async buildContext(threadId: string): Promise<BaseMessage[]> {
    const state = await this.requireThread(threadId);

    // Always start with a system message that includes the running summary if present
    const header = new SystemMessage(
      `${this.systemPrompt}\n\n---\nThread Summary (compressed):\n${state.summary || '(none yet)'}`
    );

    // Start from recent messages and go backward until we hit token budget
    const messages = [...state.messages];
    const recent: MessageRecord[] = messages.slice(-this.keepRecent);

    // Compute tokens
    let tokenBudget = this.maxPromptTokens;
    tokenBudget -= estimateTokens(header.content as string);

    const selected: MessageRecord[] = [];
    // include recent forward
    for (const m of recent) {
      const t = estimateTokens(m.content) + 5; // overhead per message
      if (tokenBudget - t <= 0) break;
      selected.push(m);
      tokenBudget -= t;
    }

    // If there's still room, pull older messages from just before the recent window
    const older = messages
      .slice(0, Math.max(0, messages.length - this.keepRecent))
      .reverse();
    for (const m of older) {
      const t = estimateTokens(m.content) + 5;
      if (tokenBudget - t <= 0) break;
      // unshift later to preserve chronological order
      selected.unshift(m);
      tokenBudget -= t;
    }

    return [header, ...selected.map(toBaseMessage)];
  }

  // Progressive compression: summarize oldest chunk into state.summary
  async maybeCompress(threadId: string) {
    const state = await this.requireThread(threadId);
    const totalTokens = estimateTokens(
      state.messages.map((m) => m.content).join(' \n')
    );
    if (totalTokens < this.compressAfterTokens) return;

    // Take the oldest 25% of the messages (at least 6) for compression
    const n = Math.max(6, Math.floor(state.messages.length * 0.25));
    const chunk = state.messages.splice(0, n); // remove from history

    const compressionPrompt = [
      new SystemMessage(
        'Summarize the following chat messages into a concise, factual running summary. Keep entities, decisions, and any explicit constraints. Use bullet points.'
      ),
      new HumanMessage(
        `Existing summary (may be empty):\n${state.summary}\n\nMessages to compress:\n${chunk.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\nReturn only the updated summary.`
      ),
    ];

    const res = await this.model.invoke(compressionPrompt);
    state.summary = res.content.toString().trim();
    state.lastUpdated = Date.now();
    await this.storage.saveThread(state);
  }

  async generate(threadId: string, userInput: string): Promise<string> {
    await this.addUserMessage(threadId, userInput);

    // Potentially compress before building the next context
    await this.maybeCompress(threadId);

    const context = await this.buildContext(threadId);

    const response = await this.model.invoke(context);
    const text = response.content.toString();

    await this.addAssistantMessage(threadId, text);
    return text;
  }

  async getThreadView(
    threadId: string
  ): Promise<{ summary: string; messages: MessageRecord[] }> {
    const state = await this.requireThread(threadId);
    return { summary: state.summary, messages: state.messages };
  }

  private async requireThread(threadId: string): Promise<ThreadState> {
    const state = await this.storage.getThread(threadId);
    if (!state)
      throw new Error(`Thread ${threadId} not found. Call initThread() first.`);
    return state;
  }
}

// -------------------- Example usage --------------------
// 1) npm i @langchain/openai @langchain/core
// 2) export OPENAI_API_KEY="..."
// 3) import and run a quick demo

async function demo() {
  const model = new ChatOpenAI({
    modelName: config.llm.model,
    temperature: 0.3,
  });

  const mgr = new ConversationManager({
    model,
    maxPromptTokens: 6000,
    compressAfterTokens: 4000,
    keepRecent: 8,
    systemPrompt:
      'You are a senior AI engineering copilot. Be terse, accurate, and cite steps when useful.',
  });

  const threadId = await mgr.initThread();
  await mgr.generate(
    threadId,
    'We are building an LLM app. Goals: RAG + chat + eval. Remember that.'
  );
  await mgr.generate(
    threadId,
    'Add tasks: implement vector search with hybrid BM25 + dense.'
  );
  await mgr.generate(threadId, 'What should we do next?');

  const view = await mgr.getThreadView(threadId);
  console.log('Summary:\n', view.summary);
  console.log('Messages:', view.messages.length);
}

// Uncomment to run locally
demo().catch(console.error);
