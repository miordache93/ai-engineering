import { computationTools, informationTools } from '@/tools/fundamentals';
import { ChatOpenAI } from '@langchain/openai';
import { profile } from 'console';

export class AgentDebugger {
  private breakpoints = new Set<string>();
  private watchedValues = new Map<string, any>();

  setBreakpoint(location: string) {
    this.breakpoints.add(location);
  }

  async checkBreakPoint(location: string, context: any) {
    if (this.breakpoints.has(location)) {
      console.log(`Breakpoint hit at ${location}`);
      console.log('Context:', context);
      // Here you could pause execution or log more details
      // For demo purposes, we just log and continue
      if (process.env.NODE_ENV === 'development') {
        await this.pause();
      }
    }
  }

  private async pause() {
    console.log('Press Enter to continue...');
    await new Promise((resolve) => process.stdin.once('data', resolve));
  }

  watch(name: string, value: any) {
    const previous = this.watchedValues.get(name);

    if (previous !== undefined && previous !== value) {
      console.log(`Watch: ${name} changed from ${previous} to ${value}`);
    }

    this.watchedValues.set(name, value);
  }

  profile(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
    };
  }

  // Memory usage tracking
  trackMemory(label: string) {
    const usage = process.memoryUsage();
    console.log(`💾 Memory (${label}):`);
    console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  }
}

// Example: Debugging a tool-calling agent
export async function debugAgentExecution() {
  const d = new AgentDebugger();
  const model = new ChatOpenAI({ temperature: 0 });

  // Set breakpoints
  d.setBreakpoint('before-tool-selection');
  d.setBreakpoint('after-tool-execution');

  // Create a traced function
  async function executeWithDebugging(query: string) {
    const profileTotal = d.profile('Total Execution');

    // Watch query changes
    d.watch('query', query);

    // Before tool selection
    await d.checkBreakPoint('before-tool-selection', { query });

    const profileToolSelection = d.profile('Tool Selection');
    const modelWithTools = model.bindTools?.([
      computationTools.calculator,
      informationTools.webSearch,
    ]);
    const response = await modelWithTools?.invoke(query);
    profileToolSelection();

    // After tool execution
    if (response?.tool_calls) {
      await d.checkBreakPoint('after-tool-execution', {
        tools: response.tool_calls,
      });
    }

    d.trackMemory('After Execution');
    profileTotal();

    return response;
  }

  // Run with debugging
  await executeWithDebugging(
    'Calculate 42 * 17 and search for TypeScript tutorials'
  );
}
