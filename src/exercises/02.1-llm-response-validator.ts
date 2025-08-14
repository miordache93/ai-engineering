// Response Validator for LLM outputs
// Exercise 2.2 implementation
// - Validates LLM outputs against schemas (Zod)
// - Retries on validation failure with an automatic "repair" prompt
// - Provides helpful error messages (path-aware from Zod)
// - Logs validation metrics (success rate, retries, latency)
//
// Dependencies:
//   npm i zod @langchain/openai @langchain/core
//   export OPENAI_API_KEY="..."

import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { config } from '../../config';

// -------------------- Types --------------------
export interface ValidationMetrics {
  total: number;
  success: number;
  failed: number;
  repaired: number; // succeeded after >=1 retry
  retries: number; // total retry attempts across calls
  lastError?: string;
  latenciesMs: number[]; // per call latency (ms)
}

export interface ValidatorOptions<T> {
  model: ChatOpenAI;
  schema: z.ZodType<T>;
  maxRetries?: number; // e.g., 2
  // Optional: inject extra system guidance
  systemInstruction?: string;
}

// -------------------- Helper: pretty Zod errors --------------------
function formatZodError(err: z.ZodError): string {
  return err.errors
    .map((e) => `path: ${e.path.join('.') || '<root>'} | issue: ${e.message}`)
    .join('\n');
}

// -------------------- ResponseValidator --------------------
export class ResponseValidator<T> {
  private model: ChatOpenAI;
  private schema: z.ZodType<T>;
  private maxRetries: number;
  private systemInstruction: string;
  public metrics: ValidationMetrics = {
    total: 0,
    success: 0,
    failed: 0,
    repaired: 0,
    retries: 0,
    latenciesMs: [],
  };

  constructor(opts: ValidatorOptions<T>) {
    this.model = opts.model;
    this.schema = opts.schema;
    this.maxRetries = opts.maxRetries ?? 2;
    this.systemInstruction =
      opts.systemInstruction ??
      'You must output ONLY valid JSON that strictly conforms to the schema description. Do not include markdown fences or prose.';
  }

  // Core entry: ask the model for structured output that matches the schema
  async generateValidated(messages: BaseMessage[]): Promise<T> {
    const started = Date.now();
    this.metrics.total += 1;

    // 1) Ask model to produce JSON according to schema description
    const initial = await this.model.invoke([
      new SystemMessage(
        this.systemInstruction + '\n\n' + this.describeSchemaForLLM()
      ),
      ...messages,
      new HumanMessage(
        'Return only JSON that validates against the schema above.'
      ),
    ]);

    const firstText = initial.content.toString();
    try {
      const parsed = this.safeParse(firstText);
      this.metrics.success += 1;
      this.metrics.latenciesMs.push(Date.now() - started);
      return parsed;
    } catch (e) {
      // 2) Retry loop with a repair prompt
      let lastError = e instanceof Error ? e.message : String(e);
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        this.metrics.retries += 1;
        const repair = await this.model.invoke([
          new SystemMessage(
            this.systemInstruction + '\n\n' + this.describeSchemaForLLM()
          ),
          ...messages,
          new AIMessage(
            `Previous output was invalid. Validation error(s):\n${lastError}\n\nPlease fix the JSON to satisfy the schema exactly. Return ONLY JSON.`
          ),
        ]);
        const text = repair.content.toString();
        try {
          const parsed = this.safeParse(text);
          this.metrics.success += 1;
          this.metrics.repaired += 1;
          this.metrics.latenciesMs.push(Date.now() - started);
          return parsed;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      // 3) All retries exhausted
      this.metrics.failed += 1;
      this.metrics.lastError = lastError;
      this.metrics.latenciesMs.push(Date.now() - started);
      throw new Error(
        'Validation failed after retries. Last error: \n' + lastError
      );
    }
  }

  // -------------------- Internals --------------------
  private safeParse(text: string): T {
    // Be tolerant to accidentally wrapped code fences
    const cleaned = text
      .trim()
      .replace(/^```(json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    let obj: unknown;
    try {
      obj = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Output was not valid JSON. Raw: ${truncate(text, 500)}`);
    }
    const result = this.schema.safeParse(obj);
    if (!result.success) {
      throw new Error(formatZodError(result.error));
    }
    return result.data;
  }

  private describeSchemaForLLM(): string {
    // Provide a human-readable schema description from Zod
    // (Short version; for complex schemas consider zod-to-json-schema)
    return 'Schema (natural language):\n' + describeZod(this.schema);
  }
}

// -------------------- Zod schema describer (lightweight) --------------------
function describeZod(schema: z.ZodTypeAny, indent = 0): string {
  const pad = (n: number) => ' '.repeat(n);
  const t = schema._def;
  const kind = (t as any).typeName;
  switch (kind) {
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const shape = (schema as z.ZodObject<any>).shape;
      return (
        pad(indent) +
        'object {\n' +
        Object.entries(shape)
          .map(
            ([k, v]) =>
              `${pad(indent + 2)}${k}: ${describeZod(v as any, indent + 2)}`
          )
          .join('\n') +
        '\n' +
        pad(indent) +
        '}'
      );
    }
    case z.ZodFirstPartyTypeKind.ZodArray:
      return `array<${describeZod((schema as any)._def.type, 0)}>`;
    case z.ZodFirstPartyTypeKind.ZodString:
      return 'string';
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return 'number';
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return 'boolean';
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return `enum<${(schema as z.ZodEnum<any>).options.join('|')}>`;
    case z.ZodFirstPartyTypeKind.ZodUnion:
      return `union<${(schema as any)._def.options.map((o: any) => describeZod(o)).join(' | ')}>`;
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return `literal<${JSON.stringify((schema as any)._def.value)}>`;
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `nullable<${describeZod((schema as any)._def.innerType)}>`;
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `optional<${describeZod((schema as any)._def.innerType)}>`;
    default:
      return '(complex type)';
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// -------------------- Example usage --------------------
// A canonical output schema for Q&A with citations and calibrated confidence
export const AnswerSchema = z.object({
  answer: z.string().min(1, 'answer required'),
  citations: z.array(z.string().url('must be URL')).max(5, 'max 5 citations'),
  confidence: z.number().min(0).max(1),
});
export type Answer = z.infer<typeof AnswerSchema>;

export async function demoValidator() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: config.apiKeys.openai,
  });

  const validator = new ResponseValidator<Answer>({
    model,
    schema: AnswerSchema,
    maxRetries: 2,
    systemInstruction:
      'You are a structured-output generator. Respond ONLY with strict JSON conforming to the provided schema.',
  });

  const messages: BaseMessage[] = [
    new SystemMessage(
      'You answer questions briefly with URLs as citations when possible.'
    ),
    new HumanMessage(
      'What is LangSmith and how is it used? Provide up to 2 references.'
    ),
  ];

  try {
    const result = await validator.generateValidated(messages);
    console.log('Validated result:\n', result);
    console.log('Metrics:', validator.metrics);
  } catch (e) {
    console.error('Final validation failure:\n', e);
  }
}

// Uncomment to run locally
demoValidator().catch(console.error);
