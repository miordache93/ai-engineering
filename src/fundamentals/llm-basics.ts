import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';
import { config } from '../../config';

export async function conversationParadigm() {
  const model = new ChatOpenAI({
    modelName: config.llm.model,
    temperature: config.llm.temperature,
  });

  const conversation = [
    new SystemMessage(
      'You are a helpful AI assistant.' // Setting context
    ),
    new HumanMessage('What is the capital of France?'),
    new AIMessage('The capital of France is Paris.'),
    new HumanMessage('What is its population?'),
  ];

  const response = await model.invoke(conversation);

  console.log('Response:', response.content);
}

// conversationParadigm();

export async function understandingTemperature() {
  const examples = [
    {
      temp: 0,
      description: 'Factual, consistend, repeatable',
    },
    {
      temp: 0.3,
      description: 'Mostly consitent with slight variations',
    },
    {
      temp: 0.7,
      description: 'Balanced creativity and consistency',
    },
    {
      temp: 1.0,
      description: 'Creative and varied responses',
    },
    {
      temp: 1.5,
      description: 'Very creative, possibly nonsensical',
    },
  ];

  for (const { temp, description } of examples) {
    const model = new ChatOpenAI({
      temperature: temp,
    });
    console.log(`\nTemperature: ${temp} - ${description}`);

    for (let i = 0; i < 3; i++) {
      const response = await model.invoke('Write a one-line poem about coding');
      console.log(`Attempt ${i + 1}. ${response.content}`);
    }
  }
}

// understandingTemperature();
/** Example responses
 * Temperature: 0 - Factual, consistend, repeatable
Attempt 1. In the language of ones and zeros, we create digital poetry.
Attempt 2. In the language of ones and zeros, we create worlds of endless possibilities.
Attempt 3. In the language of ones and zeros, I find my true expression.

Temperature: 0.3 - Mostly consitent with slight variations
Attempt 1. In the language of ones and zeros, we create worlds.
Attempt 2. In the language of ones and zeros, we create our digital world.
Attempt 3. In the language of zeros and ones, creativity thrives.

Temperature: 0.7 - Balanced creativity and consistency
Attempt 1. In the language of ones and zeros, creativity flows.
Attempt 2. In the language of ones and zeros, I create worlds of endless possibilities.
Attempt 3. In the language of ones and zeros, we create our digital world.

Temperature: 1 - Creative and varied responses
Attempt 1. In the language of ones and zeros, I find my voice.
Attempt 2. In the language of zeros and ones, creativity thrives and logic dances.
Attempt 3. In code we find beauty, logic, and infinite possibilities.

Temperature: 1.5 - Very creative, possibly nonsensical
Attempt 1. In the language of ones and zeros, I craft my dreams.
Attempt 2. In lines of code, I find beauty and order intertwined.
Attempt 3. In lines of code we craft virtual worlds and realities.
 * 
 * 
 */

function calculateCost(usage: any): string {
  // GPT-4o-mini pricing (as of 2024)
  const promptCost = ((usage?.promptTokens || 0) * 0.00015) / 1000;
  const completionCost = ((usage?.completionTokens || 0) * 0.0006) / 1000;
  return `$${(promptCost + completionCost).toFixed(6)}`;
}

export async function tokenEconomics() {
  const model = new ChatOpenAI({
    modelName: config.llm.model,
    callbacks: [
      {
        handleLLMEnd: (output) => {
          const usage = output.llmOutput?.tokenUsage;
          console.log('Token Usage:', {
            prompt: usage?.promptTokens,
            completion: usage?.completionTokens,
            total: usage?.totalTokens,
            estimatedCost: calculateCost(usage),
          });
        },
      },
    ],
  });

  const prompts = [
    'Hi', // Minimal tokens
    'Write a paragraph about AI', // Moderate tokens
    'Write a detailed 500-word essay about the history and future of artificial intelligence', // Many tokens
  ];

  for (const prompt of prompts) {
    console.log(`\nPrompt: "${prompt.substring(0, 50)}..."`);
    await model.invoke(prompt);
  }
}

// tokenEconomics();
/** Example responses
 * 
Prompt: "Hi..."
Token Usage: { prompt: 8, completion: 9, total: 17, estimatedCost: '$0.000007' }

Prompt: "Write a paragraph about AI..."
Token Usage: { prompt: 12, completion: 131, total: 143, estimatedCost: '$0.000080' }

Prompt: "Write a detailed 500-word essay about the history ..."
Token Usage: { prompt: 22, completion: 666, total: 688, estimatedCost: '$0.000403' }
*/
