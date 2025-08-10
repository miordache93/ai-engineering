# 📊 Phase 7: Evaluation with LangSmith - Complete Mastery Guide
## Measuring and Improving AI Agent Performance

### 🌟 Phase Overview

Welcome to the science lab! This phase transforms you from a builder into a scientist who can measure, analyze, and systematically improve agent performance. You'll learn to create rigorous evaluation frameworks, run experiments, and make data-driven improvements to your agents.

**Duration**: 5-7 days (25-35 hours total)
**Difficulty**: Advanced
**Prerequisites**: Completed Phases 1-6, understanding of statistics and metrics

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **Evaluation Framework Mastery**
   - Design comprehensive evaluation suites
   - Implement automated testing
   - Create custom metrics
   - Build regression detection

2. **LangSmith Expertise**
   - Master tracing and debugging
   - Create datasets and experiments
   - Implement A/B testing
   - Build feedback loops

3. **Performance Analysis**
   - Measure latency and throughput
   - Analyze token usage
   - Track cost metrics
   - Optimize performance

4. **Quality Assurance**
   - Implement quality scoring
   - Build human-in-the-loop evaluation
   - Create benchmark suites
   - Design improvement workflows

---

## 📚 Conceptual Foundation

### The Scientific Method for Agents 🔬

Evaluating agents follows the scientific method:

```typescript
interface ScientificMethodForAgents {
  // 1. Observation
  observation: {
    what: 'Agent behaves unexpectedly',
    tools: ['LangSmith traces', 'User feedback', 'Error logs'],
    outcome: 'Identified patterns'
  };
  
  // 2. Hypothesis
  hypothesis: {
    what: 'Proposed explanation for behavior',
    example: 'Agent fails on long inputs due to context window',
    testable: true
  };
  
  // 3. Experiment
  experiment: {
    what: 'Controlled test of hypothesis',
    design: 'Create dataset with varying input lengths',
    controls: 'Keep other variables constant'
  };
  
  // 4. Analysis
  analysis: {
    what: 'Statistical analysis of results',
    metrics: ['Success rate', 'Performance', 'Quality'],
    tools: ['LangSmith', 'Statistical tests']
  };
  
  // 5. Conclusion
  conclusion: {
    what: 'Accept or reject hypothesis',
    action: 'Implement improvements',
    iterate: 'Form new hypotheses'
  };
}
```

### Evaluation Dimensions 📐

```typescript
interface EvaluationDimensions {
  // Correctness
  correctness: {
    factualAccuracy: 'Are the facts correct?',
    logicalConsistency: 'Is the reasoning sound?',
    taskCompletion: 'Was the task completed?'
  };
  
  // Quality
  quality: {
    relevance: 'Is the response relevant?',
    completeness: 'Is it comprehensive?',
    clarity: 'Is it understandable?',
    conciseness: 'Is it appropriately brief?'
  };
  
  // Safety
  safety: {
    harmlessness: 'Does it avoid harm?',
    bias: 'Is it unbiased?',
    privacy: 'Does it protect privacy?',
    security: 'Is it secure?'
  };
  
  // Performance
  performance: {
    latency: 'How fast is it?',
    throughput: 'How many requests/second?',
    cost: 'How expensive is it?',
    reliability: 'How often does it fail?'
  };
}
```

---

## 🏗️ Part 1: Comprehensive Evaluation Framework

### 1.1 Evaluation System Architecture

```typescript
// src/evaluation/evaluation-system.ts
import { Client as LangSmithClient } from 'langsmith';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

// Comprehensive Evaluation System
export class EvaluationSystem extends EventEmitter {
  private client: LangSmithClient;
  private evaluators: Map<string, Evaluator> = new Map();
  private datasets: Map<string, Dataset> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private config: EvaluationConfig;
  
  constructor(config: EvaluationConfig) {
    super();
    this.config = config;
    this.client = new LangSmithClient({
      apiKey: config.langsmithApiKey,
      apiUrl: config.langsmithUrl
    });
    
    this.registerDefaultEvaluators();
  }
  
  // Register evaluators
  private registerDefaultEvaluators(): void {
    // Correctness evaluator
    this.registerEvaluator('correctness', new CorrectnessEvaluator());
    
    // Quality evaluator
    this.registerEvaluator('quality', new QualityEvaluator());
    
    // Safety evaluator
    this.registerEvaluator('safety', new SafetyEvaluator());
    
    // Performance evaluator
    this.registerEvaluator('performance', new PerformanceEvaluator());
    
    // Custom LLM evaluator
    this.registerEvaluator('llm_judge', new LLMJudgeEvaluator());
  }
  
  // Register custom evaluator
  registerEvaluator(name: string, evaluator: Evaluator): void {
    this.evaluators.set(name, evaluator);
  }
  
  // Create evaluation dataset
  async createDataset(config: DatasetConfig): Promise<Dataset> {
    const dataset: Dataset = {
      id: uuidv4(),
      name: config.name,
      description: config.description,
      examples: [],
      metadata: config.metadata || {},
      createdAt: new Date()
    };
    
    // Add examples
    for (const example of config.examples) {
      dataset.examples.push({
        id: uuidv4(),
        input: example.input,
        expectedOutput: example.expectedOutput,
        metadata: example.metadata || {},
        tags: example.tags || []
      });
    }
    
    // Save to LangSmith
    if (this.config.syncToLangSmith) {
      await this.syncDatasetToLangSmith(dataset);
    }
    
    this.datasets.set(dataset.id, dataset);
    
    this.emit('dataset:created', dataset);
    
    return dataset;
  }
  
  // Run evaluation experiment
  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    console.log(`🧪 Starting experiment: ${config.name}`);
    
    const experiment: Experiment = {
      id: uuidv4(),
      name: config.name,
      description: config.description,
      datasetId: config.datasetId,
      agentId: config.agentId,
      evaluators: config.evaluators,
      runs: [],
      startedAt: new Date()
    };
    
    this.experiments.set(experiment.id, experiment);
    
    // Get dataset
    const dataset = this.datasets.get(config.datasetId);
    if (!dataset) {
      throw new Error(`Dataset ${config.datasetId} not found`);
    }
    
    // Run evaluation for each example
    const results: EvaluationRun[] = [];
    
    for (const example of dataset.examples) {
      const run = await this.evaluateExample(
        example,
        config.agent,
        config.evaluators
      );
      
      results.push(run);
      experiment.runs.push(run);
      
      // Emit progress
      this.emit('experiment:progress', {
        experiment: experiment.id,
        completed: results.length,
        total: dataset.examples.length
      });
    }
    
    // Calculate aggregate metrics
    const aggregateMetrics = this.calculateAggregateMetrics(results);
    
    // Complete experiment
    experiment.completedAt = new Date();
    
    const experimentResult: ExperimentResult = {
      experiment,
      results,
      aggregateMetrics,
      summary: this.generateSummary(results, aggregateMetrics)
    };
    
    // Save to LangSmith
    if (this.config.syncToLangSmith) {
      await this.syncExperimentToLangSmith(experimentResult);
    }
    
    this.emit('experiment:completed', experimentResult);
    
    return experimentResult;
  }
  
  // Evaluate single example
  private async evaluateExample(
    example: DatasetExample,
    agent: any,
    evaluatorNames: string[]
  ): Promise<EvaluationRun> {
    const run: EvaluationRun = {
      id: uuidv4(),
      exampleId: example.id,
      input: example.input,
      expectedOutput: example.expectedOutput,
      startedAt: new Date(),
      metrics: {},
      scores: {}
    };
    
    try {
      // Get agent output
      const startTime = Date.now();
      const actualOutput = await agent.execute(example.input);
      const latency = Date.now() - startTime;
      
      run.actualOutput = actualOutput;
      run.latency = latency;
      
      // Run evaluators
      for (const evaluatorName of evaluatorNames) {
        const evaluator = this.evaluators.get(evaluatorName);
        if (!evaluator) {
          console.warn(`Evaluator '${evaluatorName}' not found`);
          continue;
        }
        
        const evaluation = await evaluator.evaluate({
          input: example.input,
          expectedOutput: example.expectedOutput,
          actualOutput,
          metadata: example.metadata
        });
        
        run.scores[evaluatorName] = evaluation.score;
        run.metrics[evaluatorName] = evaluation.metrics;
        
        if (evaluation.feedback) {
          run.feedback = run.feedback || [];
          run.feedback.push(evaluation.feedback);
        }
      }
      
      run.success = true;
    } catch (error) {
      run.success = false;
      run.error = error as Error;
    }
    
    run.completedAt = new Date();
    
    return run;
  }
  
  // Calculate aggregate metrics
  private calculateAggregateMetrics(runs: EvaluationRun[]): AggregateMetrics {
    const metrics: AggregateMetrics = {
      totalRuns: runs.length,
      successfulRuns: runs.filter(r => r.success).length,
      failedRuns: runs.filter(r => !r.success).length,
      averageLatency: 0,
      averageScores: {},
      scoreDistribution: {},
      percentiles: {}
    };
    
    // Calculate average latency
    const latencies = runs
      .filter(r => r.latency !== undefined)
      .map(r => r.latency!);
    
    if (latencies.length > 0) {
      metrics.averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      metrics.percentiles.latency = this.calculatePercentiles(latencies);
    }
    
    // Calculate average scores by evaluator
    const scoresByEvaluator = new Map<string, number[]>();
    
    runs.forEach(run => {
      Object.entries(run.scores).forEach(([evaluator, score]) => {
        if (!scoresByEvaluator.has(evaluator)) {
          scoresByEvaluator.set(evaluator, []);
        }
        scoresByEvaluator.get(evaluator)!.push(score);
      });
    });
    
    scoresByEvaluator.forEach((scores, evaluator) => {
      metrics.averageScores[evaluator] = scores.reduce((a, b) => a + b, 0) / scores.length;
      metrics.scoreDistribution[evaluator] = this.calculateDistribution(scores);
      metrics.percentiles[evaluator] = this.calculatePercentiles(scores);
    });
    
    return metrics;
  }
  
  // A/B Testing
  async runABTest(config: ABTestConfig): Promise<ABTestResult> {
    console.log(`🔄 Starting A/B test: ${config.name}`);
    
    const dataset = this.datasets.get(config.datasetId);
    if (!dataset) {
      throw new Error(`Dataset ${config.datasetId} not found`);
    }
    
    // Run experiment for variant A
    const resultA = await this.runExperiment({
      name: `${config.name} - Variant A`,
      description: `A/B test variant A`,
      datasetId: config.datasetId,
      agent: config.variantA,
      agentId: 'variant_a',
      evaluators: config.evaluators
    });
    
    // Run experiment for variant B
    const resultB = await this.runExperiment({
      name: `${config.name} - Variant B`,
      description: `A/B test variant B`,
      datasetId: config.datasetId,
      agent: config.variantB,
      agentId: 'variant_b',
      evaluators: config.evaluators
    });
    
    // Statistical comparison
    const comparison = this.compareResults(resultA, resultB);
    
    const abTestResult: ABTestResult = {
      name: config.name,
      variantA: resultA,
      variantB: resultB,
      comparison,
      winner: comparison.winner,
      confidence: comparison.confidence
    };
    
    this.emit('abtest:completed', abTestResult);
    
    return abTestResult;
  }
  
  // Compare two experiment results
  private compareResults(
    resultA: ExperimentResult,
    resultB: ExperimentResult
  ): ComparisonResult {
    const comparison: ComparisonResult = {
      metrics: {},
      winner: null,
      confidence: 0
    };
    
    // Compare each metric
    Object.keys(resultA.aggregateMetrics.averageScores).forEach(evaluator => {
      const scoreA = resultA.aggregateMetrics.averageScores[evaluator];
      const scoreB = resultB.aggregateMetrics.averageScores[evaluator];
      
      const diff = scoreB - scoreA;
      const percentChange = (diff / scoreA) * 100;
      
      // Simple t-test (in production, use proper statistical library)
      const pValue = this.calculatePValue(
        resultA.results.map(r => r.scores[evaluator] || 0),
        resultB.results.map(r => r.scores[evaluator] || 0)
      );
      
      comparison.metrics[evaluator] = {
        scoreA,
        scoreB,
        difference: diff,
        percentChange,
        pValue,
        significant: pValue < 0.05
      };
    });
    
    // Determine winner
    const significantImprovements = Object.values(comparison.metrics)
      .filter(m => m.significant && m.difference > 0).length;
    
    const significantRegressions = Object.values(comparison.metrics)
      .filter(m => m.significant && m.difference < 0).length;
    
    if (significantImprovements > significantRegressions) {
      comparison.winner = 'B';
      comparison.confidence = significantImprovements / Object.keys(comparison.metrics).length;
    } else if (significantRegressions > significantImprovements) {
      comparison.winner = 'A';
      comparison.confidence = significantRegressions / Object.keys(comparison.metrics).length;
    } else {
      comparison.winner = null;
      comparison.confidence = 0;
    }
    
    return comparison;
  }
  
  // Regression detection
  async detectRegression(
    currentResult: ExperimentResult,
    baselineId: string
  ): Promise<RegressionReport> {
    const baseline = this.experiments.get(baselineId);
    if (!baseline) {
      throw new Error(`Baseline experiment ${baselineId} not found`);
    }
    
    const regressions: Regression[] = [];
    
    // Compare metrics
    Object.keys(currentResult.aggregateMetrics.averageScores).forEach(evaluator => {
      const currentScore = currentResult.aggregateMetrics.averageScores[evaluator];
      const baselineScore = this.getBaselineScore(baseline, evaluator);
      
      if (baselineScore && currentScore < baselineScore * (1 - this.config.regressionThreshold)) {
        regressions.push({
          metric: evaluator,
          baselineScore,
          currentScore,
          degradation: ((baselineScore - currentScore) / baselineScore) * 100,
          severity: this.calculateSeverity(baselineScore, currentScore)
        });
      }
    });
    
    // Check latency regression
    if (currentResult.aggregateMetrics.averageLatency > 
        this.getBaselineLatency(baseline) * (1 + this.config.latencyRegressionThreshold)) {
      regressions.push({
        metric: 'latency',
        baselineScore: this.getBaselineLatency(baseline),
        currentScore: currentResult.aggregateMetrics.averageLatency,
        degradation: ((currentResult.aggregateMetrics.averageLatency - this.getBaselineLatency(baseline)) / 
                     this.getBaselineLatency(baseline)) * 100,
        severity: 'medium'
      });
    }
    
    const report: RegressionReport = {
      hasRegression: regressions.length > 0,
      regressions,
      summary: this.generateRegressionSummary(regressions)
    };
    
    if (report.hasRegression) {
      this.emit('regression:detected', report);
    }
    
    return report;
  }
  
  // Helper methods
  private calculatePercentiles(values: number[]): Percentiles {
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      p50: this.getPercentile(sorted, 0.5),
      p75: this.getPercentile(sorted, 0.75),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99)
    };
  }
  
  private getPercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }
  
  private calculateDistribution(values: number[]): Distribution {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { min, max, mean, stdDev, variance };
  }
  
  private calculatePValue(samplesA: number[], samplesB: number[]): number {
    // Simplified t-test implementation
    // In production, use a proper statistics library
    const meanA = samplesA.reduce((a, b) => a + b, 0) / samplesA.length;
    const meanB = samplesB.reduce((a, b) => a + b, 0) / samplesB.length;
    
    const varA = samplesA.reduce((sum, val) => sum + Math.pow(val - meanA, 2), 0) / (samplesA.length - 1);
    const varB = samplesB.reduce((sum, val) => sum + Math.pow(val - meanB, 2), 0) / (samplesB.length - 1);
    
    const pooledSE = Math.sqrt(varA / samplesA.length + varB / samplesB.length);
    const tStat = Math.abs(meanA - meanB) / pooledSE;
    
    // Approximate p-value (simplified)
    return Math.exp(-0.717 * tStat - 0.416 * tStat * tStat);
  }
  
  private generateSummary(runs: EvaluationRun[], metrics: AggregateMetrics): string {
    const successRate = (metrics.successfulRuns / metrics.totalRuns) * 100;
    
    let summary = `Evaluation Summary:\n`;
    summary += `- Total runs: ${metrics.totalRuns}\n`;
    summary += `- Success rate: ${successRate.toFixed(1)}%\n`;
    summary += `- Average latency: ${metrics.averageLatency.toFixed(0)}ms\n`;
    
    Object.entries(metrics.averageScores).forEach(([evaluator, score]) => {
      summary += `- ${evaluator}: ${score.toFixed(3)}\n`;
    });
    
    return summary;
  }
  
  private calculateSeverity(baseline: number, current: number): 'low' | 'medium' | 'high' | 'critical' {
    const degradation = (baseline - current) / baseline;
    
    if (degradation > 0.5) return 'critical';
    if (degradation > 0.3) return 'high';
    if (degradation > 0.1) return 'medium';
    return 'low';
  }
  
  private generateRegressionSummary(regressions: Regression[]): string {
    if (regressions.length === 0) {
      return 'No regressions detected';
    }
    
    const critical = regressions.filter(r => r.severity === 'critical').length;
    const high = regressions.filter(r => r.severity === 'high').length;
    
    return `Detected ${regressions.length} regressions (${critical} critical, ${high} high)`;
  }
  
  private async syncDatasetToLangSmith(dataset: Dataset): Promise<void> {
    // Implementation for syncing to LangSmith
  }
  
  private async syncExperimentToLangSmith(result: ExperimentResult): Promise<void> {
    // Implementation for syncing to LangSmith
  }
  
  private getBaselineScore(baseline: Experiment, evaluator: string): number {
    // Implementation
    return 0.8;
  }
  
  private getBaselineLatency(baseline: Experiment): number {
    // Implementation
    return 100;
  }
}

// Base Evaluator class
export abstract class Evaluator {
  abstract evaluate(context: EvaluationContext): Promise<EvaluationScore>;
}

// Correctness Evaluator
export class CorrectnessEvaluator extends Evaluator {
  async evaluate(context: EvaluationContext): Promise<EvaluationScore> {
    // Compare actual output with expected output
    const score = this.calculateSimilarity(
      context.actualOutput,
      context.expectedOutput
    );
    
    return {
      score,
      metrics: {
        exactMatch: context.actualOutput === context.expectedOutput,
        similarity: score
      },
      feedback: score < 0.8 ? 'Output differs significantly from expected' : undefined
    };
  }
  
  private calculateSimilarity(actual: string, expected: string): number {
    // Simple similarity calculation
    const actualWords = actual.toLowerCase().split(/\s+/);
    const expectedWords = expected.toLowerCase().split(/\s+/);
    
    const intersection = actualWords.filter(word => expectedWords.includes(word));
    const union = new Set([...actualWords, ...expectedWords]);
    
    return intersection.length / union.size;
  }
}

// Quality Evaluator
export class QualityEvaluator extends Evaluator {
  async evaluate(context: EvaluationContext): Promise<EvaluationScore> {
    const metrics = {
      length: context.actualOutput.length,
      readability: this.calculateReadability(context.actualOutput),
      structure: this.evaluateStructure(context.actualOutput)
    };
    
    const score = (metrics.readability + metrics.structure) / 2;
    
    return {
      score,
      metrics,
      feedback: this.generateQualityFeedback(metrics)
    };
  }
  
  private calculateReadability(text: string): number {
    // Flesch reading ease approximation
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = words * 1.5; // Approximation
    
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    
    // Normalize to 0-1
    return Math.max(0, Math.min(1, score / 100));
  }
  
  private evaluateStructure(text: string): number {
    // Check for structure elements
    let score = 0.5;
    
    if (text.includes('\n')) score += 0.1; // Has paragraphs
    if (text.match(/^\d+\./m)) score += 0.1; // Has numbered lists
    if (text.match(/^-/m)) score += 0.1; // Has bullet points
    if (text.match(/^#{1,6}\s/m)) score += 0.1; // Has headings
    if (text.length > 100 && text.length < 1000) score += 0.1; // Good length
    
    return Math.min(1, score);
  }
  
  private generateQualityFeedback(metrics: any): string {
    const feedback: string[] = [];
    
    if (metrics.readability < 0.5) {
      feedback.push('Text is difficult to read');
    }
    
    if (metrics.structure < 0.5) {
      feedback.push('Text lacks structure');
    }
    
    if (metrics.length < 50) {
      feedback.push('Response is too short');
    }
    
    if (metrics.length > 2000) {
      feedback.push('Response is too long');
    }
    
    return feedback.join('; ');
  }
}

// LLM Judge Evaluator
export class LLMJudgeEvaluator extends Evaluator {
  private model: any; // LLM model
  
  async evaluate(context: EvaluationContext): Promise<EvaluationScore> {
    const prompt = `
      Evaluate the quality of this response on a scale of 0-1:
      
      Input: ${context.input}
      Expected Output: ${context.expectedOutput}
      Actual Output: ${context.actualOutput}
      
      Consider:
      1. Accuracy
      2. Completeness
      3. Relevance
      4. Clarity
      
      Respond with a JSON object: { "score": 0.0-1.0, "reasoning": "..." }
    `;
    
    // Use LLM to evaluate
    // const response = await this.model.invoke(prompt);
    // const evaluation = JSON.parse(response);
    
    // Mock response for example
    const evaluation = {
      score: 0.85,
      reasoning: 'Good accuracy and relevance, could be more complete'
    };
    
    return {
      score: evaluation.score,
      metrics: {
        llmScore: evaluation.score
      },
      feedback: evaluation.reasoning
    };
  }
}

// Type definitions
interface EvaluationConfig {
  langsmithApiKey: string;
  langsmithUrl: string;
  syncToLangSmith: boolean;
  regressionThreshold: number;
  latencyRegressionThreshold: number;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  examples: DatasetExample[];
  metadata: Record<string, any>;
  createdAt: Date;
}

interface DatasetExample {
  id: string;
  input: string;
  expectedOutput: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

interface DatasetConfig {
  name: string;
  description: string;
  examples: Array<{
    input: string;
    expectedOutput: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }>;
  metadata?: Record<string, any>;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  datasetId: string;
  agentId: string;
  evaluators: string[];
  runs: EvaluationRun[];
  startedAt: Date;
  completedAt?: Date;
}

interface ExperimentConfig {
  name: string;
  description: string;
  datasetId: string;
  agent: any;
  agentId: string;
  evaluators: string[];
}

interface EvaluationRun {
  id: string;
  exampleId: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  scores: Record<string, number>;
  metrics: Record<string, any>;
  feedback?: string[];
  success: boolean;
  error?: Error;
  latency?: number;
  startedAt: Date;
  completedAt?: Date;
}

interface ExperimentResult {
  experiment: Experiment;
  results: EvaluationRun[];
  aggregateMetrics: AggregateMetrics;
  summary: string;
}

interface AggregateMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageLatency: number;
  averageScores: Record<string, number>;
  scoreDistribution: Record<string, Distribution>;
  percentiles: Record<string, Percentiles>;
}

interface Distribution {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  variance: number;
}

interface Percentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

interface EvaluationContext {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  metadata?: Record<string, any>;
}

interface EvaluationScore {
  score: number;
  metrics: Record<string, any>;
  feedback?: string;
}

interface ABTestConfig {
  name: string;
  datasetId: string;
  variantA: any;
  variantB: any;
  evaluators: string[];
}

interface ABTestResult {
  name: string;
  variantA: ExperimentResult;
  variantB: ExperimentResult;
  comparison: ComparisonResult;
  winner: string | null;
  confidence: number;
}

interface ComparisonResult {
  metrics: Record<string, MetricComparison>;
  winner: string | null;
  confidence: number;
}

interface MetricComparison {
  scoreA: number;
  scoreB: number;
  difference: number;
  percentChange: number;
  pValue: number;
  significant: boolean;
}

interface Regression {
  metric: string;
  baselineScore: number;
  currentScore: number;
  degradation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RegressionReport {
  hasRegression: boolean;
  regressions: Regression[];
  summary: string;
}

// Safety Evaluator
export class SafetyEvaluator extends Evaluator {
  async evaluate(context: EvaluationContext): Promise<EvaluationScore> {
    // Implement safety checks
    return {
      score: 1.0,
      metrics: {},
      feedback: undefined
    };
  }
}

// Performance Evaluator
export class PerformanceEvaluator extends Evaluator {
  async evaluate(context: EvaluationContext): Promise<EvaluationScore> {
    // Implement performance metrics
    return {
      score: 1.0,
      metrics: {},
      feedback: undefined
    };
  }
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: Evaluation Design

```typescript
// exercises/01-evaluation-design.ts

/**
 * Exercise 1.1: Custom Evaluation Metrics
 * Create domain-specific evaluation metrics for:
 * - Medical advice accuracy
 * - Code generation quality
 * - Creative writing assessment
 * - Customer support effectiveness
 * Include weighted scoring and confidence intervals
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: Human-in-the-Loop Evaluation
 * Build a system that:
 * - Collects human feedback
 * - Incorporates ratings into evaluation
 * - Learns from disagreements
 * - Improves evaluation over time
 * - Handles inter-rater reliability
 */
export async function exercise1_2() {
  // Your implementation here
}
```

### Exercise Set 2: Performance Testing

```typescript
// exercises/02-performance-testing.ts

/**
 * Exercise 2.1: Load Testing Framework
 * Build a load testing system that:
 * - Simulates concurrent users
 * - Measures response times
 * - Identifies bottlenecks
 * - Tests scaling limits
 * - Generates performance reports
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: Cost Optimization
 * Create an optimization system that:
 * - Tracks token usage
 * - Calculates costs per request
 * - Identifies expensive operations
 * - Suggests optimizations
 * - Monitors cost trends
 */
export async function exercise2_2() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Evaluation Platform

```typescript
// capstone/evaluation-platform.ts

interface EvaluationPlatform {
  // Dataset Management
  datasets: {
    create(config: DatasetConfig): Dataset;
    import(source: DataSource): Dataset;
    version(dataset: Dataset): DatasetVersion;
    split(dataset: Dataset, ratios: number[]): Dataset[];
  };
  
  // Evaluation Suite
  evaluation: {
    runBenchmark(suite: BenchmarkSuite): BenchmarkResult;
    compareModels(models: Model[]): ComparisonMatrix;
    trackProgress(modelId: string): ProgressReport;
    detectRegressions(threshold: number): Regression[];
  };
  
  // Analysis Tools
  analysis: {
    errorAnalysis(runs: EvaluationRun[]): ErrorReport;
    biasDetection(results: Result[]): BiasReport;
    confidenceIntervals(metrics: Metrics): Intervals;
    statisticalTests(samples: Samples): TestResults;
  };
  
  // Reporting
  reporting: {
    generateReport(experiment: Experiment): Report;
    createDashboard(metrics: Metrics): Dashboard;
    exportResults(format: ExportFormat): File;
    scheduleReports(config: ScheduleConfig): void;
  };
}

// Requirements:
// 1. Support 1000+ test cases
// 2. Parallel evaluation execution
// 3. Statistical significance testing
// 4. Automated regression detection
// 5. Real-time monitoring
// 6. Custom metric support
```

---

## 💡 Pro Tips

### Evaluation Best Practices

1. **Start Simple**: Begin with basic metrics, add complexity gradually
2. **Use Multiple Metrics**: No single metric tells the whole story
3. **Benchmark Regularly**: Track performance over time
4. **Automate Everything**: Manual evaluation doesn't scale
5. **Trust but Verify**: LLM judges need human validation

---

## 🎓 Final Thoughts

Evaluation is the compass that guides improvement. Without measurement, you're flying blind. Master this phase, and you'll build agents that continuously get better.

**Measure twice, deploy once! 📊**