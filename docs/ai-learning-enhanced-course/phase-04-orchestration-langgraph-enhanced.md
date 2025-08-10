# 🎼 Phase 4: Orchestration with LangGraph - Complete Mastery Guide
## Building Sophisticated Multi-Agent Workflows

### 🌟 Phase Overview

Welcome to the conductor's podium! This phase transforms you from an agent builder into a workflow orchestrator. You'll learn to coordinate multiple agents like a maestro conducting a symphony, where each instrument (agent) plays its part at the perfect moment to create harmonious results.

**Duration**: 7-10 days (35-45 hours total)
**Difficulty**: Advanced
**Prerequisites**: Completed Phases 1-3, understanding of state machines and graph theory basics

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **Graph-Based Orchestration Mastery**
   - Design complex agent workflows
   - Implement state machines
   - Build conditional routing
   - Create parallel execution paths

2. **State Management Expertise**
   - Manage shared state across agents
   - Implement state persistence
   - Handle state conflicts
   - Design state schemas

3. **Workflow Pattern Proficiency**
   - Master common orchestration patterns
   - Build custom workflow patterns
   - Implement error recovery
   - Design scalable architectures

4. **Performance Optimization Skills**
   - Parallelize agent execution
   - Optimize workflow paths
   - Implement caching strategies
   - Monitor workflow performance

---

## 📚 Conceptual Foundation

### The Orchestra Conductor Analogy 🎭

Orchestrating agents is like conducting an orchestra:

```typescript
interface OrchestraMetaphor {
  // The Conductor (Orchestrator)
  conductor: {
    role: 'Coordinates all musicians',
    realWorld: 'LangGraph orchestrator',
    responsibilities: [
      'Sets tempo (execution flow)',
      'Cues entrances (agent activation)',
      'Balances volume (resource allocation)',
      'Interprets score (workflow definition)'
    ]
  };
  
  // The Score (Workflow Graph)
  musicalScore: {
    notation: 'Musical notes and timing',
    realWorld: 'Nodes and edges in graph',
    elements: {
      notes: 'Individual agent tasks',
      measures: 'Workflow stages',
      dynamics: 'Conditional routing',
      tempo: 'Execution speed'
    }
  };
  
  // The Performance (Execution)
  performance: {
    rehearsal: 'Testing and debugging',
    concert: 'Production execution',
    audience: 'End users',
    reviews: 'Performance metrics'
  };
}
```

### Graph Theory for Agents 📊

```typescript
interface GraphConcepts {
  // Nodes (Vertices)
  nodes: {
    definition: 'Individual processing units',
    inAgents: 'Agent invocations or operations',
    properties: {
      id: 'Unique identifier',
      type: 'Agent, tool, decision, etc.',
      operation: 'What the node does',
      requirements: 'Input needs'
    }
  };
  
  // Edges (Connections)
  edges: {
    definition: 'Flow between nodes',
    inAgents: 'Data/control flow',
    types: {
      sequential: 'A → B (one after another)',
      conditional: 'A → B or C (based on condition)',
      parallel: 'A → [B, C] (simultaneous)',
      cyclic: 'A → B → A (loops allowed)'
    }
  };
  
  // State
  state: {
    definition: 'Shared memory across nodes',
    inAgents: 'Conversation context, results, metadata',
    management: {
      immutable: 'State never changes, only copied',
      mutable: 'State can be modified',
      channels: 'Named state variables'
    }
  };
}
```

---

## 🏗️ Part 1: LangGraph Fundamentals

### 1.1 Complete LangGraph Architecture

```typescript
// src/orchestration/langgraph-fundamentals.ts
import { StateGraph, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';

// Define state schema
interface WorkflowState {
  // Core state
  messages: BaseMessage[];
  current_task: string;
  
  // Agent outputs
  research_results?: string;
  analysis_results?: string;
  final_output?: string;
  
  // Workflow control
  next_agent?: string;
  iteration: number;
  max_iterations: number;
  should_continue: boolean;
  
  // Metadata
  workflow_id: string;
  started_at: Date;
  completed_at?: Date;
  errors: Error[];
  
  // Performance tracking
  agent_timings: Record<string, number>;
  token_usage: Record<string, number>;
}

// Advanced workflow orchestrator
export class WorkflowOrchestrator {
  private graph: StateGraph<WorkflowState>;
  private agents: Map<string, any> = new Map();
  private model: ChatOpenAI;
  
  constructor() {
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.3
    });
    
    this.initializeGraph();
    this.registerAgents();
  }
  
  // Initialize the graph structure
  private initializeGraph() {
    // Create state graph with channels
    this.graph = new StateGraph<WorkflowState>({
      channels: {
        messages: {
          value: (old: BaseMessage[], new: BaseMessage[]) => [...old, ...new],
          default: []
        },
        current_task: {
          value: (old: string, new: string) => new,
          default: ''
        },
        research_results: {
          value: (old: string | undefined, new: string) => new,
          default: undefined
        },
        analysis_results: {
          value: (old: string | undefined, new: string) => new,
          default: undefined
        },
        final_output: {
          value: (old: string | undefined, new: string) => new,
          default: undefined
        },
        next_agent: {
          value: (old: string | undefined, new: string) => new,
          default: undefined
        },
        iteration: {
          value: (old: number, new: number) => new,
          default: 0
        },
        max_iterations: {
          value: (old: number, new: number) => new,
          default: 3
        },
        should_continue: {
          value: (old: boolean, new: boolean) => new,
          default: true
        },
        workflow_id: {
          value: (old: string, new: string) => new,
          default: uuidv4()
        },
        started_at: {
          value: (old: Date, new: Date) => new,
          default: new Date()
        },
        completed_at: {
          value: (old: Date | undefined, new: Date) => new,
          default: undefined
        },
        errors: {
          value: (old: Error[], new: Error[]) => [...old, ...new],
          default: []
        },
        agent_timings: {
          value: (old: Record<string, number>, new: Record<string, number>) => ({...old, ...new}),
          default: {}
        },
        token_usage: {
          value: (old: Record<string, number>, new: Record<string, number>) => ({...old, ...new}),
          default: {}
        }
      }
    });
    
    // Add nodes
    this.addNodes();
    
    // Add edges
    this.addEdges();
    
    // Set entry point
    this.graph.setEntryPoint('supervisor');
  }
  
  // Add nodes to the graph
  private addNodes() {
    // Supervisor node - orchestrates the workflow
    this.graph.addNode('supervisor', async (state: WorkflowState) => {
      console.log('🎯 Supervisor analyzing task...');
      
      const decision = await this.supervisorDecision(state);
      
      return {
        next_agent: decision.nextAgent,
        should_continue: decision.shouldContinue,
        current_task: decision.task || state.current_task
      };
    });
    
    // Research node
    this.graph.addNode('research', async (state: WorkflowState) => {
      console.log('🔍 Research agent working...');
      const startTime = Date.now();
      
      try {
        const result = await this.agents.get('research')?.execute(state.current_task);
        
        return {
          research_results: result,
          agent_timings: { research: Date.now() - startTime },
          messages: [new AIMessage(`Research completed: ${result.substring(0, 100)}...`)]
        };
      } catch (error) {
        return {
          errors: [error as Error],
          should_continue: false
        };
      }
    });
    
    // Analysis node
    this.graph.addNode('analysis', async (state: WorkflowState) => {
      console.log('📊 Analysis agent working...');
      const startTime = Date.now();
      
      const context = state.research_results || 'No research available';
      const prompt = `Analyze this information: ${context}\n\nTask: ${state.current_task}`;
      
      try {
        const result = await this.agents.get('analysis')?.execute(prompt);
        
        return {
          analysis_results: result,
          agent_timings: { analysis: Date.now() - startTime },
          messages: [new AIMessage(`Analysis completed: ${result.substring(0, 100)}...`)]
        };
      } catch (error) {
        return {
          errors: [error as Error],
          should_continue: false
        };
      }
    });
    
    // Synthesis node
    this.graph.addNode('synthesis', async (state: WorkflowState) => {
      console.log('✍️ Synthesis agent working...');
      const startTime = Date.now();
      
      const research = state.research_results || '';
      const analysis = state.analysis_results || '';
      
      const prompt = `Synthesize a final response:
Research: ${research}
Analysis: ${analysis}
Original Task: ${state.current_task}`;
      
      try {
        const result = await this.agents.get('synthesis')?.execute(prompt);
        
        return {
          final_output: result,
          agent_timings: { synthesis: Date.now() - startTime },
          messages: [new AIMessage(`Synthesis completed`)],
          completed_at: new Date()
        };
      } catch (error) {
        return {
          errors: [error as Error],
          should_continue: false
        };
      }
    });
    
    // Quality check node
    this.graph.addNode('quality_check', async (state: WorkflowState) => {
      console.log('✅ Quality check in progress...');
      const startTime = Date.now();
      
      const output = state.final_output || state.analysis_results || state.research_results || '';
      
      const qualityScore = await this.assessQuality(output);
      
      if (qualityScore < 0.7 && state.iteration < state.max_iterations) {
        return {
          iteration: state.iteration + 1,
          next_agent: 'research', // Start over with improvements
          messages: [new AIMessage(`Quality score: ${qualityScore}. Iterating...`)],
          agent_timings: { quality_check: Date.now() - startTime }
        };
      }
      
      return {
        messages: [new AIMessage(`Quality approved: ${qualityScore}`)],
        agent_timings: { quality_check: Date.now() - startTime },
        should_continue: false
      };
    });
    
    // Error handler node
    this.graph.addNode('error_handler', async (state: WorkflowState) => {
      console.error('❌ Error handler activated');
      
      const lastError = state.errors[state.errors.length - 1];
      
      // Attempt recovery
      if (state.iteration < state.max_iterations) {
        return {
          iteration: state.iteration + 1,
          next_agent: 'supervisor',
          messages: [new AIMessage(`Recovering from error: ${lastError?.message}`)]
        };
      }
      
      return {
        should_continue: false,
        final_output: `Workflow failed: ${lastError?.message}`,
        completed_at: new Date()
      };
    });
  }
  
  // Add edges to connect nodes
  private addEdges() {
    // Supervisor routing
    this.graph.addConditionalEdges(
      'supervisor',
      (state: WorkflowState) => {
        if (!state.should_continue) return 'END';
        if (state.errors.length > 0) return 'error_handler';
        return state.next_agent || 'research';
      },
      {
        'research': 'research',
        'analysis': 'analysis',
        'synthesis': 'synthesis',
        'quality_check': 'quality_check',
        'error_handler': 'error_handler',
        'END': END
      }
    );
    
    // Research → Analysis
    this.graph.addEdge('research', 'analysis');
    
    // Analysis → Synthesis or Quality Check
    this.graph.addConditionalEdges(
      'analysis',
      (state: WorkflowState) => {
        if (state.research_results && state.analysis_results) {
          return 'synthesis';
        }
        return 'quality_check';
      },
      {
        'synthesis': 'synthesis',
        'quality_check': 'quality_check'
      }
    );
    
    // Synthesis → Quality Check
    this.graph.addEdge('synthesis', 'quality_check');
    
    // Quality Check routing
    this.graph.addConditionalEdges(
      'quality_check',
      (state: WorkflowState) => {
        if (state.should_continue && state.iteration < state.max_iterations) {
          return 'supervisor';
        }
        return 'END';
      },
      {
        'supervisor': 'supervisor',
        'END': END
      }
    );
    
    // Error handler routing
    this.graph.addConditionalEdges(
      'error_handler',
      (state: WorkflowState) => {
        if (state.iteration < state.max_iterations) {
          return 'supervisor';
        }
        return 'END';
      },
      {
        'supervisor': 'supervisor',
        'END': END
      }
    );
  }
  
  // Supervisor decision logic
  private async supervisorDecision(state: WorkflowState): Promise<{
    nextAgent: string;
    shouldContinue: boolean;
    task?: string;
  }> {
    // Analyze current state and decide next action
    if (!state.research_results) {
      return { nextAgent: 'research', shouldContinue: true };
    }
    
    if (!state.analysis_results) {
      return { nextAgent: 'analysis', shouldContinue: true };
    }
    
    if (!state.final_output) {
      return { nextAgent: 'synthesis', shouldContinue: true };
    }
    
    return { nextAgent: 'quality_check', shouldContinue: true };
  }
  
  // Quality assessment
  private async assessQuality(output: string): Promise<number> {
    // Simple quality scoring - in production, use more sophisticated methods
    const criteria = {
      length: output.length > 100 ? 1 : 0,
      structure: output.includes('\n') ? 1 : 0,
      completeness: output.includes('conclusion') || output.includes('summary') ? 1 : 0
    };
    
    const score = Object.values(criteria).reduce((a, b) => a + b, 0) / Object.keys(criteria).length;
    return score;
  }
  
  // Register agents
  private registerAgents() {
    // Mock agents - replace with real implementations
    this.agents.set('research', {
      execute: async (task: string) => `Research findings for: ${task}`
    });
    
    this.agents.set('analysis', {
      execute: async (task: string) => `Analysis results for: ${task}`
    });
    
    this.agents.set('synthesis', {
      execute: async (task: string) => `Synthesized output for: ${task}`
    });
  }
  
  // Execute workflow
  async execute(task: string): Promise<WorkflowState> {
    console.log(`\n🚀 Starting workflow for: "${task}"\n`);
    
    const initialState: WorkflowState = {
      messages: [new HumanMessage(task)],
      current_task: task,
      iteration: 0,
      max_iterations: 3,
      should_continue: true,
      workflow_id: uuidv4(),
      started_at: new Date(),
      errors: [],
      agent_timings: {},
      token_usage: {}
    };
    
    const app = this.graph.compile();
    const result = await app.invoke(initialState);
    
    console.log('\n✅ Workflow completed\n');
    return result as WorkflowState;
  }
  
  // Visualize workflow
  getWorkflowDiagram(): string {
    return `
    ┌─────────────┐
    │  Supervisor │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Research  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Analysis  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Synthesis  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │Quality Check│
    └─────────────┘
    `;
  }
}
```

### 1.2 Advanced State Management

```typescript
// src/orchestration/state-management.ts
import { BaseChannel } from '@langchain/langgraph';

// Custom state channel implementations
export class StateManager {
  // Immutable state channel
  static createImmutableChannel<T>(defaultValue: T): BaseChannel<T> {
    return {
      value: (old: T, new: T) => new,
      default: defaultValue,
      
      // Custom methods for immutability
      update: (state: T, updates: Partial<T>): T => {
        return { ...state, ...updates };
      },
      
      // Deep freeze for true immutability
      freeze: (state: T): T => {
        return Object.freeze(structuredClone(state));
      }
    };
  }
  
  // Accumulator channel (collects values)
  static createAccumulatorChannel<T>(defaultValue: T[] = []): BaseChannel<T[]> {
    return {
      value: (old: T[], new: T | T[]) => {
        const newItems = Array.isArray(new) ? new : [new];
        return [...old, ...newItems];
      },
      default: defaultValue,
      
      // Custom methods
      getLatest: (state: T[], n: number = 1): T[] => {
        return state.slice(-n);
      },
      
      getUnique: (state: T[]): T[] => {
        return [...new Set(state)];
      }
    };
  }
  
  // Windowed channel (maintains sliding window)
  static createWindowChannel<T>(windowSize: number): BaseChannel<T[]> {
    return {
      value: (old: T[], new: T | T[]) => {
        const newItems = Array.isArray(new) ? new : [new];
        const combined = [...old, ...newItems];
        return combined.slice(-windowSize);
      },
      default: [],
      
      // Custom methods
      isFull: (state: T[]): boolean => {
        return state.length >= windowSize;
      },
      
      getOldest: (state: T[]): T | undefined => {
        return state[0];
      }
    };
  }
  
  // Versioned channel (maintains history)
  static createVersionedChannel<T>(maxVersions: number = 10): BaseChannel<{
    current: T;
    history: Array<{ value: T; timestamp: Date; version: number }>;
  }> {
    return {
      value: (old, new: T) => {
        const newVersion = {
          value: new,
          timestamp: new Date(),
          version: old.history.length + 1
        };
        
        const history = [...old.history, newVersion].slice(-maxVersions);
        
        return {
          current: new,
          history
        };
      },
      default: {
        current: {} as T,
        history: []
      },
      
      // Custom methods
      rollback: (state, version: number) => {
        const historicalVersion = state.history.find(h => h.version === version);
        if (historicalVersion) {
          return {
            ...state,
            current: historicalVersion.value
          };
        }
        return state;
      },
      
      getDiff: (state, fromVersion: number, toVersion: number) => {
        // Implementation for diff calculation
        return null;
      }
    };
  }
  
  // Computed channel (derives value from other channels)
  static createComputedChannel<T, R>(
    dependencies: string[],
    compute: (deps: Record<string, any>) => R
  ): BaseChannel<R> {
    return {
      value: (old, new, fullState) => {
        const deps: Record<string, any> = {};
        dependencies.forEach(dep => {
          deps[dep] = fullState[dep];
        });
        return compute(deps);
      },
      default: compute({}) as R
    };
  }
}

// State persistence
export class StatePersistence {
  private storage: Map<string, any> = new Map();
  
  // Save state snapshot
  async saveSnapshot(workflowId: string, state: any): Promise<void> {
    const snapshot = {
      id: workflowId,
      state: structuredClone(state),
      timestamp: new Date(),
      checksum: this.calculateChecksum(state)
    };
    
    this.storage.set(workflowId, snapshot);
    
    // In production, persist to database
    await this.persistToDatabase(snapshot);
  }
  
  // Load state snapshot
  async loadSnapshot(workflowId: string): Promise<any> {
    const snapshot = this.storage.get(workflowId);
    
    if (!snapshot) {
      // Try loading from database
      return this.loadFromDatabase(workflowId);
    }
    
    // Verify checksum
    if (this.calculateChecksum(snapshot.state) !== snapshot.checksum) {
      throw new Error('State corruption detected');
    }
    
    return snapshot.state;
  }
  
  // Calculate checksum for integrity
  private calculateChecksum(state: any): string {
    const json = JSON.stringify(state);
    // Simple checksum - in production, use crypto.createHash
    return json.length.toString();
  }
  
  private async persistToDatabase(snapshot: any): Promise<void> {
    // Database persistence implementation
  }
  
  private async loadFromDatabase(workflowId: string): Promise<any> {
    // Database loading implementation
    return null;
  }
}

// State validation
export class StateValidator {
  // Validate state against schema
  static validateState<T>(state: T, schema: StateSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check required fields
    schema.required?.forEach(field => {
      if (!(field in state)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`
        });
      }
    });
    
    // Check field types
    Object.entries(schema.fields || {}).forEach(([field, type]) => {
      if (field in state) {
        const actualType = typeof (state as any)[field];
        if (actualType !== type) {
          errors.push({
            field,
            message: `Field '${field}' should be ${type} but is ${actualType}`
          });
        }
      }
    });
    
    // Check constraints
    schema.constraints?.forEach(constraint => {
      if (!constraint.validate(state)) {
        errors.push({
          field: constraint.field,
          message: constraint.message
        });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Create state migration
  static migrateState<T, R>(
    oldState: T,
    migration: StateMigration<T, R>
  ): R {
    // Apply transformation
    let newState = migration.transform(oldState);
    
    // Apply defaults for new fields
    if (migration.defaults) {
      newState = { ...migration.defaults, ...newState };
    }
    
    // Remove deprecated fields
    if (migration.deprecated) {
      migration.deprecated.forEach(field => {
        delete (newState as any)[field];
      });
    }
    
    return newState;
  }
}

// Type definitions
interface StateSchema {
  required?: string[];
  fields?: Record<string, string>;
  constraints?: Array<{
    field: string;
    validate: (state: any) => boolean;
    message: string;
  }>;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}

interface StateMigration<T, R> {
  version: string;
  transform: (old: T) => R;
  defaults?: Partial<R>;
  deprecated?: string[];
}
```

---

## 🔄 Part 2: Workflow Patterns

### 2.1 Common Orchestration Patterns

```typescript
// src/orchestration/workflow-patterns.ts
import { StateGraph, END } from '@langchain/langgraph';

export class WorkflowPatterns {
  // Pattern 1: Sequential Pipeline
  static createSequentialPipeline(agents: string[]): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        results: { value: (old, new) => [...old, new], default: [] },
        current_step: { value: (old, new) => new, default: 0 }
      }
    });
    
    // Add nodes for each agent
    agents.forEach((agent, index) => {
      graph.addNode(agent, async (state) => {
        console.log(`Executing ${agent}...`);
        const result = await this.executeAgent(agent, state);
        
        return {
          results: [result],
          current_step: index + 1
        };
      });
    });
    
    // Connect nodes sequentially
    for (let i = 0; i < agents.length - 1; i++) {
      graph.addEdge(agents[i], agents[i + 1]);
    }
    
    // Set entry and exit
    graph.setEntryPoint(agents[0]);
    graph.addEdge(agents[agents.length - 1], END);
    
    return graph;
  }
  
  // Pattern 2: Parallel Execution
  static createParallelExecution(agents: string[]): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        results: { value: (old, new) => ({...old, ...new}), default: {} },
        completed: { value: (old, new) => [...old, ...new], default: [] }
      }
    });
    
    // Dispatcher node
    graph.addNode('dispatcher', async (state) => {
      console.log('Dispatching parallel tasks...');
      return { dispatched: true };
    });
    
    // Add parallel agent nodes
    agents.forEach(agent => {
      graph.addNode(agent, async (state) => {
        console.log(`Parallel execution: ${agent}`);
        const result = await this.executeAgent(agent, state);
        
        return {
          results: { [agent]: result },
          completed: [agent]
        };
      });
    });
    
    // Aggregator node
    graph.addNode('aggregator', async (state) => {
      const allCompleted = agents.every(agent => 
        state.completed.includes(agent)
      );
      
      if (allCompleted) {
        console.log('All parallel tasks completed');
        return { final_result: state.results };
      }
      
      return { waiting: true };
    });
    
    // Connect dispatcher to all agents
    graph.setEntryPoint('dispatcher');
    agents.forEach(agent => {
      graph.addEdge('dispatcher', agent);
    });
    
    // Connect all agents to aggregator
    agents.forEach(agent => {
      graph.addEdge(agent, 'aggregator');
    });
    
    graph.addEdge('aggregator', END);
    
    return graph;
  }
  
  // Pattern 3: Conditional Branching
  static createConditionalBranching(): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        condition: { value: (old, new) => new, default: '' },
        result: { value: (old, new) => new, default: '' }
      }
    });
    
    // Evaluator node
    graph.addNode('evaluator', async (state) => {
      const condition = await this.evaluateCondition(state);
      return { condition };
    });
    
    // Branch nodes
    graph.addNode('branch_a', async (state) => {
      return { result: 'Executed Branch A' };
    });
    
    graph.addNode('branch_b', async (state) => {
      return { result: 'Executed Branch B' };
    });
    
    graph.addNode('branch_c', async (state) => {
      return { result: 'Executed Branch C' };
    });
    
    // Conditional routing
    graph.setEntryPoint('evaluator');
    graph.addConditionalEdges(
      'evaluator',
      (state) => {
        switch (state.condition) {
          case 'A': return 'branch_a';
          case 'B': return 'branch_b';
          case 'C': return 'branch_c';
          default: return 'branch_a';
        }
      },
      {
        'branch_a': 'branch_a',
        'branch_b': 'branch_b',
        'branch_c': 'branch_c'
      }
    );
    
    // Connect branches to end
    ['branch_a', 'branch_b', 'branch_c'].forEach(branch => {
      graph.addEdge(branch, END);
    });
    
    return graph;
  }
  
  // Pattern 4: Loop with Exit Condition
  static createLoopPattern(maxIterations: number = 5): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        iteration: { value: (old, new) => new, default: 0 },
        results: { value: (old, new) => [...old, new], default: [] },
        converged: { value: (old, new) => new, default: false }
      }
    });
    
    // Process node
    graph.addNode('process', async (state) => {
      const result = await this.processIteration(state);
      const converged = await this.checkConvergence(result, state.results);
      
      return {
        results: [result],
        iteration: state.iteration + 1,
        converged
      };
    });
    
    // Check node
    graph.addNode('check', async (state) => {
      if (state.converged || state.iteration >= maxIterations) {
        return { should_exit: true };
      }
      return { should_exit: false };
    });
    
    // Setup flow
    graph.setEntryPoint('process');
    graph.addEdge('process', 'check');
    
    graph.addConditionalEdges(
      'check',
      (state) => state.should_exit ? 'END' : 'process',
      {
        'process': 'process',
        'END': END
      }
    );
    
    return graph;
  }
  
  // Pattern 5: Map-Reduce
  static createMapReduce(mappers: number = 3): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        input_chunks: { value: (old, new) => new, default: [] },
        mapped_results: { value: (old, new) => [...old, ...new], default: [] },
        reduced_result: { value: (old, new) => new, default: null }
      }
    });
    
    // Splitter node
    graph.addNode('splitter', async (state) => {
      const chunks = await this.splitInput(state.input);
      return { input_chunks: chunks };
    });
    
    // Mapper nodes
    for (let i = 0; i < mappers; i++) {
      graph.addNode(`mapper_${i}`, async (state) => {
        const chunk = state.input_chunks[i];
        if (chunk) {
          const result = await this.mapFunction(chunk);
          return { mapped_results: [result] };
        }
        return {};
      });
    }
    
    // Reducer node
    graph.addNode('reducer', async (state) => {
      const reduced = await this.reduceFunction(state.mapped_results);
      return { reduced_result: reduced };
    });
    
    // Connect nodes
    graph.setEntryPoint('splitter');
    
    for (let i = 0; i < mappers; i++) {
      graph.addEdge('splitter', `mapper_${i}`);
      graph.addEdge(`mapper_${i}`, 'reducer');
    }
    
    graph.addEdge('reducer', END);
    
    return graph;
  }
  
  // Pattern 6: Saga Pattern (distributed transactions)
  static createSagaPattern(steps: SagaStep[]): StateGraph<any> {
    const graph = new StateGraph({
      channels: {
        completed_steps: { value: (old, new) => [...old, new], default: [] },
        failed_step: { value: (old, new) => new, default: null },
        compensating: { value: (old, new) => new, default: false }
      }
    });
    
    // Add forward steps
    steps.forEach((step, index) => {
      graph.addNode(step.name, async (state) => {
        try {
          const result = await step.execute(state);
          return {
            completed_steps: [step.name],
            [`${step.name}_result`]: result
          };
        } catch (error) {
          return {
            failed_step: step.name,
            compensating: true
          };
        }
      });
      
      // Add compensating step
      graph.addNode(`compensate_${step.name}`, async (state) => {
        await step.compensate(state);
        return {
          completed_steps: state.completed_steps.filter(s => s !== step.name)
        };
      });
    });
    
    // Connect forward path
    for (let i = 0; i < steps.length - 1; i++) {
      graph.addConditionalEdges(
        steps[i].name,
        (state) => state.compensating ? `compensate_${steps[i].name}` : steps[i + 1].name,
        {
          [steps[i + 1].name]: steps[i + 1].name,
          [`compensate_${steps[i].name}`]: `compensate_${steps[i].name}`
        }
      );
    }
    
    // Connect compensating path
    for (let i = steps.length - 1; i > 0; i--) {
      graph.addEdge(`compensate_${steps[i].name}`, `compensate_${steps[i - 1].name}`);
    }
    
    graph.setEntryPoint(steps[0].name);
    graph.addEdge(steps[steps.length - 1].name, END);
    graph.addEdge(`compensate_${steps[0].name}`, END);
    
    return graph;
  }
  
  // Helper methods
  private static async executeAgent(agent: string, state: any): Promise<any> {
    // Mock agent execution
    return `Result from ${agent}`;
  }
  
  private static async evaluateCondition(state: any): Promise<string> {
    // Mock condition evaluation
    return ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
  }
  
  private static async processIteration(state: any): Promise<any> {
    // Mock iteration processing
    return Math.random();
  }
  
  private static async checkConvergence(current: any, history: any[]): Promise<boolean> {
    // Mock convergence check
    return Math.random() > 0.8;
  }
  
  private static async splitInput(input: any): Promise<any[]> {
    // Mock input splitting
    return [1, 2, 3];
  }
  
  private static async mapFunction(chunk: any): Promise<any> {
    // Mock map function
    return chunk * 2;
  }
  
  private static async reduceFunction(results: any[]): Promise<any> {
    // Mock reduce function
    return results.reduce((a, b) => a + b, 0);
  }
}

interface SagaStep {
  name: string;
  execute: (state: any) => Promise<any>;
  compensate: (state: any) => Promise<void>;
}
```

### 2.2 Custom Workflow Builder

```typescript
// src/orchestration/workflow-builder.ts

export class WorkflowBuilder {
  private nodes: Map<string, WorkflowNode> = new Map();
  private edges: Array<WorkflowEdge> = [];
  private entryPoint?: string;
  private state?: StateDefinition;
  
  // Define state schema
  withState(state: StateDefinition): this {
    this.state = state;
    return this;
  }
  
  // Add a node
  addNode(config: NodeConfig): this {
    const node: WorkflowNode = {
      id: config.id,
      type: config.type || 'process',
      handler: config.handler,
      timeout: config.timeout,
      retries: config.retries || 0,
      metadata: config.metadata || {}
    };
    
    this.nodes.set(config.id, node);
    return this;
  }
  
  // Add an edge
  addEdge(from: string, to: string, condition?: EdgeCondition): this {
    this.edges.push({
      from,
      to,
      condition,
      type: condition ? 'conditional' : 'direct'
    });
    return this;
  }
  
  // Add parallel branches
  addParallel(from: string, branches: string[]): this {
    branches.forEach(branch => {
      this.addEdge(from, branch);
    });
    return this;
  }
  
  // Add a decision point
  addDecision(config: DecisionConfig): this {
    this.addNode({
      id: config.id,
      type: 'decision',
      handler: async (state) => {
        const decision = await config.decider(state);
        return { next: decision };
      }
    });
    
    Object.entries(config.branches).forEach(([condition, target]) => {
      this.addEdge(config.id, target, (state) => state.next === condition);
    });
    
    return this;
  }
  
  // Add a loop
  addLoop(config: LoopConfig): this {
    const loopId = config.id;
    const checkId = `${loopId}_check`;
    
    // Add loop body
    this.addNode({
      id: loopId,
      handler: config.body
    });
    
    // Add loop check
    this.addNode({
      id: checkId,
      type: 'decision',
      handler: async (state) => {
        const shouldContinue = await config.condition(state);
        return { 
          continue: shouldContinue,
          iterations: (state.iterations || 0) + 1
        };
      }
    });
    
    // Connect loop
    this.addEdge(loopId, checkId);
    this.addEdge(checkId, loopId, (state) => state.continue);
    this.addEdge(checkId, config.exit, (state) => !state.continue);
    
    return this;
  }
  
  // Set entry point
  setEntry(nodeId: string): this {
    this.entryPoint = nodeId;
    return this;
  }
  
  // Build and compile the workflow
  build(): CompiledWorkflow {
    if (!this.entryPoint) {
      throw new Error('Entry point not set');
    }
    
    // Create state graph
    const graph = new StateGraph(this.state || {});
    
    // Add all nodes
    this.nodes.forEach((node, id) => {
      graph.addNode(id, this.wrapHandler(node));
    });
    
    // Add all edges
    this.edges.forEach(edge => {
      if (edge.type === 'conditional' && edge.condition) {
        graph.addConditionalEdges(
          edge.from,
          edge.condition,
          { [edge.to]: edge.to }
        );
      } else {
        graph.addEdge(edge.from, edge.to);
      }
    });
    
    // Set entry point
    graph.setEntryPoint(this.entryPoint);
    
    return {
      graph: graph.compile(),
      metadata: {
        nodes: Array.from(this.nodes.keys()),
        edges: this.edges,
        entryPoint: this.entryPoint
      }
    };
  }
  
  // Wrap handler with error handling and retries
  private wrapHandler(node: WorkflowNode) {
    return async (state: any) => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= node.retries; attempt++) {
        try {
          // Add timeout if specified
          if (node.timeout) {
            return await this.withTimeout(
              node.handler(state),
              node.timeout
            );
          }
          
          return await node.handler(state);
        } catch (error) {
          lastError = error as Error;
          console.error(`Node ${node.id} attempt ${attempt + 1} failed:`, error);
          
          if (attempt < node.retries) {
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }
      
      throw lastError;
    };
  }
  
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }
  
  // Validate workflow
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Check entry point exists
    if (!this.entryPoint || !this.nodes.has(this.entryPoint)) {
      errors.push('Invalid or missing entry point');
    }
    
    // Check all edges reference valid nodes
    this.edges.forEach(edge => {
      if (!this.nodes.has(edge.from)) {
        errors.push(`Edge references non-existent node: ${edge.from}`);
      }
      if (!this.nodes.has(edge.to)) {
        errors.push(`Edge references non-existent node: ${edge.to}`);
      }
    });
    
    // Check for unreachable nodes
    const reachable = this.findReachableNodes();
    this.nodes.forEach((_, id) => {
      if (!reachable.has(id)) {
        errors.push(`Node ${id} is unreachable`);
      }
    });
    
    // Check for cycles (optional)
    if (this.hasCycles()) {
      errors.push('Workflow contains cycles');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private findReachableNodes(): Set<string> {
    const reachable = new Set<string>();
    const queue = [this.entryPoint!];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      
      reachable.add(current);
      
      const outgoing = this.edges
        .filter(e => e.from === current)
        .map(e => e.to);
      
      queue.push(...outgoing);
    }
    
    return reachable;
  }
  
  private hasCycles(): boolean {
    // Simple cycle detection using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycleDFS = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = this.edges
        .filter(e => e.from === node)
        .map(e => e.to);
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    return this.entryPoint ? hasCycleDFS(this.entryPoint) : false;
  }
}

// Type definitions
interface StateDefinition {
  channels?: Record<string, any>;
}

interface NodeConfig {
  id: string;
  type?: 'process' | 'decision' | 'parallel' | 'aggregator';
  handler: (state: any) => Promise<any>;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

interface WorkflowNode extends NodeConfig {
  retries: number;
  metadata: Record<string, any>;
}

interface WorkflowEdge {
  from: string;
  to: string;
  type: 'direct' | 'conditional';
  condition?: EdgeCondition;
}

type EdgeCondition = (state: any) => boolean;

interface DecisionConfig {
  id: string;
  decider: (state: any) => Promise<string>;
  branches: Record<string, string>;
}

interface LoopConfig {
  id: string;
  body: (state: any) => Promise<any>;
  condition: (state: any) => Promise<boolean>;
  exit: string;
}

interface CompiledWorkflow {
  graph: any;
  metadata: {
    nodes: string[];
    edges: WorkflowEdge[];
    entryPoint: string;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: Graph Design

```typescript
// exercises/01-graph-design.ts

/**
 * Exercise 1.1: Multi-Stage Pipeline
 * Build a workflow that:
 * - Has 5 sequential stages
 * - Each stage can fail and retry
 * - Failed stages trigger compensation
 * - Includes progress tracking
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: Dynamic Workflow
 * Create a workflow that:
 * - Adapts based on input type
 * - Adds/removes nodes dynamically
 * - Handles unknown inputs gracefully
 * - Optimizes path selection
 */
export async function exercise1_2() {
  // Your implementation here
}

/**
 * Exercise 1.3: Hierarchical Workflows
 * Implement nested workflows:
 * - Parent workflow orchestrates children
 * - Child workflows can be reused
 * - State is properly scoped
 * - Error propagation works correctly
 */
export async function exercise1_3() {
  // Your implementation here
}
```

### Exercise Set 2: State Management

```typescript
// exercises/02-state-management.ts

/**
 * Exercise 2.1: Complex State Synchronization
 * Build a system that:
 * - Manages state across 10+ agents
 * - Handles concurrent updates
 * - Resolves conflicts
 * - Maintains consistency
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: State Persistence
 * Implement persistent workflows:
 * - Save state at checkpoints
 * - Resume from failures
 * - Handle schema migrations
 * - Compress large states
 */
export async function exercise2_2() {
  // Your implementation here
}

/**
 * Exercise 2.3: Distributed State
 * Create a distributed state system:
 * - State shared across processes
 * - Eventual consistency
 * - Partition tolerance
 * - Conflict resolution
 */
export async function exercise2_3() {
  // Your implementation here
}
```

### Exercise Set 3: Advanced Patterns

```typescript
// exercises/03-advanced-patterns.ts

/**
 * Exercise 3.1: Event Sourcing Workflow
 * Implement event sourcing:
 * - All state changes as events
 * - Event replay capability
 * - Temporal queries
 * - Audit trail
 */
export async function exercise3_1() {
  // Your implementation here
}

/**
 * Exercise 3.2: Streaming Workflow
 * Build a streaming pipeline:
 * - Process data streams
 * - Backpressure handling
 * - Window operations
 * - Real-time aggregation
 */
export async function exercise3_2() {
  // Your implementation here
}

/**
 * Exercise 3.3: Adaptive Workflow
 * Create self-optimizing workflow:
 * - Monitors performance
 * - Adjusts routing dynamically
 * - Learns from patterns
 * - Predicts optimal paths
 */
export async function exercise3_3() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Intelligent Workflow System

### Project: Multi-Agent Orchestration Platform

```typescript
// capstone/orchestration-platform.ts

interface OrchestrationPlatform {
  // Workflow Management
  workflows: {
    create(definition: WorkflowDefinition): Workflow;
    deploy(workflow: Workflow): Promise<void>;
    execute(workflowId: string, input: any): Promise<any>;
    monitor(workflowId: string): WorkflowStatus;
    pause(workflowId: string): Promise<void>;
    resume(workflowId: string): Promise<void>;
  };
  
  // Agent Registry
  agents: {
    register(agent: Agent): void;
    discover(capability: string): Agent[];
    health(agentId: string): HealthStatus;
    scale(agentId: string, instances: number): void;
  };
  
  // State Management
  state: {
    save(workflowId: string, state: any): Promise<void>;
    load(workflowId: string): Promise<any>;
    query(query: StateQuery): Promise<any>;
    subscribe(workflowId: string, callback: (state: any) => void): void;
  };
  
  // Monitoring
  monitoring: {
    metrics(workflowId: string): Metrics;
    traces(workflowId: string): Trace[];
    alerts(config: AlertConfig): void;
    dashboard(): Dashboard;
  };
  
  // Optimization
  optimizer: {
    analyze(workflowId: string): OptimizationReport;
    suggest(workflow: Workflow): Suggestion[];
    autoOptimize(workflowId: string): Promise<void>;
  };
}

// Requirements:
// 1. Support 100+ concurrent workflows
// 2. Sub-second state updates
// 3. Automatic failover and recovery
// 4. Visual workflow designer
// 5. Real-time monitoring
// 6. Cost optimization
```

---

## 📊 Assessment Rubric

```typescript
interface Phase4Assessment {
  // Graph Design (25%)
  graphDesign: {
    complexity: number;        // Can design complex graphs
    patterns: number;          // Knows various patterns
    optimization: number;      // Optimizes graph structure
    validation: number;        // Validates workflows
  };
  
  // State Management (25%)
  stateManagement: {
    channels: number;          // Uses appropriate channels
    persistence: number;       // Implements persistence
    consistency: number;       // Maintains consistency
    performance: number;       // Optimizes state ops
  };
  
  // Orchestration (25%)
  orchestration: {
    coordination: number;      // Coordinates agents well
    error_handling: number;    // Handles failures
    scalability: number;       // Designs for scale
    monitoring: number;        // Implements monitoring
  };
  
  // Integration (25%)
  integration: {
    apis: number;             // Integrates with APIs
    databases: number;        // Uses databases properly
    messaging: number;        // Implements messaging
    deployment: number;       // Deploys successfully
  };
}
```

---

## 💡 Pro Tips

### Orchestration Best Practices

1. **Start Simple**: Begin with sequential flows, add complexity gradually
2. **State First**: Design your state schema before building the graph
3. **Error Boundaries**: Always include error handling nodes
4. **Monitor Everything**: Add logging and metrics at every step
5. **Test Paths**: Test all possible execution paths
6. **Document Flows**: Visual diagrams help understanding

---

## 🎓 Final Thoughts

Orchestration is where individual agents become a symphony. Master this phase, and you'll be able to build complex, resilient systems that handle real-world challenges with grace.

**You're now the conductor. Lead your agents to create something magnificent! 🎼**