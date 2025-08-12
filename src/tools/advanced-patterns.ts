import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { informationTools } from './fundamentals';

// Pattern 1: Composite Tools (Tools that use other tools)
export const compositeTools = {
  researchTool: new DynamicStructuredTool({
    name: 'research_topic',
    description: 'Comprehensive research on a topic',
    schema: z.object({
      topic: z.string(),
      depth: z.enum(['shallow', 'medium', 'deep']),
    }),
    func: async ({ topic, depth }) => {
      // This tool orchestrates multiple other tools
      const steps = [];

      // Step 1: Web search
      steps.push(
        await informationTools.webSearch.func({
          query: topic,
          num_results: depth === 'deep' ? 10 : 5,
        })
      );

      // Step 2: Database check
      steps.push(
        await informationTools.databaseQuery.func({
          table: 'products',
          filters: { topic },
          limit: 10,
        })
      );

      // Step 3: Analyze results
      // ... more tool calls

      return steps.join('\n');
    },
  }),
};

// Pattern 2: Stateful Tools (Tools with memory)
class StatefulToolManager {
  private state = new Map<string, any>();

  createStatefulTool() {
    return new DynamicStructuredTool({
      name: 'stateful_counter',
      description: 'A counter that remembers its value',
      schema: z.object({
        action: z.enum(['increment', 'decrement', 'get', 'reset']),
        amount: z.number().optional(),
      }),
      func: async ({ action, amount = 1 }) => {
        const current = this.state.get('counter') || 0;

        switch (action) {
          case 'increment':
            this.state.set('counter', current + amount);
            break;
          case 'decrement':
            this.state.set('counter', current - amount);
            break;
          case 'reset':
            this.state.set('counter', 0);
            break;
        }

        return `Counter is now: ${this.state.get('counter')}`;
      },
    });
  }
}

// Pattern 3: Conditional Tools (Tools with complex logic)
export const conditionalTool = new DynamicStructuredTool({
  name: 'smart_processor',
  description: 'Processes data based on type and conditions',
  schema: z.object({
    data: z.any(),
    processing_type: z.enum(['analyze', 'transform', 'validate']),
    options: z
      .object({
        format: z.string().optional(),
        rules: z.array(z.string()).optional(),
        threshold: z.number().optional(),
      })
      .optional(),
  }),
  func: async ({ data, processing_type, options }) => {
    // Complex conditional logic
    if (processing_type === 'analyze') {
      if (typeof data === 'string' && data.length > 100) {
        return 'Long text analysis result';
      } else if (Array.isArray(data)) {
        return `Array with ${data.length} elements`;
      }
    } else if (processing_type === 'transform') {
      if (options?.format === 'uppercase' && typeof data === 'string') {
        return data.toUpperCase();
      }
    }

    return 'Processed successfully';
  },
});

// Pattern 4: Streaming Tools (Tools that return streams)
export const streamingTool = new DynamicStructuredTool({
  name: 'data_streamer',
  description: 'Streams data in chunks',
  schema: z.object({
    source: z.string(),
    chunk_size: z.number().default(1024),
  }),
  func: async function* ({
    source,
    chunk_size,
  }: {
    source: string;
    chunk_size: number;
  }) {
    // Simulate streaming data
    const data =
      'This is a long piece of data that will be streamed in chunks...';

    for (let i = 0; i < data.length; i += chunk_size) {
      yield data.slice(i, i + chunk_size);
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  },
});

// Pattern 5: Error-Resilient Tools
export const resilientTool = new DynamicStructuredTool({
  name: 'resilient_processor',
  description: 'A tool that handles errors gracefully',
  schema: z.object({
    operation: z.string(),
    retry_count: z.number().default(3),
    timeout: z.number().default(5000),
  }),
  func: async ({ operation, retry_count, timeout }) => {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retry_count; attempt++) {
      try {
        // Set timeout
        const result = await Promise.race([
          performOperation(operation),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]);

        return `Success: ${result}`;
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < retry_count) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    return `Failed after ${retry_count} attempts: ${lastError?.message}`;
  },
});

async function performOperation(operation: string): Promise<string> {
  // Simulate operation that might fail
  if (Math.random() < 0.5) {
    throw new Error('Random failure');
  }
  return `Completed: ${operation}`;
}
