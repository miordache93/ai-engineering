# 🛡️ Phase 6: Guardrails and Reliability - Complete Mastery Guide
## Building Production-Grade, Bulletproof AI Agent Systems

### 🌟 Phase Overview

Welcome to the fortress-building phase! This is where your agents transform from experimental prototypes into production-ready systems that can handle anything the real world throws at them. You'll learn to build safety nets, implement failsafes, and ensure your agents behave reliably even in the most challenging scenarios.

**Duration**: 5-7 days (25-35 hours total)
**Difficulty**: Advanced
**Prerequisites**: Completed Phases 1-5, understanding of distributed systems and error handling

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **Error Handling Mastery**
   - Implement comprehensive error recovery
   - Build retry mechanisms with backoff
   - Design circuit breakers
   - Create fallback strategies

2. **Input/Output Validation**
   - Validate all inputs rigorously
   - Sanitize outputs for safety
   - Implement content filtering
   - Build moderation systems

3. **Rate Limiting & Resource Management**
   - Control API usage and costs
   - Implement token budgets
   - Build queue management
   - Design resource allocation

4. **Safety & Security**
   - Prevent prompt injection
   - Implement access controls
   - Build audit systems
   - Ensure data privacy

---

## 📚 Conceptual Foundation

### The Castle Defense Analogy 🏰

Building reliable agents is like defending a medieval castle:

```typescript
interface CastleDefenseSystem {
  // Outer Walls (Input Validation)
  outerDefenses: {
    moat: 'Rate limiting - slows down attackers',
    drawbridge: 'Authentication - controls who enters',
    guards: 'Input validation - checks everyone',
    gates: 'API gateways - controlled entry points'
  };
  
  // Inner Walls (Processing Safety)
  innerDefenses: {
    watchtowers: 'Monitoring - observes everything',
    archers: 'Error handlers - respond to threats',
    walls: 'Isolation - contains problems',
    passages: 'Circuit breakers - emergency shutoffs'
  };
  
  // Keep (Core Protection)
  keep: {
    treasury: 'Sensitive data - maximum protection',
    throne: 'Core logic - heavily guarded',
    escape: 'Fallback systems - emergency exit',
    supplies: 'Resource reserves - backup plans'
  };
  
  // Intelligence (Monitoring)
  intelligence: {
    scouts: 'Logging - gathers information',
    spies: 'Metrics - tracks patterns',
    messengers: 'Alerts - rapid communication',
    advisors: 'Analytics - strategic insights'
  };
}
```

### The Swiss Cheese Model 🧀

Multiple layers of defense, each with holes, but together providing complete protection:

```typescript
interface SwissCheeseModel {
  layers: [
    'Input Validation',      // Catches malformed inputs
    'Rate Limiting',         // Prevents overload
    'Content Filtering',     // Blocks harmful content
    'Error Handling',        // Manages failures
    'Output Sanitization',   // Ensures safe responses
    'Monitoring',           // Detects issues
    'Human Review'          // Final safety net
  ];
  
  principle: 'No single layer is perfect, but combined they catch everything';
}
```

---

## 🏗️ Part 1: Comprehensive Error Handling

### 1.1 Error Management System

```typescript
// src/reliability/error-management.ts
import { EventEmitter } from 'events';
import pRetry from 'p-retry';
import CircuitBreaker from 'opossum';

// Custom error types
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity,
    public recoverable: boolean,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCode {
  // Input errors
  INVALID_INPUT = 'INVALID_INPUT',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Processing errors
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  TIMEOUT = 'TIMEOUT',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  
  // External errors
  API_ERROR = 'API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Output errors
  INVALID_OUTPUT = 'INVALID_OUTPUT',
  UNSAFE_CONTENT = 'UNSAFE_CONTENT',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

// Comprehensive Error Handler
export class ErrorHandler extends EventEmitter {
  private errorHistory: ErrorRecord[] = [];
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private config: ErrorHandlerConfig;
  
  constructor(config: ErrorHandlerConfig) {
    super();
    this.config = config;
    this.startErrorAnalysis();
  }
  
  // Handle error with appropriate strategy
  async handle(error: Error, context: ErrorContext): Promise<ErrorResolution> {
    console.error(`🚨 Error occurred: ${error.message}`, context);
    
    // Record error
    const errorRecord = this.recordError(error, context);
    
    // Classify error
    const classification = this.classifyError(error);
    
    // Determine handling strategy
    const strategy = this.determineStrategy(classification, context);
    
    // Execute strategy
    const resolution = await this.executeStrategy(strategy, error, context);
    
    // Emit events
    this.emit('error:handled', {
      error: errorRecord,
      classification,
      strategy,
      resolution
    });
    
    // Check if we need to escalate
    if (this.shouldEscalate(classification, errorRecord)) {
      await this.escalate(errorRecord);
    }
    
    return resolution;
  }
  
  // Retry with exponential backoff
  async retry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const retryOptions = {
      retries: options?.retries || this.config.defaultRetries,
      factor: options?.factor || 2,
      minTimeout: options?.minTimeout || 1000,
      maxTimeout: options?.maxTimeout || 30000,
      randomize: options?.randomize || true,
      onFailedAttempt: (error: any) => {
        console.log(`Retry attempt ${error.attemptNumber} failed: ${error.message}`);
        this.emit('retry:attempt', {
          attempt: error.attemptNumber,
          error: error.message,
          retriesLeft: error.retriesLeft
        });
      }
    };
    
    try {
      return await pRetry(operation, retryOptions);
    } catch (error) {
      this.emit('retry:failed', error);
      throw error;
    }
  }
  
  // Circuit breaker pattern
  getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const breaker = new CircuitBreaker(
        options?.action || (() => Promise.resolve()),
        {
          timeout: options?.timeout || 3000,
          errorThresholdPercentage: options?.errorThreshold || 50,
          resetTimeout: options?.resetTimeout || 30000,
          volumeThreshold: options?.volumeThreshold || 10,
          ...options
        }
      );
      
      // Add event listeners
      breaker.on('open', () => {
        console.log(`🔴 Circuit breaker '${name}' opened`);
        this.emit('circuit:open', name);
      });
      
      breaker.on('halfOpen', () => {
        console.log(`🟡 Circuit breaker '${name}' half-open`);
        this.emit('circuit:halfOpen', name);
      });
      
      breaker.on('close', () => {
        console.log(`🟢 Circuit breaker '${name}' closed`);
        this.emit('circuit:close', name);
      });
      
      this.circuitBreakers.set(name, breaker);
    }
    
    return this.circuitBreakers.get(name)!;
  }
  
  // Error classification
  private classifyError(error: Error): ErrorClassification {
    const classification: ErrorClassification = {
      type: 'unknown',
      severity: ErrorSeverity.MEDIUM,
      recoverable: false,
      category: 'general'
    };
    
    if (error instanceof AgentError) {
      classification.type = error.code;
      classification.severity = error.severity;
      classification.recoverable = error.recoverable;
    } else if (error.message.includes('timeout')) {
      classification.type = ErrorCode.TIMEOUT;
      classification.severity = ErrorSeverity.MEDIUM;
      classification.recoverable = true;
      classification.category = 'performance';
    } else if (error.message.includes('rate limit')) {
      classification.type = ErrorCode.RATE_LIMITED;
      classification.severity = ErrorSeverity.LOW;
      classification.recoverable = true;
      classification.category = 'external';
    } else if (error.message.includes('unauthorized')) {
      classification.type = ErrorCode.UNAUTHORIZED;
      classification.severity = ErrorSeverity.HIGH;
      classification.recoverable = false;
      classification.category = 'security';
    }
    
    return classification;
  }
  
  // Determine handling strategy
  private determineStrategy(
    classification: ErrorClassification,
    context: ErrorContext
  ): ErrorStrategy {
    // Critical errors need immediate action
    if (classification.severity === ErrorSeverity.CRITICAL) {
      return ErrorStrategy.FAIL_FAST;
    }
    
    // Recoverable errors can be retried
    if (classification.recoverable) {
      if (context.attemptNumber < this.config.maxRetries) {
        return ErrorStrategy.RETRY;
      }
      return ErrorStrategy.FALLBACK;
    }
    
    // Rate limiting needs backoff
    if (classification.type === ErrorCode.RATE_LIMITED) {
      return ErrorStrategy.BACKOFF;
    }
    
    // Security errors should fail
    if (classification.category === 'security') {
      return ErrorStrategy.FAIL_FAST;
    }
    
    // Default to fallback
    return ErrorStrategy.FALLBACK;
  }
  
  // Execute error handling strategy
  private async executeStrategy(
    strategy: ErrorStrategy,
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    switch (strategy) {
      case ErrorStrategy.RETRY:
        return this.executeRetry(error, context);
        
      case ErrorStrategy.FALLBACK:
        return this.executeFallback(error, context);
        
      case ErrorStrategy.BACKOFF:
        return this.executeBackoff(error, context);
        
      case ErrorStrategy.FAIL_FAST:
        return this.executeFailFast(error, context);
        
      case ErrorStrategy.CIRCUIT_BREAK:
        return this.executeCircuitBreak(error, context);
        
      default:
        return {
          strategy,
          success: false,
          message: 'Unknown strategy'
        };
    }
  }
  
  private async executeRetry(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    const delay = Math.min(
      Math.pow(2, context.attemptNumber || 0) * 1000,
      this.config.maxBackoff
    );
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      strategy: ErrorStrategy.RETRY,
      success: true,
      message: `Retrying after ${delay}ms`,
      action: 'retry'
    };
  }
  
  private async executeFallback(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    // Use fallback value or service
    const fallbackValue = context.fallback || this.config.defaultFallback;
    
    return {
      strategy: ErrorStrategy.FALLBACK,
      success: true,
      message: 'Using fallback',
      result: fallbackValue
    };
  }
  
  private async executeBackoff(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    const backoffTime = this.calculateBackoff(context);
    
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    return {
      strategy: ErrorStrategy.BACKOFF,
      success: true,
      message: `Backing off for ${backoffTime}ms`,
      action: 'wait'
    };
  }
  
  private async executeFailFast(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    // Immediately fail without retry
    return {
      strategy: ErrorStrategy.FAIL_FAST,
      success: false,
      message: 'Failed immediately due to critical error',
      error
    };
  }
  
  private async executeCircuitBreak(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResolution> {
    const breaker = this.getCircuitBreaker(context.service || 'default');
    
    if (breaker.opened) {
      return {
        strategy: ErrorStrategy.CIRCUIT_BREAK,
        success: false,
        message: 'Circuit breaker is open',
        action: 'reject'
      };
    }
    
    return {
      strategy: ErrorStrategy.CIRCUIT_BREAK,
      success: true,
      message: 'Circuit breaker allowing request',
      action: 'proceed'
    };
  }
  
  // Record error for analysis
  private recordError(error: Error, context: ErrorContext): ErrorRecord {
    const record: ErrorRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      count: this.incrementErrorCount(error.message)
    };
    
    this.errorHistory.push(record);
    
    // Maintain history size
    if (this.errorHistory.length > this.config.maxHistorySize) {
      this.errorHistory.shift();
    }
    
    return record;
  }
  
  private incrementErrorCount(errorKey: string): number {
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);
    return count;
  }
  
  private calculateBackoff(context: ErrorContext): number {
    const base = this.config.baseBackoff;
    const multiplier = context.attemptNumber || 1;
    const jitter = Math.random() * 1000;
    
    return Math.min(
      base * Math.pow(2, multiplier) + jitter,
      this.config.maxBackoff
    );
  }
  
  private shouldEscalate(
    classification: ErrorClassification,
    record: ErrorRecord
  ): boolean {
    // Escalate critical errors
    if (classification.severity === ErrorSeverity.CRITICAL) {
      return true;
    }
    
    // Escalate repeated errors
    if (record.count > this.config.escalationThreshold) {
      return true;
    }
    
    // Escalate security issues
    if (classification.category === 'security') {
      return true;
    }
    
    return false;
  }
  
  private async escalate(record: ErrorRecord): Promise<void> {
    console.error('🚨 ESCALATING ERROR:', record);
    
    // Send alerts
    this.emit('error:escalated', record);
    
    // In production, send to monitoring service
    // await this.sendToMonitoring(record);
    // await this.notifyOncall(record);
  }
  
  // Error pattern analysis
  private startErrorAnalysis(): void {
    setInterval(() => {
      const patterns = this.analyzeErrorPatterns();
      
      if (patterns.length > 0) {
        this.emit('error:patterns', patterns);
        
        // Take preventive action
        patterns.forEach(pattern => {
          this.handleErrorPattern(pattern);
        });
      }
    }, this.config.analysisInterval);
  }
  
  private analyzeErrorPatterns(): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    const threshold = this.config.patternThreshold;
    
    // Check for error spikes
    this.errorCounts.forEach((count, error) => {
      if (count > threshold) {
        patterns.push({
          type: 'spike',
          error,
          count,
          action: 'investigate'
        });
      }
    });
    
    // Check for error trends
    const recentErrors = this.errorHistory.slice(-100);
    const errorTypes = new Map<string, number>();
    
    recentErrors.forEach(record => {
      const type = record.error.name;
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    });
    
    errorTypes.forEach((count, type) => {
      if (count > threshold / 2) {
        patterns.push({
          type: 'trend',
          error: type,
          count,
          action: 'monitor'
        });
      }
    });
    
    return patterns;
  }
  
  private handleErrorPattern(pattern: ErrorPattern): void {
    switch (pattern.action) {
      case 'investigate':
        console.warn(`⚠️ Error spike detected: ${pattern.error} (${pattern.count} occurrences)`);
        // Trigger investigation workflow
        break;
        
      case 'monitor':
        console.log(`👁️ Monitoring error trend: ${pattern.error}`);
        // Increase monitoring
        break;
        
      case 'mitigate':
        console.log(`🛡️ Mitigating error pattern: ${pattern.error}`);
        // Apply mitigation
        break;
    }
  }
  
  // Get error statistics
  getStatistics(): ErrorStatistics {
    const total = this.errorHistory.length;
    const bySeverity = new Map<ErrorSeverity, number>();
    const byType = new Map<string, number>();
    
    this.errorHistory.forEach(record => {
      // Count would be tracked in real implementation
    });
    
    return {
      total,
      bySeverity: Object.fromEntries(bySeverity),
      byType: Object.fromEntries(byType),
      recentErrors: this.errorHistory.slice(-10),
      errorRate: this.calculateErrorRate(),
      circuitBreakerStatus: this.getCircuitBreakerStatus()
    };
  }
  
  private calculateErrorRate(): number {
    const recentWindow = 60000; // 1 minute
    const now = Date.now();
    
    const recentErrors = this.errorHistory.filter(
      record => now - record.timestamp.getTime() < recentWindow
    );
    
    return recentErrors.length / (recentWindow / 1000); // Errors per second
  }
  
  private getCircuitBreakerStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    
    this.circuitBreakers.forEach((breaker, name) => {
      status[name] = breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed';
    });
    
    return status;
  }
}

// Type definitions
interface ErrorHandlerConfig {
  defaultRetries: number;
  maxRetries: number;
  baseBackoff: number;
  maxBackoff: number;
  defaultFallback: any;
  maxHistorySize: number;
  escalationThreshold: number;
  analysisInterval: number;
  patternThreshold: number;
}

interface ErrorContext {
  service?: string;
  operation?: string;
  attemptNumber?: number;
  userId?: string;
  requestId?: string;
  fallback?: any;
  [key: string]: any;
}

interface ErrorClassification {
  type: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  category: string;
}

enum ErrorStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  BACKOFF = 'backoff',
  FAIL_FAST = 'fail_fast',
  CIRCUIT_BREAK = 'circuit_break'
}

interface ErrorResolution {
  strategy: ErrorStrategy;
  success: boolean;
  message: string;
  result?: any;
  error?: Error;
  action?: string;
}

interface ErrorRecord {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: ErrorContext;
  count: number;
}

interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

interface CircuitBreakerOptions {
  action?: () => Promise<any>;
  timeout?: number;
  errorThreshold?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

interface ErrorPattern {
  type: 'spike' | 'trend' | 'anomaly';
  error: string;
  count: number;
  action: 'investigate' | 'monitor' | 'mitigate';
}

interface ErrorStatistics {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentErrors: ErrorRecord[];
  errorRate: number;
  circuitBreakerStatus: Record<string, string>;
}
```

### 1.2 Input Validation and Sanitization

```typescript
// src/reliability/input-validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { createHash } from 'crypto';

export class InputValidator {
  private schemas: Map<string, z.ZodSchema> = new Map();
  private validationCache: Map<string, boolean> = new Map();
  private blacklistPatterns: RegExp[] = [];
  private whitelistPatterns: RegExp[] = [];
  
  constructor(config?: ValidationConfig) {
    this.initializePatterns();
    this.registerDefaultSchemas();
  }
  
  // Initialize security patterns
  private initializePatterns(): void {
    // Blacklist patterns (potential threats)
    this.blacklistPatterns = [
      // SQL Injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
      /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
      
      // Script injection patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // Command injection patterns
      /(\||;|&|`|\$\(|\))/g,
      /(rm|wget|curl|chmod|sudo|su)\s/gi,
      
      // Path traversal patterns
      /\.\.\//g,
      /\.\.\\/, 
      
      // Prompt injection patterns
      /ignore\s+previous\s+instructions/gi,
      /disregard\s+all\s+prior/gi,
      /new\s+instructions:/gi,
      /system\s+prompt:/gi
    ];
    
    // Whitelist patterns (allowed formats)
    this.whitelistPatterns = [
      /^[a-zA-Z0-9\s\-_.@]+$/,  // Alphanumeric with basic symbols
      /^\w+@\w+\.\w+$/,          // Email format
      /^\d{3}-\d{3}-\d{4}$/,     // Phone format
      /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+$/ // URL format
    ];
  }
  
  // Register validation schemas
  registerSchema(name: string, schema: z.ZodSchema): void {
    this.schemas.set(name, schema);
  }
  
  // Validate input against schema
  async validate<T>(
    input: unknown,
    schemaName: string
  ): Promise<ValidationResult<T>> {
    const schema = this.schemas.get(schemaName);
    
    if (!schema) {
      return {
        success: false,
        errors: [`Schema '${schemaName}' not found`]
      };
    }
    
    try {
      const validated = await schema.parseAsync(input);
      
      // Additional security checks
      const securityCheck = this.performSecurityChecks(validated);
      
      if (!securityCheck.safe) {
        return {
          success: false,
          errors: securityCheck.violations
        };
      }
      
      return {
        success: true,
        data: validated as T
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      
      return {
        success: false,
        errors: [`Validation error: ${error}`]
      };
    }
  }
  
  // Perform security checks
  private performSecurityChecks(input: any): SecurityCheckResult {
    const violations: string[] = [];
    
    // Check against blacklist patterns
    const inputStr = JSON.stringify(input);
    
    for (const pattern of this.blacklistPatterns) {
      if (pattern.test(inputStr)) {
        violations.push(`Potential security threat detected: ${pattern.source}`);
      }
    }
    
    // Check for oversized inputs
    if (inputStr.length > 1000000) { // 1MB limit
      violations.push('Input size exceeds maximum allowed');
    }
    
    // Check for deep nesting (potential DoS)
    if (this.getDepth(input) > 10) {
      violations.push('Input nesting depth exceeds maximum allowed');
    }
    
    return {
      safe: violations.length === 0,
      violations
    };
  }
  
  // Sanitize HTML content
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title']
    });
  }
  
  // Sanitize for LLM input
  sanitizeForLLM(text: string): string {
    let sanitized = text;
    
    // Remove potential prompt injections
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/gi,
      /disregard\s+all\s+prior/gi,
      /new\s+instructions:/gi,
      /system\s+prompt:/gi,
      /assistant:/gi,
      /human:/gi
    ];
    
    injectionPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit length
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '... [TRUNCATED]';
    }
    
    return sanitized;
  }
  
  // Validate file uploads
  async validateFile(file: FileUpload): Promise<ValidationResult<FileUpload>> {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      errors.push('File size exceeds 10MB limit');
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      errors.push(`File extension ${extension} not allowed`);
    }
    
    // Scan for malware signatures (simplified)
    if (await this.scanForMalware(file.buffer)) {
      errors.push('File contains potential security threat');
    }
    
    return {
      success: errors.length === 0,
      errors,
      data: errors.length === 0 ? file : undefined
    };
  }
  
  // Simple malware signature check
  private async scanForMalware(buffer: Buffer): Promise<boolean> {
    // Check for common malware signatures
    const signatures = [
      Buffer.from('4D5A'), // PE executable
      Buffer.from('7F454C46'), // ELF executable
      Buffer.from('CAFEBABE'), // Java class
    ];
    
    for (const signature of signatures) {
      if (buffer.subarray(0, signature.length).equals(signature)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Get object depth
  private getDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const depth = this.getDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    
    return maxDepth;
  }
  
  // Register default schemas
  private registerDefaultSchemas(): void {
    // User input schema
    this.registerSchema('userInput', z.object({
      message: z.string().min(1).max(1000),
      userId: z.string().uuid().optional(),
      sessionId: z.string().optional(),
      metadata: z.record(z.any()).optional()
    }));
    
    // API request schema
    this.registerSchema('apiRequest', z.object({
      endpoint: z.string().url(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
      timeout: z.number().positive().optional()
    }));
    
    // Agent configuration schema
    this.registerSchema('agentConfig', z.object({
      name: z.string(),
      model: z.string(),
      temperature: z.number().min(0).max(2),
      maxTokens: z.number().positive(),
      tools: z.array(z.string()).optional()
    }));
  }
}

// Output sanitization
export class OutputSanitizer {
  private piiPatterns: Map<string, RegExp> = new Map();
  private profanityList: Set<string> = new Set();
  
  constructor() {
    this.initializePIIPatterns();
    this.loadProfanityList();
  }
  
  private initializePIIPatterns(): void {
    this.piiPatterns.set('ssn', /\b\d{3}-\d{2}-\d{4}\b/g);
    this.piiPatterns.set('credit_card', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g);
    this.piiPatterns.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    this.piiPatterns.set('phone', /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
  }
  
  private loadProfanityList(): void {
    // Load profanity list (simplified)
    this.profanityList = new Set(['badword1', 'badword2']);
  }
  
  // Sanitize output
  sanitize(output: string): SanitizationResult {
    let sanitized = output;
    const redactions: Redaction[] = [];
    
    // Remove PII
    this.piiPatterns.forEach((pattern, type) => {
      sanitized = sanitized.replace(pattern, (match) => {
        redactions.push({ type, original: match, replacement: '[REDACTED]' });
        return '[REDACTED]';
      });
    });
    
    // Remove profanity
    this.profanityList.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    });
    
    // Remove internal information
    sanitized = this.removeInternalInfo(sanitized);
    
    return {
      original: output,
      sanitized,
      redactions,
      safe: redactions.length === 0
    };
  }
  
  private removeInternalInfo(text: string): string {
    // Remove internal URLs, IPs, etc.
    const patterns = [
      /\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g, // Private IPs
      /\b[a-z]+\.internal\b/gi, // Internal domains
      /\bapi[_-]?key[\s:=]+[\w-]+/gi, // API keys
      /\bpassword[\s:=]+[\w-]+/gi, // Passwords
    ];
    
    let sanitized = text;
    patterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[INTERNAL]');
    });
    
    return sanitized;
  }
}

// Type definitions
interface ValidationConfig {
  maxInputSize?: number;
  maxDepth?: number;
  allowedFileTypes?: string[];
  customPatterns?: RegExp[];
}

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface SecurityCheckResult {
  safe: boolean;
  violations: string[];
}

interface FileUpload {
  name: string;
  size: number;
  mimetype: string;
  buffer: Buffer;
}

interface SanitizationResult {
  original: string;
  sanitized: string;
  redactions: Redaction[];
  safe: boolean;
}

interface Redaction {
  type: string;
  original: string;
  replacement: string;
}
```

---

## 🚦 Part 2: Rate Limiting and Resource Management

### 2.1 Rate Limiting System

```typescript
// src/reliability/rate-limiting.ts
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

export class RateLimitManager {
  private limiters: Map<string, RateLimiter> = new Map();
  private redis?: Redis;
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
    
    if (config.storage === 'redis') {
      this.redis = new Redis(config.redis);
    }
    
    this.initializeLimiters();
  }
  
  // Initialize rate limiters
  private initializeLimiters(): void {
    // API rate limiter
    this.createLimiter('api', {
      points: 100, // requests
      duration: 60, // per minute
      blockDuration: 60 * 5 // block for 5 minutes
    });
    
    // Token rate limiter
    this.createLimiter('tokens', {
      points: 10000, // tokens
      duration: 60, // per minute
      blockDuration: 60 * 10
    });
    
    // User rate limiter
    this.createLimiter('user', {
      points: 50,
      duration: 60,
      blockDuration: 60 * 2
    });
    
    // Cost rate limiter (in cents)
    this.createLimiter('cost', {
      points: 1000, // $10
      duration: 60 * 60, // per hour
      blockDuration: 60 * 60
    });
  }
  
  // Create a rate limiter
  private createLimiter(name: string, options: RateLimiterOptions): void {
    const limiterClass = this.redis ? RateLimiterRedis : RateLimiterMemory;
    
    const limiter = new limiterClass({
      storeClient: this.redis,
      keyPrefix: `rl:${name}:`,
      ...options
    });
    
    this.limiters.set(name, {
      limiter,
      options,
      stats: {
        allowed: 0,
        blocked: 0,
        total: 0
      }
    });
  }
  
  // Check rate limit
  async checkLimit(
    limiterName: string,
    key: string,
    points: number = 1
  ): Promise<RateLimitResult> {
    const rateLimiter = this.limiters.get(limiterName);
    
    if (!rateLimiter) {
      throw new Error(`Rate limiter '${limiterName}' not found`);
    }
    
    try {
      const result = await rateLimiter.limiter.consume(key, points);
      
      rateLimiter.stats.allowed++;
      rateLimiter.stats.total++;
      
      return {
        allowed: true,
        remaining: result.remainingPoints,
        resetAt: new Date(Date.now() + result.msBeforeNext),
        consumed: result.consumedPoints
      };
    } catch (error: any) {
      rateLimiter.stats.blocked++;
      rateLimiter.stats.total++;
      
      return {
        allowed: false,
        remaining: error.remainingPoints || 0,
        resetAt: new Date(Date.now() + error.msBeforeNext),
        consumed: error.consumedPoints || 0,
        retryAfter: error.msBeforeNext / 1000
      };
    }
  }
  
  // Token bucket algorithm for smooth rate limiting
  async consumeTokens(
    userId: string,
    tokens: number
  ): Promise<TokenConsumptionResult> {
    const bucket = await this.getTokenBucket(userId);
    
    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate / 1000);
    
    bucket.tokens = Math.min(
      bucket.maxTokens,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;
    
    // Check if enough tokens
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      await this.saveTokenBucket(userId, bucket);
      
      return {
        allowed: true,
        tokensRemaining: bucket.tokens,
        tokensConsumed: tokens,
        refillRate: bucket.refillRate
      };
    }
    
    // Calculate wait time
    const tokensNeeded = tokens - bucket.tokens;
    const waitTime = Math.ceil(tokensNeeded / bucket.refillRate * 1000);
    
    return {
      allowed: false,
      tokensRemaining: bucket.tokens,
      tokensNeeded,
      waitTime,
      refillRate: bucket.refillRate
    };
  }
  
  // Adaptive rate limiting based on behavior
  async adaptiveLimit(
    userId: string,
    request: Request
  ): Promise<AdaptiveLimitResult> {
    const userProfile = await this.getUserProfile(userId);
    
    // Calculate trust score
    const trustScore = this.calculateTrustScore(userProfile);
    
    // Adjust limits based on trust
    const baseLimit = 100;
    const adjustedLimit = Math.floor(baseLimit * (1 + trustScore));
    
    // Apply limit
    const result = await this.checkLimit('adaptive', userId, 1);
    
    return {
      ...result,
      trustScore,
      adjustedLimit,
      profile: userProfile
    };
  }
  
  private calculateTrustScore(profile: UserProfile): number {
    let score = 0;
    
    // Account age bonus
    const accountAge = Date.now() - profile.createdAt.getTime();
    const ageInDays = accountAge / (1000 * 60 * 60 * 24);
    score += Math.min(ageInDays / 100, 0.3); // Up to 0.3 bonus
    
    // Good behavior bonus
    const goodBehaviorRatio = profile.successfulRequests / (profile.totalRequests || 1);
    score += goodBehaviorRatio * 0.3; // Up to 0.3 bonus
    
    // No violations bonus
    if (profile.violations === 0) {
      score += 0.2;
    }
    
    // Premium user bonus
    if (profile.tier === 'premium') {
      score += 0.5;
    }
    
    return Math.min(score, 1); // Cap at 1
  }
  
  // Cost-based rate limiting
  async checkCostLimit(
    userId: string,
    estimatedCost: number
  ): Promise<CostLimitResult> {
    const userBudget = await this.getUserBudget(userId);
    
    // Check daily limit
    const dailySpent = await this.getDailySpent(userId);
    if (dailySpent + estimatedCost > userBudget.dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily budget exceeded',
        dailySpent,
        dailyLimit: userBudget.dailyLimit,
        estimatedCost
      };
    }
    
    // Check monthly limit
    const monthlySpent = await this.getMonthlySpent(userId);
    if (monthlySpent + estimatedCost > userBudget.monthlyLimit) {
      return {
        allowed: false,
        reason: 'Monthly budget exceeded',
        monthlySpent,
        monthlyLimit: userBudget.monthlyLimit,
        estimatedCost
      };
    }
    
    // Record the cost
    await this.recordCost(userId, estimatedCost);
    
    return {
      allowed: true,
      dailySpent: dailySpent + estimatedCost,
      dailyLimit: userBudget.dailyLimit,
      monthlySpent: monthlySpent + estimatedCost,
      monthlyLimit: userBudget.monthlyLimit,
      estimatedCost
    };
  }
  
  // Get statistics
  getStatistics(): RateLimitStatistics {
    const stats: RateLimitStatistics = {
      limiters: {},
      totalAllowed: 0,
      totalBlocked: 0,
      blockRate: 0
    };
    
    this.limiters.forEach((limiter, name) => {
      stats.limiters[name] = { ...limiter.stats };
      stats.totalAllowed += limiter.stats.allowed;
      stats.totalBlocked += limiter.stats.blocked;
    });
    
    const total = stats.totalAllowed + stats.totalBlocked;
    stats.blockRate = total > 0 ? stats.totalBlocked / total : 0;
    
    return stats;
  }
  
  // Helper methods (stubs for full implementation)
  private async getTokenBucket(userId: string): Promise<TokenBucket> {
    // Implementation
    return {
      tokens: 1000,
      maxTokens: 1000,
      refillRate: 10,
      lastRefill: Date.now()
    };
  }
  
  private async saveTokenBucket(userId: string, bucket: TokenBucket): Promise<void> {
    // Implementation
  }
  
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Implementation
    return {
      userId,
      createdAt: new Date(),
      totalRequests: 100,
      successfulRequests: 95,
      violations: 0,
      tier: 'free'
    };
  }
  
  private async getUserBudget(userId: string): Promise<UserBudget> {
    // Implementation
    return {
      dailyLimit: 1000,
      monthlyLimit: 10000
    };
  }
  
  private async getDailySpent(userId: string): Promise<number> {
    // Implementation
    return 0;
  }
  
  private async getMonthlySpent(userId: string): Promise<number> {
    // Implementation
    return 0;
  }
  
  private async recordCost(userId: string, cost: number): Promise<void> {
    // Implementation
  }
}

// Type definitions
interface RateLimitConfig {
  storage: 'memory' | 'redis';
  redis?: any;
}

interface RateLimiter {
  limiter: any;
  options: RateLimiterOptions;
  stats: {
    allowed: number;
    blocked: number;
    total: number;
  };
}

interface RateLimiterOptions {
  points: number;
  duration: number;
  blockDuration: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  consumed: number;
  retryAfter?: number;
}

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number;
  lastRefill: number;
}

interface TokenConsumptionResult {
  allowed: boolean;
  tokensRemaining: number;
  tokensConsumed?: number;
  tokensNeeded?: number;
  waitTime?: number;
  refillRate: number;
}

interface UserProfile {
  userId: string;
  createdAt: Date;
  totalRequests: number;
  successfulRequests: number;
  violations: number;
  tier: 'free' | 'premium' | 'enterprise';
}

interface AdaptiveLimitResult extends RateLimitResult {
  trustScore: number;
  adjustedLimit: number;
  profile: UserProfile;
}

interface UserBudget {
  dailyLimit: number;
  monthlyLimit: number;
}

interface CostLimitResult {
  allowed: boolean;
  reason?: string;
  dailySpent: number;
  dailyLimit: number;
  monthlySpent: number;
  monthlyLimit: number;
  estimatedCost: number;
}

interface RateLimitStatistics {
  limiters: Record<string, any>;
  totalAllowed: number;
  totalBlocked: number;
  blockRate: number;
}

interface Request {
  endpoint: string;
  method: string;
  size: number;
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: Error Handling

```typescript
// exercises/01-error-handling.ts

/**
 * Exercise 1.1: Cascading Failure Prevention
 * Build a system that:
 * - Detects cascading failures
 * - Isolates failing components
 * - Maintains partial functionality
 * - Recovers gracefully
 * - Prevents failure spread
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: Self-Healing System
 * Implement self-healing capabilities:
 * - Automatic error detection
 * - Root cause analysis
 * - Automated recovery actions
 * - Learning from failures
 * - Prevention strategies
 */
export async function exercise1_2() {
  // Your implementation here
}
```

### Exercise Set 2: Security

```typescript
// exercises/02-security.ts

/**
 * Exercise 2.1: Prompt Injection Defense
 * Build defenses against:
 * - Direct prompt injection
 * - Indirect injection via data
 * - Jailbreak attempts
 * - System prompt extraction
 * - Role manipulation
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: Data Privacy System
 * Implement privacy protection:
 * - PII detection and redaction
 * - Data encryption
 * - Access control
 * - Audit logging
 * - Compliance (GDPR, CCPA)
 */
export async function exercise2_2() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Production-Ready Agent Platform

```typescript
// capstone/reliable-agent-platform.ts

interface ReliableAgentPlatform {
  // Safety Systems
  safety: {
    inputValidation: InputValidator;
    outputSanitization: OutputSanitizer;
    contentModeration: ContentModerator;
    threatDetection: ThreatDetector;
  };
  
  // Reliability Systems
  reliability: {
    errorHandler: ErrorHandler;
    circuitBreakers: CircuitBreakerManager;
    retryManager: RetryManager;
    fallbackSystem: FallbackSystem;
  };
  
  // Resource Management
  resources: {
    rateLimiter: RateLimitManager;
    costController: CostController;
    quotaManager: QuotaManager;
    loadBalancer: LoadBalancer;
  };
  
  // Monitoring
  monitoring: {
    healthChecks: HealthCheckSystem;
    alerting: AlertingSystem;
    metrics: MetricsCollector;
    logging: LoggingSystem;
  };
}

// Requirements:
// 1. 99.9% uptime
// 2. < 1% error rate
// 3. No security breaches
// 4. Automatic recovery
// 5. Cost optimization
// 6. Compliance ready
```

---

## 💡 Pro Tips

### Reliability Best Practices

1. **Defense in Depth**: Multiple layers of protection
2. **Fail Safe**: When in doubt, fail securely
3. **Graceful Degradation**: Partial service is better than none
4. **Monitor Everything**: You can't fix what you can't see
5. **Practice Failures**: Regular chaos engineering

---

## 🎓 Final Thoughts

Reliability and safety are not features - they're requirements. This phase transforms your agents from toys into tools that businesses can depend on.

**Build it right, build it safe, build it to last! 🛡️**