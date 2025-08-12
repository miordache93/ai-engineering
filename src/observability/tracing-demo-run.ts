import { ChatOpenAI } from '@langchain/openai';
import { AgentTracer } from './tracing';

async function runTracingDemo() {
  // 🔧 Initialize the tracer - creates LangSmith client, logger, and unique run ID
  const tracer = new AgentTracer();

  console.log('Starting tracing demo...');

  // 📊 STEP 1: Start tracing an LLM operation
  // This creates a "span" - a unit of work we want to track
  const spanId = await tracer.traceEvent({
    name: 'openai_chat_completion', // 🏷️  Human-readable name for this operation
    type: 'llm', // 📝  Type of operation (llm, tool, chain, etc.)
    inputs: {
      // 📥  What data went INTO this operation
      prompt: 'What is the capital of France?',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    },
    metadata: {
      // 🔖  Extra context (user info, session, etc.)
      user_id: 'demo_user',
      session_id: 'demo_session',
    },
  });
  // ✅ At this point:
  // - Span is created in LangSmith with start time
  // - Local logs record the operation start
  // - Returns spanId to track this specific operation

  // ⏰ Simulate actual LLM processing time (1 second)
  // In real code, this would be: const response = await openai.chat.completions.create(...)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 🏁 STEP 2: Complete the LLM span with results
  if (spanId) {
    await tracer.completeSpan(spanId, {
      response: 'The capital of France is Paris.', // 📤  What the LLM returned
      tokens_used: 25, // 📊  Usage metrics
    });
  }
  // ✅ At this point:
  // - Span is marked as completed in LangSmith
  // - End time recorded, duration calculated
  // - Output and metrics stored

  // 📊 STEP 3: Start tracing a tool operation (separate from LLM)
  // Tools are external functions/APIs that agents can call
  const toolSpanId = await tracer.traceEvent({
    name: 'web_search_tool', // 🔍  Name of the tool being used
    type: 'tool', // 🛠️   This is a tool operation, not LLM
    inputs: {
      // 📥  Parameters passed to the tool
      query: 'latest AI news',
      num_results: 5,
    },
  });
  // ✅ Tool span started, waiting for completion...

  // 🏁 STEP 4: Complete the tool span
  if (toolSpanId) {
    await tracer.completeSpan(toolSpanId, {
      results: ['Result 1', 'Result 2', 'Result 3'], // 📋  What the tool returned
    });
  }
  // ✅ Tool operation fully traced

  // 📈 STEP 5: Record custom metrics (not tied to specific spans)
  // These are standalone measurements for monitoring
  await tracer.recordMetric('response_time_ms', 1200, {
    model: 'gpt-4o-mini', // 🏷️  Tags for filtering/grouping metrics
    endpoint: 'chat/completions',
  });
  // ✅ Metric logged locally and can be aggregated later

  console.log('Tracing demo completed!');

  // 🎯 FINAL RESULT:
  // - 2 complete traces in LangSmith (LLM + Tool)
  // - 1 custom metric recorded
  // - Local logs for debugging
  // - Full observability into AI operations
}

async function realLLMWithTracing() {
  const tracer = new AgentTracer();
  const model = new ChatOpenAI({ modelName: 'gpt-4o-mini', streamUsage: true });

  // Start tracing
  const spanId = await tracer.traceEvent({
    name: 'openai_chat_completion',
    type: 'llm',
    inputs: { prompt: 'What is the capital of France?' },
  });

  // 🔥 ACTUAL LLM CALL
  const response = await model.invoke('What is the capital of France?');

  // Complete tracing with real results
  if (spanId) {
    await tracer.completeSpan(spanId, {
      response: response.content, // ← Real LLM response
      tokens_used: (response as any).usage?.total_tokens,
    });
  }

  return response;
}

// 🚀 Run the demo and catch any errors
// runTracingDemo().catch(console.error);

realLLMWithTracing().catch(console.error);
