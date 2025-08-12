//https://js.langchain.com/docs/concepts/tools/
//https://js.langchain.com/docs/how_to/custom_tools/#dynamicstructuredtool
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Understanding Tool Anatomy
export class ToolAnatomy {
  // Every tool has 4 essential parts:
  static exampleTool = new DynamicStructuredTool({
    // 1. Name - How the LLM refers to it
    name: 'example_tool',

    // 2. Description - Helps LLM decide when to use it
    description: 'This tool does X when you need Y',

    // 3. Schema - Validates inputs (contract)
    schema: z.object({
      required_param: z.string(),
      optional_param: z.number().optional(),
    }),

    // 4. Implementation - What it actually does
    func: async ({ required_param, optional_param }) => {
      // Tool logic here
      return `Result: ${required_param}`;
    },
  });
}

// Category 1: Information Retrieval Tools
export const informationTools = {
  // Web Search Tool
  webSearch: new DynamicStructuredTool({
    name: 'web_search',
    description: 'Search the web for current information',
    schema: z.object({
      query: z.string().describe('Search query'),
      num_results: z.number().min(1).max(10).default(5),
    }),
    func: async ({ query, num_results }) => {
      // Simulate web search
      console.log(`Searching for: ${query}`);
      return `Found ${num_results} results for "${query}"`;
    },
  }),

  // Database Query Tool
  databaseQuery: new DynamicStructuredTool({
    name: 'database_query',
    description: 'Query internal database for user information',
    schema: z.object({
      table: z.enum(['users', 'products', 'orders']),
      filters: z.record(z.any()).optional(),
      limit: z.number().default(10),
    }),
    func: async ({ table, filters, limit }) => {
      console.log(`Querying ${table} with filters:`, filters);
      return `Retrieved ${limit} records from ${table}`;
    },
  }),

  // File Reader Tool
  fileReader: new DynamicStructuredTool({
    name: 'read_file',
    description: 'Read contents of a file',
    schema: z.object({
      path: z.string(),
      encoding: z.enum(['utf8', 'base64']).default('utf8'),
    }),
    func: async ({ path, encoding }) => {
      // In production, implement actual file reading
      return `Contents of ${path} (${encoding})`;
    },
  }),
};

// Category 2: Computation Tools
export const computationTools = {
  // Calculator Tool with Error Handling
  calculator: new DynamicStructuredTool({
    name: 'calculator',
    description: 'Perform mathematical calculations',
    schema: z.object({
      expression: z.string().describe('Math expression like "2 + 2 * 3"'),
      precision: z.number().min(0).max(10).default(2),
    }),
    func: async ({ expression, precision }) => {
      try {
        // In production, use a safe math parser
        const result = eval(expression); // DON'T use eval in production!
        return result.toFixed(precision);
      } catch (error) {
        return `Error: Invalid expression "${expression}"`;
      }
    },
  }),

  // Data Transformer Tool
  dataTransformer: new DynamicStructuredTool({
    name: 'transform_data',
    description: 'Transform data between formats',
    schema: z.object({
      data: z.any(),
      from_format: z.enum(['json', 'csv', 'xml']),
      to_format: z.enum(['json', 'csv', 'xml']),
    }),
    func: async ({ data, from_format, to_format }) => {
      console.log(`Transforming from ${from_format} to ${to_format}`);
      // Implement transformation logic
      return `Transformed data to ${to_format}`;
    },
  }),

  // Statistics Tool
  statistics: new DynamicStructuredTool({
    name: 'calculate_statistics',
    description: 'Calculate statistical measures',
    schema: z.object({
      numbers: z.array(z.number()),
      measures: z.array(z.enum(['mean', 'median', 'mode', 'std_dev'])),
    }),
    func: async ({ numbers, measures }) => {
      const results: Record<string, number> = {};

      if (measures.includes('mean')) {
        results.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      }

      if (measures.includes('median')) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        results.median =
          sorted.length % 2
            ? sorted[mid]!
            : (sorted[mid - 1]! + sorted[mid]!) / 2;
      }

      return JSON.stringify(results, null, 2);
    },
  }),
};

// Category 3: Integration Tools
export const integrationTools = {
  // API Caller Tool
  apiCaller: new DynamicStructuredTool({
    name: 'call_api',
    description: 'Make HTTP API calls',
    schema: z.object({
      url: z.string().url(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
    }),
    func: async ({ url, method, headers, body }) => {
      console.log(`${method} ${url}`);
      // Implement actual API call
      return `API call to ${url} successful`;
    },
  }),

  // Email Sender Tool
  emailSender: new DynamicStructuredTool({
    name: 'send_email',
    description: 'Send email notifications',
    schema: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      cc: z.array(z.string().email()).optional(),
    }),
    func: async ({ to, subject, body, cc }) => {
      console.log(`Sending email to ${to}: ${subject}`);
      return `Email sent successfully to ${to}`;
    },
  }),

  // Notification Tool
  notifier: new DynamicStructuredTool({
    name: 'send_notification',
    description: 'Send notifications through various channels',
    schema: z.object({
      channel: z.enum(['slack', 'discord', 'webhook']),
      message: z.string(),
      metadata: z.record(z.any()).optional(),
    }),
    func: async ({ channel, message, metadata }) => {
      console.log(`Sending to ${channel}: ${message}`);
      return `Notification sent via ${channel}`;
    },
  }),
};
