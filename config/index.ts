import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({ path: envFile });

const ConfigSchema = z.object({
  // Environment
  env: z.enum(['development', 'test', 'staging', 'production']),
  // LLM
  llm: z.object({
    provider: z.enum(['openai', 'anthropic', 'google']),
    model: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(32000),
    timeout: z.number().min(1000),
    retryAttempts: z.number().min(0).max(5),
    retryDelay: z.number().min(100),
  }),
  // API Keys
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    google: z.string().optional(),
    langsmith: z.string(),
  }),
  // Observability
  tracing: z.object({
    enabled: z.boolean().default(false),
    project: z.string().optional(),
    endpoint: z.string().url(),
    sampleRate: z.number().min(0).max(1),
  }),

  // Performance
  performance: z.object({
    enableCaching: z.boolean(),
    cacheTTL: z.number(),
    maxConcurrency: z.number(),
    requestTimeout: z.number(),
  }),

  // Rate Limiting
  rateLimiting: z.object({
    enabled: z.boolean(),
    requests: z.number(),
    window: z.number(),
  }),
});

export const config = ConfigSchema.parse({
  env: process.env.NODE_ENV || 'development',
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
  },

  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY,
    langsmith: process.env.LANGCHAIN_API_KEY!,
  },

  tracing: {
    enabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
    project: process.env.LANGCHAIN_PROJECT || 'agents-lab',
    endpoint: process.env.LANGCHAIN_ENDPOINT || 'https://api.langsmith.com',
    sampleRate: parseFloat(process.env.TRACE_SAMPLE_RATE || '1.0'),
  },

  performance: {
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600'),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '60000'),
  },

  rateLimiting: {
    enabled: process.env.ENABLE_RATE_LIMITING === 'true',
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  },
});

export type Config = z.infer<typeof ConfigSchema>;
