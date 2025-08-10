# 🔌 Phase 10: External Integrations - Complete Mastery Guide
## Connecting AI Agents to the Real World

### 🌟 Phase Overview

Welcome to the integration hub! This phase transforms your agents from isolated systems into connected powerhouses that interact with APIs, databases, webhooks, and external services. You'll learn to build robust integrations that handle real-world complexity, failures, and scale.

**Duration**: 4-5 days (20-25 hours total)
**Difficulty**: Advanced
**Prerequisites**: Completed Phases 1-9, API knowledge, understanding of distributed systems

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **API Integration Mastery**
   - Build resilient API clients
   - Handle authentication flows
   - Manage rate limiting
   - Implement circuit breakers

2. **Database Connectivity**
   - Connect to SQL/NoSQL databases
   - Implement connection pooling
   - Handle transactions
   - Optimize queries

3. **Event-Driven Architecture**
   - Implement webhooks
   - Handle event streams
   - Build message queues
   - Process async events

4. **Third-Party Services**
   - Integrate cloud services
   - Connect to SaaS platforms
   - Handle OAuth flows
   - Manage API keys securely

---

## 📚 Conceptual Foundation

### The Integration Ecosystem 🌐

Think of integrations like a city's infrastructure:

```typescript
interface IntegrationEcosystem {
  // Transportation (APIs)
  apis: {
    analogy: 'Roads and highways',
    purpose: 'Direct point-to-point communication',
    examples: ['REST', 'GraphQL', 'gRPC'],
    characteristics: ['Synchronous', 'Request-Response', 'Stateless']
  };
  
  // Utilities (Databases)
  databases: {
    analogy: 'Power and water systems',
    purpose: 'Persistent data storage and retrieval',
    examples: ['PostgreSQL', 'MongoDB', 'Redis'],
    characteristics: ['Persistent', 'Transactional', 'Queryable']
  };
  
  // Communication (Events)
  events: {
    analogy: 'Postal and broadcast systems',
    purpose: 'Asynchronous message delivery',
    examples: ['Webhooks', 'Kafka', 'RabbitMQ'],
    characteristics: ['Asynchronous', 'Decoupled', 'Scalable']
  };
  
  // Services (Third-Party)
  services: {
    analogy: 'Public services and utilities',
    purpose: 'Specialized functionality',
    examples: ['Stripe', 'Twilio', 'SendGrid'],
    characteristics: ['Managed', 'Specialized', 'Pay-per-use']
  };
}
```

---

## 🏗️ Part 1: Comprehensive Integration System

### 1.1 Universal Integration Framework

```typescript
// src/integrations/integration-system.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis';
import amqp from 'amqplib';
import { EventEmitter } from 'events';
import CircuitBreaker from 'opossum';
import pRetry from 'p-retry';
import { RateLimiter } from 'limiter';

// Core Integration System
export class IntegrationSystem extends EventEmitter {
  private apiClients: Map<string, APIClient> = new Map();
  private databases: Map<string, DatabaseConnection> = new Map();
  private eventBuses: Map<string, EventBus> = new Map();
  private webhooks: Map<string, WebhookHandler> = new Map();
  private config: IntegrationConfig;
  private healthChecks: Map<string, HealthCheck> = new Map();
  
  constructor(config: IntegrationConfig) {
    super();
    this.config = config;
    this.initializeIntegrations();
    this.startHealthChecking();
  }
  
  // Initialize all integrations
  private async initializeIntegrations(): Promise<void> {
    console.log('🔧 Initializing integration system...');
    
    // Initialize API clients
    for (const apiConfig of this.config.apis || []) {
      await this.registerAPI(apiConfig);
    }
    
    // Initialize databases
    for (const dbConfig of this.config.databases || []) {
      await this.connectDatabase(dbConfig);
    }
    
    // Initialize event buses
    for (const eventConfig of this.config.events || []) {
      await this.setupEventBus(eventConfig);
    }
    
    // Initialize webhooks
    for (const webhookConfig of this.config.webhooks || []) {
      await this.registerWebhook(webhookConfig);
    }
    
    console.log('✅ Integration system initialized');
  }
  
  // Register API client with resilience patterns
  async registerAPI(config: APIConfig): Promise<void> {
    const client = new APIClient(config);
    this.apiClients.set(config.name, client);
    
    // Setup health check
    this.healthChecks.set(`api:${config.name}`, {
      name: config.name,
      type: 'api',
      check: async () => await client.healthCheck(),
      interval: config.healthCheckInterval || 30000
    });
    
    this.emit('api:registered', config.name);
  }
  
  // Connect to database with connection pooling
  async connectDatabase(config: DatabaseConfig): Promise<void> {
    let connection: DatabaseConnection;
    
    switch (config.type) {
      case 'postgresql':
        connection = await this.connectPostgreSQL(config);
        break;
      
      case 'mongodb':
        connection = await this.connectMongoDB(config);
        break;
      
      case 'redis':
        connection = await this.connectRedis(config);
        break;
      
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
    
    this.databases.set(config.name, connection);
    
    // Setup health check
    this.healthChecks.set(`db:${config.name}`, {
      name: config.name,
      type: 'database',
      check: async () => await connection.healthCheck(),
      interval: config.healthCheckInterval || 30000
    });
    
    this.emit('database:connected', config.name);
  }
  
  // Setup event bus for async communication
  async setupEventBus(config: EventBusConfig): Promise<void> {
    const eventBus = new EventBus(config);
    await eventBus.connect();
    
    this.eventBuses.set(config.name, eventBus);
    
    // Setup health check
    this.healthChecks.set(`event:${config.name}`, {
      name: config.name,
      type: 'event_bus',
      check: async () => await eventBus.healthCheck(),
      interval: config.healthCheckInterval || 30000
    });
    
    this.emit('eventbus:connected', config.name);
  }
  
  // Register webhook handler
  async registerWebhook(config: WebhookConfig): Promise<void> {
    const handler = new WebhookHandler(config);
    this.webhooks.set(config.name, handler);
    
    // Setup health check
    this.healthChecks.set(`webhook:${config.name}`, {
      name: config.name,
      type: 'webhook',
      check: async () => await handler.healthCheck(),
      interval: config.healthCheckInterval || 60000
    });
    
    this.emit('webhook:registered', config.name);
  }
  
  // Get API client
  getAPI(name: string): APIClient {
    const client = this.apiClients.get(name);
    if (!client) {
      throw new Error(`API client '${name}' not found`);
    }
    return client;
  }
  
  // Get database connection
  getDatabase(name: string): DatabaseConnection {
    const connection = this.databases.get(name);
    if (!connection) {
      throw new Error(`Database '${name}' not found`);
    }
    return connection;
  }
  
  // Get event bus
  getEventBus(name: string): EventBus {
    const eventBus = this.eventBuses.get(name);
    if (!eventBus) {
      throw new Error(`Event bus '${name}' not found`);
    }
    return eventBus;
  }
  
  // Execute integration workflow
  async executeWorkflow(workflow: IntegrationWorkflow): Promise<WorkflowResult> {
    const context: WorkflowContext = {
      variables: {},
      results: [],
      errors: []
    };
    
    console.log(`🔄 Executing workflow: ${workflow.name}`);
    
    for (const step of workflow.steps) {
      try {
        const result = await this.executeStep(step, context);
        context.results.push(result);
        
        if (step.storeAs) {
          context.variables[step.storeAs] = result;
        }
        
        this.emit('workflow:step:completed', {
          workflow: workflow.name,
          step: step.name,
          result
        });
      } catch (error) {
        context.errors.push({
          step: step.name,
          error: error as Error
        });
        
        if (step.onError === 'fail') {
          throw error;
        } else if (step.onError === 'continue') {
          continue;
        } else if (step.onError === 'retry') {
          const result = await pRetry(
            () => this.executeStep(step, context),
            { retries: step.retries || 3 }
          );
          context.results.push(result);
        }
      }
    }
    
    return {
      workflow: workflow.name,
      success: context.errors.length === 0,
      results: context.results,
      errors: context.errors,
      duration: Date.now() - Date.now() // Calculate actual duration
    };
  }
  
  // Execute workflow step
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    switch (step.type) {
      case 'api':
        return await this.executeAPIStep(step, context);
      
      case 'database':
        return await this.executeDatabaseStep(step, context);
      
      case 'event':
        return await this.executeEventStep(step, context);
      
      case 'transform':
        return await this.executeTransformStep(step, context);
      
      case 'conditional':
        return await this.executeConditionalStep(step, context);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  
  // Connect to PostgreSQL
  private async connectPostgreSQL(config: DatabaseConfig): Promise<DatabaseConnection> {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      max: config.poolSize || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    return new PostgreSQLConnection(pool);
  }
  
  // Connect to MongoDB
  private async connectMongoDB(config: DatabaseConfig): Promise<DatabaseConnection> {
    const client = new MongoClient(config.connectionString || 
      `mongodb://${config.username}:${config.password}@${config.host}:${config.port}`);
    
    await client.connect();
    const db = client.db(config.database);
    
    return new MongoDBConnection(client, db);
  }
  
  // Connect to Redis
  private async connectRedis(config: DatabaseConfig): Promise<DatabaseConnection> {
    const redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.database ? parseInt(config.database) : 0,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
    
    return new RedisConnection(redis);
  }
  
  // Start health checking
  private startHealthChecking(): void {
    this.healthChecks.forEach((check, key) => {
      setInterval(async () => {
        try {
          const healthy = await check.check();
          if (!healthy) {
            this.emit('health:unhealthy', { key, check });
          }
        } catch (error) {
          this.emit('health:error', { key, check, error });
        }
      }, check.interval);
    });
  }
  
  // Helper methods for step execution
  private async executeAPIStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const client = this.getAPI(step.api!);
    const params = this.resolveVariables(step.params, context);
    
    return await client.request({
      method: step.method || 'GET',
      path: step.path!,
      data: params.body,
      params: params.query,
      headers: params.headers
    });
  }
  
  private async executeDatabaseStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const db = this.getDatabase(step.database!);
    const params = this.resolveVariables(step.params, context);
    
    return await db.query(step.query!, params);
  }
  
  private async executeEventStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const eventBus = this.getEventBus(step.eventBus!);
    const params = this.resolveVariables(step.params, context);
    
    if (step.operation === 'publish') {
      return await eventBus.publish(step.topic!, params);
    } else {
      return await eventBus.subscribe(step.topic!, (message) => {
        context.variables[step.storeAs!] = message;
      });
    }
  }
  
  private async executeTransformStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const input = this.resolveVariables(step.input, context);
    
    // Execute transformation
    if (step.transform) {
      return step.transform(input);
    }
    
    return input;
  }
  
  private async executeConditionalStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const condition = this.resolveVariables(step.condition, context);
    
    if (this.evaluateCondition(condition)) {
      return await this.executeStep(step.then!, context);
    } else if (step.else) {
      return await this.executeStep(step.else, context);
    }
    
    return null;
  }
  
  private resolveVariables(value: any, context: WorkflowContext): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const varName = value.slice(2, -2).trim();
      return context.variables[varName];
    }
    
    if (typeof value === 'object' && value !== null) {
      const resolved: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        resolved[key] = this.resolveVariables(value[key], context);
      }
      return resolved;
    }
    
    return value;
  }
  
  private evaluateCondition(condition: any): boolean {
    // Simple condition evaluation
    return !!condition;
  }
}

// API Client with resilience
class APIClient {
  private axios: AxiosInstance;
  private circuitBreaker: any;
  private rateLimiter: any;
  private config: APIConfig;
  
  constructor(config: APIConfig) {
    this.config = config;
    
    // Setup axios instance
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {}
    });
    
    // Setup authentication
    this.setupAuth();
    
    // Setup circuit breaker
    this.setupCircuitBreaker();
    
    // Setup rate limiter
    this.setupRateLimiter();
    
    // Setup interceptors
    this.setupInterceptors();
  }
  
  private setupAuth(): void {
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          this.axios.defaults.headers.common['Authorization'] = 
            `Bearer ${this.config.auth.token}`;
          break;
        
        case 'basic':
          const credentials = Buffer.from(
            `${this.config.auth.username}:${this.config.auth.password}`
          ).toString('base64');
          this.axios.defaults.headers.common['Authorization'] = 
            `Basic ${credentials}`;
          break;
        
        case 'apikey':
          if (this.config.auth.header) {
            this.axios.defaults.headers.common[this.config.auth.header] = 
              this.config.auth.key;
          } else {
            this.axios.defaults.params = { 
              ...this.axios.defaults.params,
              api_key: this.config.auth.key 
            };
          }
          break;
        
        case 'oauth2':
          // Implement OAuth2 flow
          break;
      }
    }
  }
  
  private setupCircuitBreaker(): void {
    const options = {
      timeout: this.config.timeout || 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 10
    };
    
    this.circuitBreaker = new CircuitBreaker(
      (config: AxiosRequestConfig) => this.axios.request(config),
      options
    );
    
    this.circuitBreaker.on('open', () => {
      console.log(`⚠️ Circuit breaker opened for ${this.config.name}`);
    });
    
    this.circuitBreaker.on('halfOpen', () => {
      console.log(`🔄 Circuit breaker half-open for ${this.config.name}`);
    });
    
    this.circuitBreaker.on('close', () => {
      console.log(`✅ Circuit breaker closed for ${this.config.name}`);
    });
  }
  
  private setupRateLimiter(): void {
    if (this.config.rateLimit) {
      this.rateLimiter = new RateLimiter({
        tokensPerInterval: this.config.rateLimit.requests,
        interval: this.config.rateLimit.window
      });
    }
  }
  
  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add request ID
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Log request
        console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`);
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        // Log response
        console.log(`⬅️ ${response.status} ${response.config.url}`);
        
        return response;
      },
      async (error) => {
        if (error.response?.status === 429) {
          // Handle rate limiting
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.log(`⏳ Rate limited, retrying after ${retryAfter}s`);
          
          await this.sleep(retryAfter * 1000);
          return this.axios.request(error.config);
        }
        
        if (error.response?.status === 401 && this.config.auth?.refreshToken) {
          // Refresh token and retry
          await this.refreshToken();
          return this.axios.request(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async request(config: RequestConfig): Promise<any> {
    // Wait for rate limiter
    if (this.rateLimiter) {
      await this.rateLimiter.removeTokens(1);
    }
    
    // Execute request through circuit breaker
    const response = await this.circuitBreaker.fire({
      method: config.method,
      url: config.path,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
    
    return response.data;
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      if (this.config.healthCheckPath) {
        await this.request({
          method: 'GET',
          path: this.config.healthCheckPath
        });
      }
      return true;
    } catch {
      return false;
    }
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async refreshToken(): Promise<void> {
    // Implement token refresh logic
  }
}

// Database connections
abstract class DatabaseConnection {
  abstract query(sql: string, params?: any[]): Promise<any>;
  abstract healthCheck(): Promise<boolean>;
  abstract close(): Promise<void>;
}

class PostgreSQLConnection extends DatabaseConnection {
  constructor(private pool: Pool) {
    super();
  }
  
  async query(sql: string, params?: any[]): Promise<any> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}

class MongoDBConnection extends DatabaseConnection {
  constructor(
    private client: MongoClient,
    private db: Db
  ) {
    super();
  }
  
  async query(collection: string, operation: any): Promise<any> {
    const coll = this.db.collection(collection);
    
    switch (operation.type) {
      case 'find':
        return await coll.find(operation.filter).toArray();
      case 'findOne':
        return await coll.findOne(operation.filter);
      case 'insertOne':
        return await coll.insertOne(operation.document);
      case 'updateOne':
        return await coll.updateOne(operation.filter, operation.update);
      case 'deleteOne':
        return await coll.deleteOne(operation.filter);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
  
  async close(): Promise<void> {
    await this.client.close();
  }
}

class RedisConnection extends DatabaseConnection {
  constructor(private redis: Redis) {
    super();
  }
  
  async query(command: string, args?: any[]): Promise<any> {
    return await this.redis.call(command, ...args);
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Event Bus
class EventBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private config: EventBusConfig;
  
  constructor(config: EventBusConfig) {
    this.config = config;
  }
  
  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.config.url);
    this.channel = await this.connection.createChannel();
    
    // Setup error handlers
    this.connection.on('error', (err) => {
      console.error('AMQP connection error:', err);
    });
    
    this.connection.on('close', () => {
      console.log('AMQP connection closed, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    });
  }
  
  async publish(topic: string, message: any): Promise<void> {
    if (!this.channel) throw new Error('Not connected');
    
    await this.channel.assertExchange(topic, 'topic', { durable: true });
    
    this.channel.publish(
      topic,
      '',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
  
  async subscribe(topic: string, handler: (message: any) => void): Promise<void> {
    if (!this.channel) throw new Error('Not connected');
    
    await this.channel.assertExchange(topic, 'topic', { durable: true });
    
    const q = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(q.queue, topic, '#');
    
    this.channel.consume(q.queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        handler(content);
        this.channel!.ack(msg);
      }
    });
  }
  
  async healthCheck(): Promise<boolean> {
    return this.connection !== null && this.channel !== null;
  }
}

// Webhook Handler
class WebhookHandler {
  private config: WebhookConfig;
  private signatures: Map<string, string> = new Map();
  
  constructor(config: WebhookConfig) {
    this.config = config;
  }
  
  async handle(request: WebhookRequest): Promise<WebhookResponse> {
    // Verify signature
    if (this.config.secret && !this.verifySignature(request)) {
      return { status: 401, body: 'Invalid signature' };
    }
    
    // Process webhook
    try {
      const result = await this.config.handler(request.body);
      
      return {
        status: 200,
        body: result
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      return {
        status: 500,
        body: 'Internal server error'
      };
    }
  }
  
  private verifySignature(request: WebhookRequest): boolean {
    // Implement signature verification based on provider
    return true;
  }
  
  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// Type definitions
interface IntegrationConfig {
  apis?: APIConfig[];
  databases?: DatabaseConfig[];
  events?: EventBusConfig[];
  webhooks?: WebhookConfig[];
}

interface APIConfig {
  name: string;
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  rateLimit?: RateLimitConfig;
  healthCheckPath?: string;
  healthCheckInterval?: number;
}

interface AuthConfig {
  type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  header?: string;
  refreshToken?: string;
}

interface RateLimitConfig {
  requests: number;
  window: number;
}

interface DatabaseConfig {
  name: string;
  type: 'postgresql' | 'mongodb' | 'redis';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  poolSize?: number;
  healthCheckInterval?: number;
}

interface EventBusConfig {
  name: string;
  url: string;
  healthCheckInterval?: number;
}

interface WebhookConfig {
  name: string;
  secret?: string;
  handler: (body: any) => Promise<any>;
  healthCheckInterval?: number;
}

interface RequestConfig {
  method: string;
  path: string;
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

interface IntegrationWorkflow {
  name: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  name: string;
  type: 'api' | 'database' | 'event' | 'transform' | 'conditional';
  api?: string;
  database?: string;
  eventBus?: string;
  method?: string;
  path?: string;
  query?: string;
  topic?: string;
  operation?: string;
  params?: any;
  input?: any;
  transform?: (input: any) => any;
  condition?: any;
  then?: WorkflowStep;
  else?: WorkflowStep;
  storeAs?: string;
  onError?: 'fail' | 'continue' | 'retry';
  retries?: number;
}

interface WorkflowContext {
  variables: Record<string, any>;
  results: any[];
  errors: Array<{ step: string; error: Error }>;
}

interface WorkflowResult {
  workflow: string;
  success: boolean;
  results: any[];
  errors: Array<{ step: string; error: Error }>;
  duration: number;
}

interface HealthCheck {
  name: string;
  type: string;
  check: () => Promise<boolean>;
  interval: number;
}

interface WebhookRequest {
  headers: Record<string, string>;
  body: any;
  signature?: string;
}

interface WebhookResponse {
  status: number;
  body: any;
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: API Integration Patterns

```typescript
// exercises/01-api-patterns.ts

/**
 * Exercise 1.1: Multi-Service Orchestration
 * Build a system that:
 * - Calls multiple APIs in parallel
 * - Aggregates responses
 * - Handles partial failures
 * - Implements compensation logic
 * - Provides fallback responses
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: OAuth2 Flow Implementation
 * Implement complete OAuth2 flow:
 * - Authorization code flow
 * - Token refresh
 * - Scope management
 * - Secure token storage
 * - Multi-provider support
 */
export async function exercise1_2() {
  // Your implementation here
}
```

### Exercise Set 2: Event-Driven Patterns

```typescript
// exercises/02-event-patterns.ts

/**
 * Exercise 2.1: Event Sourcing System
 * Build an event sourcing system that:
 * - Stores all state changes as events
 * - Rebuilds state from events
 * - Implements snapshots
 * - Handles event replay
 * - Supports projections
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: Saga Pattern Implementation
 * Create a distributed transaction system:
 * - Implements saga orchestration
 * - Handles compensations
 * - Manages timeouts
 * - Provides idempotency
 * - Tracks transaction state
 */
export async function exercise2_2() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Integration Platform

```typescript
// capstone/integration-platform.ts

interface IntegrationPlatform {
  // API Gateway
  gateway: {
    route(request: Request): Promise<Response>;
    authenticate(token: string): User;
    rateLimit(user: User): boolean;
    transform(data: any, mapping: Mapping): any;
  };
  
  // Service Mesh
  mesh: {
    discover(service: string): ServiceEndpoint;
    loadBalance(endpoints: ServiceEndpoint[]): ServiceEndpoint;
    circuitBreak(service: string): CircuitBreaker;
    trace(request: Request): TraceContext;
  };
  
  // Data Pipeline
  pipeline: {
    ingest(source: DataSource): Stream;
    transform(stream: Stream, transforms: Transform[]): Stream;
    route(stream: Stream, rules: Rule[]): Stream[];
    sink(stream: Stream, destination: Destination): void;
  };
  
  // Workflow Engine
  workflow: {
    define(workflow: WorkflowDefinition): Workflow;
    execute(workflow: Workflow, input: any): Promise<any>;
    monitor(execution: Execution): ExecutionStatus;
    compensate(execution: Execution): Promise<void>;
  };
}

// Requirements:
// 1. Handle 10,000+ requests/second
// 2. Support 100+ external services
// 3. 99.99% uptime SLA
// 4. Sub-second latency
// 5. Automatic failover and recovery
```

---

## 💡 Pro Tips

### Integration Best Practices

1. **Always Use Circuit Breakers**: Prevent cascade failures
2. **Implement Idempotency**: Make operations safe to retry
3. **Version Your APIs**: Support backward compatibility
4. **Monitor Everything**: Track latency, errors, and usage
5. **Plan for Failure**: Every external call can fail

### Common Integration Pitfalls

- **Tight Coupling**: Keep services loosely coupled
- **Chatty Interfaces**: Batch operations when possible
- **Missing Timeouts**: Always set appropriate timeouts
- **Ignoring Rate Limits**: Respect and handle rate limits
- **Poor Error Messages**: Provide actionable error information

---

## 🎓 Final Thoughts

External integrations are where your agents meet reality. Master this phase, and your agents can interact with any system in the world.

**Connect everything, trust nothing! 🔌**