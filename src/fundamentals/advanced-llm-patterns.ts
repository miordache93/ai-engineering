import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { config } from '../../config';

export async function stramingResponses() {
  const model = new ChatOpenAI({
    openAIApiKey: config.apiKeys.openai,
    modelName: config.llm.model,
    streaming: true,
    temperature: 0.7,
  });

  console.log('Streaming response:');

  const stream = await model.stream(
    'Tell me a story about a robot learning to code'
  );

  for await (const chunk of stream) {
    process.stdout.write(chunk.content.toString());
  }

  console.log('\nStreaming complete');
}

// stramingResponses();

export async function structuredOutput() {
  const model = new ChatOpenAI({
    modelName: config.llm.model,
    openAIApiKey: config.apiKeys.openai,
    temperature: 0,
  });

  const schema = z.object({
    name: z.string(),
    age: z.number(),
    skills: z.array(z.string()),
    experience: z.object({
      years: z.number(),
      level: z.enum(['junior', 'mid', 'senior']),
    }),
  });

  const prompt = `
  Extract the following information from this text and return as JSON:
   "John Doe is a 28 years-old software engineer with 5 years of experiece.
   He is skilled in TypeScript, React, and Node.js. He is considered a mid-level engineer."
   Make sure you don't include any other characters except the JSON object.
  `;

  const modelWithStructuredOutput = model.withStructuredOutput(schema);
  const response = await modelWithStructuredOutput.invoke(prompt);
  console.log('Structured output:', response);
}

// structuredOutput();

export async function fewShotLearning() {
  const model = new ChatOpenAI({
    modelName: config.llm.model,
    openAIApiKey: config.apiKeys.openai,
    temperature: 0.3,
  });

  const examples = [
    { input: 'The movie was fantastic!', output: 'positive' },
    { input: 'I hated every minute of it', output: 'negative' },
    { input: 'It was okay, nothing special', output: 'neutral' },
  ];

  const prompt = `
    Classify the sentiment of text as positive, negative, or neutral.

    Examples:
    ${examples.map((e) => `Input: ${e.input}\nOutput: ${e.output}`).join('\n')}

    Now classify this:
    Input: "The product exceeded my expectations in every way!"
  `;

  const response = await model.invoke(prompt);
  console.log('Classification: ', response.content);
}

// fewShotLearning();

export async function chainOfThought() {
  const model = new ChatOpenAI({
    temperature: 0.2,
  });

  const problemSolvingPrompt = `
   Solve this problem step by step, showing your reasoning:

   Problem: A bakery sells cookies for $2 each and brownies for $3 each.
   On Monday, they sold 45 cookies and 30 brownies.
   On Tuesday, they sold 60 cookies and 25 brownies.

   Let's think through this step by step:
  `;

  const response = await model.invoke(problemSolvingPrompt);
  console.log('Chain of thought solution:\n ', response.content);
}

// chainOfThought();

export async function selfConsistency() {
  const model = new ChatOpenAI({
    temperature: 0.7,
  });

  const question =
    'What are the three most important skills for a software engineer?';

  const responses = await Promise.all(
    Array(5)
      .fill(null)
      .map(() => model.invoke(question))
  );

  const skills = new Map<string, number>();

  responses.forEach((response) => {
    const content = response.content as string;

    const mentioned = content.toLowerCase().match(/\b\w+\b/g);
    mentioned?.forEach((skill) => {
      skills.set(skill, (skills.get(skill) || 0) + 1);
    });
  });

  console.log('Most consistenly mentioned skills:');

  Array.from(skills.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([skill, count]) => {
      console.log(`${skill}: ${count} times`);
    });
}

selfConsistency();
