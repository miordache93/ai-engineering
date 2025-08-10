# 🧠 Phase 5: Memory Systems and State Management - Complete Mastery Guide
## Building Intelligent Memory for AI Agents

### 🌟 Phase Overview

Welcome to the cognitive architecture phase! Memory transforms agents from goldfish (forgetting everything) into elephants (never forgetting). You'll learn to build sophisticated memory systems that allow agents to learn, adapt, and maintain context across interactions.

**Duration**: 5-7 days (25-35 hours total)
**Difficulty**: Advanced
**Prerequisites**: Completed Phases 1-4, understanding of data structures and caching

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **Memory Architecture Mastery**
   - Design multi-tier memory systems
   - Implement different memory types
   - Build memory retrieval mechanisms
   - Create memory optimization strategies

2. **Context Management Expertise**
   - Maintain conversation context
   - Handle long-term interactions
   - Implement context switching
   - Design context compression

3. **Learning Systems Proficiency**
   - Build agents that learn from interactions
   - Implement memory consolidation
   - Create feedback loops
   - Design adaptive behaviors

4. **Persistence Skills**
   - Implement durable memory storage
   - Build memory synchronization
   - Handle memory migrations
   - Design backup strategies

---

## 📚 Conceptual Foundation

### The Human Memory Analogy 🧠

Agent memory systems mirror human cognition:

```typescript
interface HumanMemoryAnalogy {
  // Sensory Memory (< 1 second)
  sensory: {
    human: 'Raw sensory input before processing',
    agent: 'Incoming message buffer',
    duration: 'Milliseconds',
    capacity: 'Large but brief'
  };
  
  // Short-term Memory (< 1 minute)
  shortTerm: {
    human: 'Active working memory (7±2 items)',
    agent: 'Current conversation context',
    duration: 'Current session',
    capacity: 'Limited (5-10 messages)'
  };
  
  // Long-term Memory (permanent)
  longTerm: {
    episodic: {
      human: 'Specific events and experiences',
      agent: 'Past conversations and interactions'
    },
    semantic: {
      human: 'Facts and general knowledge',
      agent: 'Knowledge base and learned patterns'
    },
    procedural: {
      human: 'How to do things',
      agent: 'Learned workflows and strategies'
    }
  };
  
  // Memory Processes
  processes: {
    encoding: 'Information → Memory',
    storage: 'Maintaining information',
    retrieval: 'Memory → Working use',
    consolidation: 'Short-term → Long-term',
    forgetting: 'Removing irrelevant information'
  };
}
```

### Memory Access Patterns 🔄

```typescript
interface MemoryAccessPatterns {
  // Sequential Access
  sequential: {
    pattern: 'Read memories in order',
    useCase: 'Conversation history',
    performance: 'O(n)',
    example: 'Chat history replay'
  };
  
  // Random Access
  random: {
    pattern: 'Direct memory lookup',
    useCase: 'Fact retrieval',
    performance: 'O(1) with indexing',
    example: 'User preferences lookup'
  };
  
  // Associative Access
  associative: {
    pattern: 'Content-based retrieval',
    useCase: 'Similar memory search',
    performance: 'O(n) or O(log n) with indexing',
    example: 'Find similar past interactions'
  };
  
  // Temporal Access
  temporal: {
    pattern: 'Time-based retrieval',
    useCase: 'Recent events',
    performance: 'O(log n) with time indexing',
    example: 'Last week\'s conversations'
  };
}
```

---

## 🏗️ Part 1: Memory System Architecture

### 1.1 Complete Memory Framework

```typescript
// src/memory/memory-system.ts
import { EventEmitter } from 'events';
import { VectorStore } from 'langchain/vectorstores/base';
import { Document } from 'langchain/document';
import crypto from 'crypto';

// Base memory interface
export interface Memory {
  id: string;
  type: MemoryType;
  content: any;
  metadata: MemoryMetadata;
  embeddings?: number[];
  timestamp: Date;
  accessCount: number;
  lastAccessed?: Date;
  importance: number;
  associations: string[];
}

export interface MemoryMetadata {
  source: string;
  context?: any;
  tags?: string[];
  userId?: string;
  sessionId?: string;
  agentId?: string;
  confidence?: number;
}

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
  SENSORY = 'sensory'
}

// Advanced Memory System
export class MemorySystem extends EventEmitter {
  // Memory stores
  private sensoryBuffer: Memory[] = [];
  private workingMemory: Map<string, Memory> = new Map();
  private episodicMemory: Map<string, Memory> = new Map();
  private semanticMemory: Map<string, Memory> = new Map();
  private proceduralMemory: Map<string, Memory> = new Map();
  
  // Indexes for fast retrieval
  private temporalIndex: Map<number, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private userIndex: Map<string, Set<string>> = new Map();
  
  // Vector store for similarity search
  private vectorStore?: VectorStore;
  
  // Configuration
  private config: MemoryConfig;
  
  constructor(config: MemoryConfig) {
    super();
    this.config = config;
    this.startMaintenanceLoop();
  }
  
  // Store new memory
  async store(memory: Partial<Memory>): Promise<string> {
    const fullMemory: Memory = {
      id: memory.id || this.generateId(),
      type: memory.type || MemoryType.EPISODIC,
      content: memory.content,
      metadata: memory.metadata || {},
      timestamp: memory.timestamp || new Date(),
      accessCount: 0,
      importance: memory.importance || this.calculateImportance(memory),
      associations: memory.associations || []
    };
    
    // Route to appropriate store
    switch (fullMemory.type) {
      case MemoryType.SENSORY:
        this.storeSensory(fullMemory);
        break;
      case MemoryType.WORKING:
        this.storeWorking(fullMemory);
        break;
      case MemoryType.EPISODIC:
        await this.storeEpisodic(fullMemory);
        break;
      case MemoryType.SEMANTIC:
        await this.storeSemantic(fullMemory);
        break;
      case MemoryType.PROCEDURAL:
        this.storeProcedural(fullMemory);
        break;
    }
    
    // Update indexes
    this.updateIndexes(fullMemory);
    
    // Emit event
    this.emit('memory:stored', fullMemory);
    
    return fullMemory.id;
  }
  
  // Retrieve memory by ID
  async retrieve(id: string): Promise<Memory | null> {
    // Check all stores
    const memory = 
      this.workingMemory.get(id) ||
      this.episodicMemory.get(id) ||
      this.semanticMemory.get(id) ||
      this.proceduralMemory.get(id);
    
    if (memory) {
      // Update access metadata
      memory.accessCount++;
      memory.lastAccessed = new Date();
      
      // Move to working memory if frequently accessed
      if (memory.accessCount > this.config.workingMemoryThreshold) {
        this.promoteToWorking(memory);
      }
      
      this.emit('memory:accessed', memory);
      return memory;
    }
    
    return null;
  }
  
  // Search memories
  async search(query: MemoryQuery): Promise<Memory[]> {
    let results: Memory[] = [];
    
    // Type-based filtering
    const stores = this.getStoresForTypes(query.types);
    stores.forEach(store => {
      results.push(...Array.from(store.values()));
    });
    
    // Apply filters
    if (query.filters) {
      results = this.applyFilters(results, query.filters);
    }
    
    // Temporal filtering
    if (query.timeRange) {
      results = this.filterByTime(results, query.timeRange);
    }
    
    // Tag filtering
    if (query.tags) {
      results = this.filterByTags(results, query.tags);
    }
    
    // Similarity search
    if (query.similar && this.vectorStore) {
      results = await this.findSimilar(query.similar, results);
    }
    
    // Sort and limit
    results = this.sortMemories(results, query.sortBy || 'relevance');
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }
  
  // Store methods for different memory types
  
  private storeSensory(memory: Memory): void {
    this.sensoryBuffer.push(memory);
    
    // Sensory memory decays quickly
    setTimeout(() => {
      const index = this.sensoryBuffer.indexOf(memory);
      if (index > -1) {
        this.sensoryBuffer.splice(index, 1);
        
        // Decide if it should be promoted
        if (this.shouldPromote(memory)) {
          memory.type = MemoryType.WORKING;
          this.storeWorking(memory);
        }
      }
    }, this.config.sensoryDecayTime);
  }
  
  private storeWorking(memory: Memory): void {
    this.workingMemory.set(memory.id, memory);
    
    // Maintain working memory size
    if (this.workingMemory.size > this.config.workingMemorySize) {
      this.evictFromWorking();
    }
  }
  
  private async storeEpisodic(memory: Memory): Promise<void> {
    this.episodicMemory.set(memory.id, memory);
    
    // Generate embeddings for similarity search
    if (this.vectorStore) {
      const doc = new Document({
        pageContent: JSON.stringify(memory.content),
        metadata: { ...memory.metadata, memoryId: memory.id }
      });
      await this.vectorStore.addDocuments([doc]);
    }
    
    // Consolidate old episodic memories
    if (this.episodicMemory.size > this.config.maxEpisodicMemories) {
      await this.consolidateEpisodic();
    }
  }
  
  private async storeSemantic(memory: Memory): Promise<void> {
    // Check for duplicates or merge with existing
    const existing = await this.findSimilarSemantic(memory);
    
    if (existing && this.shouldMerge(existing, memory)) {
      this.mergeSemanticMemories(existing, memory);
    } else {
      this.semanticMemory.set(memory.id, memory);
      
      // Add to vector store
      if (this.vectorStore) {
        const doc = new Document({
          pageContent: JSON.stringify(memory.content),
          metadata: { ...memory.metadata, memoryId: memory.id }
        });
        await this.vectorStore.addDocuments([doc]);
      }
    }
  }
  
  private storeProcedural(memory: Memory): void {
    this.proceduralMemory.set(memory.id, memory);
    
    // Procedural memories are often patterns/workflows
    this.analyzeAndOptimizeProcedure(memory);
  }
  
  // Memory consolidation (like sleep in humans)
  async consolidate(): Promise<void> {
    console.log('🧠 Consolidating memories...');
    
    // Move important working memories to long-term
    for (const [id, memory] of this.workingMemory) {
      if (memory.importance > this.config.consolidationThreshold) {
        memory.type = MemoryType.EPISODIC;
        await this.storeEpisodic(memory);
        this.workingMemory.delete(id);
      }
    }
    
    // Compress episodic memories into semantic
    await this.consolidateEpisodic();
    
    // Optimize procedural memories
    this.optimizeProcedural();
    
    // Clean up old, unimportant memories
    this.forgetUnimportant();
    
    this.emit('memory:consolidated');
  }
  
  // Consolidate episodic to semantic
  private async consolidateEpisodic(): Promise<void> {
    const oldMemories = Array.from(this.episodicMemory.values())
      .filter(m => this.isOld(m) && m.importance < this.config.semanticThreshold);
    
    // Group by similarity
    const groups = await this.clusterMemories(oldMemories);
    
    // Create semantic memories from clusters
    for (const group of groups) {
      if (group.length > this.config.minClusterSize) {
        const semantic = this.extractSemanticKnowledge(group);
        semantic.type = MemoryType.SEMANTIC;
        await this.storeSemantic(semantic);
        
        // Remove consolidated episodic memories
        group.forEach(m => this.episodicMemory.delete(m.id));
      }
    }
  }
  
  // Extract patterns from episodic memories
  private extractSemanticKnowledge(memories: Memory[]): Memory {
    // Find common patterns
    const patterns = this.findPatterns(memories);
    
    // Extract key facts
    const facts = this.extractFacts(memories);
    
    // Calculate aggregate importance
    const importance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;
    
    return {
      id: this.generateId(),
      type: MemoryType.SEMANTIC,
      content: {
        patterns,
        facts,
        sourceCount: memories.length,
        confidence: this.calculateConfidence(memories)
      },
      metadata: {
        source: 'consolidation',
        originalIds: memories.map(m => m.id),
        consolidatedAt: new Date().toISOString()
      },
      timestamp: new Date(),
      accessCount: 0,
      importance,
      associations: this.mergeAssociations(memories)
    };
  }
  
  // Memory retrieval strategies
  
  async retrieveContext(sessionId: string, limit: number = 10): Promise<Memory[]> {
    // Get recent memories from this session
    const sessionMemories = await this.search({
      filters: { sessionId },
      sortBy: 'recency',
      limit: limit * 2
    });
    
    // Get related semantic memories
    const semanticMemories = await this.getRelatedSemantic(sessionMemories);
    
    // Get relevant procedural memories
    const proceduralMemories = this.getRelevantProcedures(sessionMemories);
    
    // Combine and rank
    const combined = [...sessionMemories, ...semanticMemories, ...proceduralMemories];
    return this.rankByRelevance(combined, sessionId).slice(0, limit);
  }
  
  // Associative retrieval
  async retrieveAssociated(memoryId: string, depth: number = 1): Promise<Memory[]> {
    const memory = await this.retrieve(memoryId);
    if (!memory) return [];
    
    const associated = new Set<Memory>();
    const visited = new Set<string>();
    
    const explore = async (mem: Memory, currentDepth: number) => {
      if (currentDepth > depth || visited.has(mem.id)) return;
      visited.add(mem.id);
      
      for (const assocId of mem.associations) {
        const assocMemory = await this.retrieve(assocId);
        if (assocMemory) {
          associated.add(assocMemory);
          await explore(assocMemory, currentDepth + 1);
        }
      }
    };
    
    await explore(memory, 0);
    return Array.from(associated);
  }
  
  // Memory modification
  
  async update(id: string, updates: Partial<Memory>): Promise<void> {
    const memory = await this.retrieve(id);
    if (!memory) throw new Error(`Memory ${id} not found`);
    
    // Create new version
    const updated = { ...memory, ...updates };
    
    // Store in appropriate location
    await this.store(updated);
    
    // Keep version history
    this.storeVersion(memory, updated);
    
    this.emit('memory:updated', { old: memory, new: updated });
  }
  
  async forget(id: string): Promise<void> {
    // Remove from all stores
    this.workingMemory.delete(id);
    this.episodicMemory.delete(id);
    this.semanticMemory.delete(id);
    this.proceduralMemory.delete(id);
    
    // Remove from indexes
    this.removeFromIndexes(id);
    
    this.emit('memory:forgotten', id);
  }
  
  // Importance calculation
  private calculateImportance(memory: Partial<Memory>): number {
    let importance = 0.5; // Base importance
    
    // Factors that increase importance
    if (memory.metadata?.confidence) {
      importance += memory.metadata.confidence * 0.2;
    }
    
    if (memory.associations && memory.associations.length > 0) {
      importance += Math.min(memory.associations.length * 0.1, 0.3);
    }
    
    if (memory.type === MemoryType.PROCEDURAL) {
      importance += 0.2; // Procedures are generally important
    }
    
    // Recency boost
    const age = Date.now() - (memory.timestamp?.getTime() || Date.now());
    const recencyBoost = Math.max(0, 1 - age / (24 * 60 * 60 * 1000)); // Decay over 24 hours
    importance += recencyBoost * 0.2;
    
    return Math.min(1, importance);
  }
  
  // Helper methods
  
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
  
  private shouldPromote(memory: Memory): boolean {
    return memory.importance > this.config.promotionThreshold;
  }
  
  private evictFromWorking(): void {
    // LRU eviction
    let oldest: Memory | null = null;
    let oldestAccess = Date.now();
    
    for (const memory of this.workingMemory.values()) {
      const lastAccess = memory.lastAccessed?.getTime() || memory.timestamp.getTime();
      if (lastAccess < oldestAccess) {
        oldest = memory;
        oldestAccess = lastAccess;
      }
    }
    
    if (oldest) {
      this.workingMemory.delete(oldest.id);
      
      // Move to episodic if important
      if (oldest.importance > this.config.preservationThreshold) {
        oldest.type = MemoryType.EPISODIC;
        this.storeEpisodic(oldest);
      }
    }
  }
  
  private updateIndexes(memory: Memory): void {
    // Temporal index
    const hour = Math.floor(memory.timestamp.getTime() / (60 * 60 * 1000));
    if (!this.temporalIndex.has(hour)) {
      this.temporalIndex.set(hour, new Set());
    }
    this.temporalIndex.get(hour)!.add(memory.id);
    
    // Tag index
    if (memory.metadata.tags) {
      memory.metadata.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(memory.id);
      });
    }
    
    // User index
    if (memory.metadata.userId) {
      if (!this.userIndex.has(memory.metadata.userId)) {
        this.userIndex.set(memory.metadata.userId, new Set());
      }
      this.userIndex.get(memory.metadata.userId)!.add(memory.id);
    }
  }
  
  private removeFromIndexes(id: string): void {
    // Remove from all indexes
    this.temporalIndex.forEach(set => set.delete(id));
    this.tagIndex.forEach(set => set.delete(id));
    this.userIndex.forEach(set => set.delete(id));
  }
  
  // Maintenance loop
  private startMaintenanceLoop(): void {
    setInterval(async () => {
      // Consolidate memories
      if (this.shouldConsolidate()) {
        await this.consolidate();
      }
      
      // Clean up old memories
      this.cleanupOldMemories();
      
      // Optimize indexes
      this.optimizeIndexes();
      
    }, this.config.maintenanceInterval);
  }
  
  private shouldConsolidate(): boolean {
    const memoryPressure = 
      this.workingMemory.size / this.config.workingMemorySize +
      this.episodicMemory.size / this.config.maxEpisodicMemories;
    
    return memoryPressure > 0.8;
  }
  
  private cleanupOldMemories(): void {
    const now = Date.now();
    const maxAge = this.config.maxMemoryAge;
    
    // Clean up old episodic memories
    for (const [id, memory] of this.episodicMemory) {
      if (now - memory.timestamp.getTime() > maxAge && memory.importance < 0.3) {
        this.forget(id);
      }
    }
  }
  
  private optimizeIndexes(): void {
    // Remove empty index entries
    this.temporalIndex.forEach((set, key) => {
      if (set.size === 0) {
        this.temporalIndex.delete(key);
      }
    });
    
    this.tagIndex.forEach((set, key) => {
      if (set.size === 0) {
        this.tagIndex.delete(key);
      }
    });
  }
  
  // Additional helper methods would go here...
  private getStoresForTypes(types?: MemoryType[]): Map<string, Memory>[] {
    // Implementation
    return [];
  }
  
  private applyFilters(memories: Memory[], filters: any): Memory[] {
    // Implementation
    return memories;
  }
  
  private filterByTime(memories: Memory[], timeRange: any): Memory[] {
    // Implementation
    return memories;
  }
  
  private filterByTags(memories: Memory[], tags: string[]): Memory[] {
    // Implementation
    return memories;
  }
  
  private async findSimilar(query: string, candidates: Memory[]): Promise<Memory[]> {
    // Implementation
    return candidates;
  }
  
  private sortMemories(memories: Memory[], sortBy: string): Memory[] {
    // Implementation
    return memories;
  }
  
  private isOld(memory: Memory): boolean {
    // Implementation
    return false;
  }
  
  private async clusterMemories(memories: Memory[]): Promise<Memory[][]> {
    // Implementation
    return [memories];
  }
  
  private findPatterns(memories: Memory[]): any {
    // Implementation
    return {};
  }
  
  private extractFacts(memories: Memory[]): any {
    // Implementation
    return {};
  }
  
  private calculateConfidence(memories: Memory[]): number {
    // Implementation
    return 0.5;
  }
  
  private mergeAssociations(memories: Memory[]): string[] {
    // Implementation
    return [];
  }
  
  private async findSimilarSemantic(memory: Memory): Promise<Memory | null> {
    // Implementation
    return null;
  }
  
  private shouldMerge(existing: Memory, new: Memory): boolean {
    // Implementation
    return false;
  }
  
  private mergeSemanticMemories(existing: Memory, new: Memory): void {
    // Implementation
  }
  
  private analyzeAndOptimizeProcedure(memory: Memory): void {
    // Implementation
  }
  
  private optimizeProcedural(): void {
    // Implementation
  }
  
  private forgetUnimportant(): void {
    // Implementation
  }
  
  private promoteToWorking(memory: Memory): void {
    // Implementation
  }
  
  private async getRelatedSemantic(memories: Memory[]): Promise<Memory[]> {
    // Implementation
    return [];
  }
  
  private getRelevantProcedures(memories: Memory[]): Memory[] {
    // Implementation
    return [];
  }
  
  private rankByRelevance(memories: Memory[], context: string): Memory[] {
    // Implementation
    return memories;
  }
  
  private storeVersion(old: Memory, new: Memory): void {
    // Implementation
  }
}

// Configuration interface
interface MemoryConfig {
  workingMemorySize: number;
  workingMemoryThreshold: number;
  maxEpisodicMemories: number;
  sensoryDecayTime: number;
  consolidationThreshold: number;
  semanticThreshold: number;
  minClusterSize: number;
  promotionThreshold: number;
  preservationThreshold: number;
  maintenanceInterval: number;
  maxMemoryAge: number;
}

// Query interface
interface MemoryQuery {
  types?: MemoryType[];
  filters?: any;
  timeRange?: { start: Date; end: Date };
  tags?: string[];
  similar?: string;
  sortBy?: 'relevance' | 'recency' | 'importance' | 'access';
  limit?: number;
}
```

### 1.2 Conversation Memory Management

```typescript
// src/memory/conversation-memory.ts
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { MemorySystem, Memory, MemoryType } from './memory-system';

export class ConversationMemory {
  private memorySystem: MemorySystem;
  private conversations: Map<string, Conversation> = new Map();
  private summaries: Map<string, string> = new Map();
  
  constructor(memorySystem: MemorySystem) {
    this.memorySystem = memorySystem;
  }
  
  // Start a new conversation
  startConversation(conversationId: string, metadata?: any): void {
    const conversation: Conversation = {
      id: conversationId,
      messages: [],
      startedAt: new Date(),
      metadata: metadata || {},
      summary: null,
      topics: [],
      participants: []
    };
    
    this.conversations.set(conversationId, conversation);
    
    // Store as episodic memory
    this.memorySystem.store({
      type: MemoryType.EPISODIC,
      content: {
        event: 'conversation_started',
        conversationId
      },
      metadata: {
        ...metadata,
        sessionId: conversationId
      }
    });
  }
  
  // Add message to conversation
  async addMessage(
    conversationId: string,
    message: BaseMessage,
    metadata?: any
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    // Add to conversation
    conversation.messages.push(message);
    conversation.lastMessageAt = new Date();
    
    // Store in memory system
    await this.memorySystem.store({
      type: MemoryType.WORKING,
      content: {
        message: message.content,
        role: this.getMessageRole(message)
      },
      metadata: {
        conversationId,
        messageIndex: conversation.messages.length - 1,
        ...metadata
      },
      importance: this.calculateMessageImportance(message, conversation)
    });
    
    // Update conversation summary if needed
    if (conversation.messages.length % 10 === 0) {
      await this.updateSummary(conversationId);
    }
    
    // Extract and store entities
    await this.extractEntities(message, conversationId);
    
    // Detect topic changes
    this.detectTopicChange(conversation, message);
  }
  
  // Get conversation context
  async getContext(
    conversationId: string,
    maxMessages: number = 10
  ): Promise<ConversationContext> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    // Get recent messages
    const recentMessages = conversation.messages.slice(-maxMessages);
    
    // Get summary if conversation is long
    let summary: string | null = null;
    if (conversation.messages.length > maxMessages) {
      summary = await this.getSummary(conversationId);
    }
    
    // Get related memories
    const relatedMemories = await this.memorySystem.search({
      filters: { conversationId },
      types: [MemoryType.SEMANTIC, MemoryType.EPISODIC],
      limit: 5
    });
    
    // Get relevant procedural knowledge
    const procedures = await this.getRelevantProcedures(conversation);
    
    return {
      conversationId,
      messages: recentMessages,
      summary,
      relatedMemories,
      procedures,
      topics: conversation.topics,
      metadata: conversation.metadata
    };
  }
  
  // Summarize conversation
  private async updateSummary(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;
    
    // Use LLM to generate summary
    const summary = await this.generateSummary(conversation.messages);
    
    conversation.summary = summary;
    this.summaries.set(conversationId, summary);
    
    // Store summary as semantic memory
    await this.memorySystem.store({
      type: MemoryType.SEMANTIC,
      content: {
        summary,
        messageCount: conversation.messages.length,
        topics: conversation.topics
      },
      metadata: {
        conversationId,
        source: 'conversation_summary'
      },
      importance: 0.7
    });
  }
  
  // Extract entities from messages
  private async extractEntities(
    message: BaseMessage,
    conversationId: string
  ): Promise<void> {
    // Simple entity extraction - in production, use NER
    const entities = this.simpleEntityExtraction(message.content.toString());
    
    for (const entity of entities) {
      await this.memorySystem.store({
        type: MemoryType.SEMANTIC,
        content: entity,
        metadata: {
          conversationId,
          source: 'entity_extraction',
          entityType: entity.type
        },
        importance: 0.5
      });
    }
  }
  
  // Detect topic changes
  private detectTopicChange(
    conversation: Conversation,
    message: BaseMessage
  ): void {
    // Simple topic detection - in production, use topic modeling
    const topics = this.extractTopics(message.content.toString());
    
    topics.forEach(topic => {
      if (!conversation.topics.includes(topic)) {
        conversation.topics.push(topic);
        
        // Store topic change as episodic memory
        this.memorySystem.store({
          type: MemoryType.EPISODIC,
          content: {
            event: 'topic_introduced',
            topic,
            conversationId: conversation.id
          },
          metadata: {
            conversationId: conversation.id,
            timestamp: new Date()
          }
        });
      }
    });
  }
  
  // Helper methods
  
  private getMessageRole(message: BaseMessage): string {
    if (message instanceof HumanMessage) return 'human';
    if (message instanceof AIMessage) return 'assistant';
    if (message instanceof SystemMessage) return 'system';
    return 'unknown';
  }
  
  private calculateMessageImportance(
    message: BaseMessage,
    conversation: Conversation
  ): number {
    let importance = 0.5;
    
    // Questions are more important
    if (message.content.toString().includes('?')) {
      importance += 0.2;
    }
    
    // First messages are important
    if (conversation.messages.length < 5) {
      importance += 0.2;
    }
    
    // Messages with entities are important
    const entities = this.simpleEntityExtraction(message.content.toString());
    if (entities.length > 0) {
      importance += 0.1 * Math.min(entities.length, 3);
    }
    
    return Math.min(1, importance);
  }
  
  private async generateSummary(messages: BaseMessage[]): Promise<string> {
    // In production, use LLM to generate summary
    const messageCount = messages.length;
    const topics = new Set<string>();
    
    messages.forEach(msg => {
      this.extractTopics(msg.content.toString()).forEach(t => topics.add(t));
    });
    
    return `Conversation with ${messageCount} messages covering topics: ${Array.from(topics).join(', ')}`;
  }
  
  private simpleEntityExtraction(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Extract emails
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emails) {
      emails.forEach(email => {
        entities.push({ type: 'email', value: email });
      });
    }
    
    // Extract numbers
    const numbers = text.match(/\b\d+\b/g);
    if (numbers) {
      numbers.forEach(num => {
        entities.push({ type: 'number', value: num });
      });
    }
    
    // Extract capitalized words (potential names)
    const names = text.match(/\b[A-Z][a-z]+\b/g);
    if (names) {
      names.forEach(name => {
        entities.push({ type: 'name', value: name });
      });
    }
    
    return entities;
  }
  
  private extractTopics(text: string): string[] {
    // Simple keyword extraction - in production, use proper NLP
    const words = text.toLowerCase().split(/\s+/);
    const stopwords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an']);
    
    return words
      .filter(word => word.length > 4 && !stopwords.has(word))
      .slice(0, 3);
  }
  
  private async getSummary(conversationId: string): Promise<string | null> {
    return this.summaries.get(conversationId) || null;
  }
  
  private async getRelevantProcedures(conversation: Conversation): Promise<Memory[]> {
    // Get procedural memories relevant to the conversation
    return this.memorySystem.search({
      types: [MemoryType.PROCEDURAL],
      tags: conversation.topics,
      limit: 3
    });
  }
}

// Type definitions
interface Conversation {
  id: string;
  messages: BaseMessage[];
  startedAt: Date;
  lastMessageAt?: Date;
  metadata: any;
  summary: string | null;
  topics: string[];
  participants: string[];
}

interface ConversationContext {
  conversationId: string;
  messages: BaseMessage[];
  summary: string | null;
  relatedMemories: Memory[];
  procedures: Memory[];
  topics: string[];
  metadata: any;
}

interface Entity {
  type: string;
  value: string;
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: Memory Architecture

```typescript
// exercises/01-memory-architecture.ts

/**
 * Exercise 1.1: Hierarchical Memory System
 * Build a memory system with:
 * - L1 Cache (immediate, 10 items)
 * - L2 Cache (recent, 100 items)
 * - L3 Storage (historical, unlimited)
 * - Automatic promotion/demotion
 * - < 10ms retrieval for L1
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: Distributed Memory
 * Implement memory across multiple agents:
 * - Shared memory pool
 * - Agent-specific memories
 * - Memory synchronization
 * - Conflict resolution
 * - Consistency guarantees
 */
export async function exercise1_2() {
  // Your implementation here
}

/**
 * Exercise 1.3: Memory Compression
 * Create compression strategies:
 * - Summarize old conversations
 * - Merge similar memories
 * - Extract key facts
 * - Maintain retrieval quality
 * - 10x compression ratio
 */
export async function exercise1_3() {
  // Your implementation here
}
```

### Exercise Set 2: Learning Systems

```typescript
// exercises/02-learning-systems.ts

/**
 * Exercise 2.1: Pattern Learning
 * Build an agent that learns patterns:
 * - Identify repeated interactions
 * - Extract common workflows
 * - Predict user needs
 * - Adapt responses
 * - Measure improvement
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: Preference Learning
 * Implement preference tracking:
 * - User preference detection
 * - Preference evolution
 * - Conflicting preference handling
 * - Preference prediction
 * - Personalization
 */
export async function exercise2_2() {
  // Your implementation here
}

/**
 * Exercise 2.3: Mistake Learning
 * Create a system that learns from errors:
 * - Error detection
 * - Root cause analysis
 * - Solution memory
 * - Prevention strategies
 * - Success metrics
 */
export async function exercise2_3() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Cognitive Agent System

```typescript
// capstone/cognitive-agent.ts

interface CognitiveAgent {
  // Memory Systems
  memory: {
    shortTerm: WorkingMemory;
    longTerm: LongTermMemory;
    episodic: EpisodicMemory;
    semantic: SemanticMemory;
    procedural: ProceduralMemory;
  };
  
  // Learning Capabilities
  learning: {
    learnFromInteraction(interaction: Interaction): void;
    extractPatterns(history: Memory[]): Pattern[];
    updateBeliefs(evidence: Evidence): void;
    optimizeStrategies(feedback: Feedback): void;
  };
  
  // Cognitive Functions
  cognitive: {
    reason(context: Context): Reasoning;
    plan(goal: Goal): Plan;
    decide(options: Option[]): Decision;
    reflect(experience: Experience): Insight;
  };
  
  // Adaptation
  adaptation: {
    personalizeForUser(userId: string): void;
    adjustToContext(context: Context): void;
    evolveCapabilities(time: Date): void;
  };
}

// Requirements:
// 1. Remember 1000+ conversations
// 2. Learn from every interaction
// 3. Personalize for each user
// 4. Improve over time
// 5. Explain its reasoning
```

---

## 💡 Pro Tips

### Memory Best Practices

1. **Layer Your Memory**: Use multiple tiers for performance
2. **Index Everything**: Fast retrieval is crucial
3. **Compress Aggressively**: Storage is cheap, but retrieval isn't
4. **Version Control**: Keep memory history for debugging
5. **Monitor Usage**: Track what memories are actually used

---

## 🎓 Final Thoughts

Memory transforms agents from reactive systems into intelligent beings with history, context, and the ability to learn. Master this phase, and your agents will feel truly alive.

**Give your agents the gift of memory, and watch them evolve! 🧠**