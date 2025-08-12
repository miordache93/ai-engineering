import { DynamicStructuredTool, Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { config } from '../../config';
import {
  computationTools,
  informationTools,
  integrationTools,
} from './fundamentals';

export class ToolSelectionManager {
  private model: ChatOpenAI;
  private tools: DynamicStructuredTool[] = [];

  constructor() {
    this.model = new ChatOpenAI({
      modelName: config.llm.model,
      openAIApiKey: config.apiKeys.openai,
      temperature: 0,
    });
  }

  // Method 1: Explicit Tool Binding
  async explicitBinding(userQuery: string) {
    // Bind specific tools to the model
    const toolsForQuery = this.selectToolsForQuery(userQuery);
    const modelWithTools = this.model?.bindTools?.(toolsForQuery ?? []);

    if (!modelWithTools) {
      throw new Error('Failed to bind tools to model');
    }

    const response = await modelWithTools.invoke(userQuery);

    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(
        'Tools calls:',
        response.tool_calls.map((tc) => tc.name)
      );

      for (const toolCall of response.tool_calls) {
        const tool = this.tools.find((t) => t.name === toolCall.name);
        if (tool) {
          const result = await tool.func(toolCall.args);
          console.log(`Tool ${toolCall.name} result:`, result);
        }
      }
    }

    return response;
  }

  // Method 2: Dynamic Tool Selection
  private selectToolsForQuery(query: string) {
    const queryLower = query.toLowerCase();
    const selected: DynamicStructuredTool[] = [];

    if (queryLower.includes('calculate') || queryLower.includes('math')) {
      selected.push(computationTools.calculator);
    }

    if (queryLower.includes('search') || queryLower.includes('web')) {
      selected.push(informationTools.webSearch);
    }

    if (queryLower.includes('email') || queryLower.includes('send')) {
      selected.push(integrationTools.emailSender);
    }

    return selected.length > 0 ? selected : undefined;
  }

  // Method 3: Tool Choice Strategies
  async demonstrateToolChoiceStrategies(query: string) {
    // Strategy 1: Auto Tool Choice (let model decide)
    const autoResponse = await this.model
      .bindTools?.(this.tools, {
        tool_choice: 'auto',
      })
      .invoke(query);

    // Strategy 2: Required (must use a tool)
    const requiredResponse = await this.model
      .bindTools?.(this.tools, {
        tool_choice: 'required',
      })
      .invoke(query);

    // Strategy 3: Specific tool
    const specificToolResponse = await this.model
      .bindTools?.(this.tools, {
        tool_choice: {
          type: 'function',
          function: {
            name: 'calculator',
          },
        },
      })
      .invoke(query);

    // Strategy 4: None (don't use tools)
    const noneResponse = await this.model
      .bindTools?.(this.tools, {
        tool_choice: 'none',
      })
      .invoke(query);

    return {
      auto: autoResponse,
      required: requiredResponse,
      specific: specificToolResponse,
      none: noneResponse,
    };
  }
}
