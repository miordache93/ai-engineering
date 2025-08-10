# 🔍 Phase 2: RAG and Vector Stores - Complete Mastery Guide
## Building Knowledge-Powered AI Agents

### 🌟 Phase Overview

Welcome to the heart of modern AI applications! RAG (Retrieval-Augmented Generation) is like giving your AI agent a perfect memory and a vast library. Instead of hallucinating information, your agent will ground its responses in real knowledge. Think of it as the difference between someone guessing answers versus someone who actually looks things up in authoritative sources.

**Duration**: 7-10 days (30-40 hours total)
**Difficulty**: Intermediate
**Prerequisites**: Completed Phase 1, basic understanding of vectors

---

## 🎓 Learning Objectives

By the end of this phase, you will:

1. **RAG Architecture Mastery**
   - Understand the complete RAG pipeline
   - Design efficient retrieval systems
   - Implement multiple RAG patterns
   - Optimize for accuracy and speed

2. **Vector Database Expertise**
   - Master embedding concepts
   - Build and query vector stores
   - Implement similarity search algorithms
   - Optimize index structures

3. **Document Processing Proficiency**
   - Process multiple document formats
   - Implement intelligent chunking strategies
   - Extract and preserve metadata
   - Handle large-scale ingestion

4. **Retrieval Optimization**
   - Implement reranking algorithms
   - Build hybrid search systems
   - Optimize retrieval accuracy
   - Minimize latency

---

## 📚 Conceptual Foundation

### Understanding RAG: The Library Analogy 📚

Imagine you're a brilliant librarian with three superpowers:

```typescript
interface RAGLibrarian {
  // Power 1: Instantly organize any book
  indexing: {
    action: 'Read book → Extract key concepts → Create index cards',
    realWorld: 'Document → Embeddings → Vector storage',
    benefit: 'Lightning-fast retrieval'
  };
  
  // Power 2: Find relevant information instantly
  retrieval: {
    action: 'Hear question → Find related index cards → Gather books',
    realWorld: 'Query → Vector search → Return chunks',
    benefit: 'Precise, relevant information'
  };
  
  // Power 3: Synthesize perfect answers
  generation: {
    action: 'Read gathered books → Create comprehensive answer',
    realWorld: 'Context + Query → LLM → Grounded response',
    benefit: 'Accurate, cited responses'
  };
}
```

### The Mathematics of Similarity 🔢

Understanding embeddings is crucial:

```typescript
// Embeddings transform text into mathematical space
interface EmbeddingConcept {
  // Text becomes numbers
  transformation: 'Hello world' → [0.1, -0.3, 0.7, ...]; // 1536 dimensions
  
  // Similar meanings = nearby vectors
  similarity: {
    'cat': [0.2, 0.5, -0.1, ...],
    'kitten': [0.21, 0.48, -0.09, ...], // Very close!
    'dog': [0.3, 0.4, -0.2, ...],        // Somewhat close
    'airplane': [-0.5, 0.1, 0.8, ...]    // Far away
  };
  
  // Distance metrics
  measurements: {
    cosine: 'Angle between vectors (most common)',
    euclidean: 'Straight-line distance',
    dotProduct: 'Magnitude and direction'
  };
}
```

---

## 🏗️ Part 1: Building Your First RAG System

### 1.1 Complete RAG Architecture

```typescript
// src/rag/architecture.ts
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// The Complete RAG Pipeline
export class RAGPipeline {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore;
  private splitter: RecursiveCharacterTextSplitter;
  
  constructor() {
    // Initialize embeddings model
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small', // 1536 dimensions, fast & cheap
      // model: 'text-embedding-3-large', // 3072 dimensions, more accurate
    });
    
    // Configure text splitter
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,        // Characters per chunk
      chunkOverlap: 200,      // Overlap to preserve context
      separators: [           // Split priorities
        '\n\n',  // Paragraphs
        '\n',    // Lines
        '. ',    // Sentences
        ', ',    // Clauses
        ' ',     // Words
        ''       // Characters
      ]
    });
  }
  
  // Step 1: Document Ingestion
  async ingest(documents: Document[]): Promise<void> {
    console.log(`📥 Ingesting ${documents.length} documents...`);
    
    // Split documents into chunks
    const chunks = await this.splitter.splitDocuments(documents);
    console.log(`✂️ Created ${chunks.length} chunks`);
    
    // Add metadata to each chunk
    const enrichedChunks = chunks.map((chunk, index) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        chunkIndex: index,
        chunkSize: chunk.pageContent.length,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Create vector store from chunks
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      enrichedChunks,
      this.embeddings
    );
    
    console.log(`✅ Vector store created with ${chunks.length} vectors`);
  }
  
  // Step 2: Retrieval
  async retrieve(query: string, k: number = 5): Promise<Document[]> {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Perform similarity search
    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      k
    );
    
    // Log relevance scores
    results.forEach(([doc, score], index) => {
      console.log(`  ${index + 1}. Score: ${score.toFixed(3)} - ${doc.metadata.source}`);
    });
    
    // Return documents sorted by relevance
    return results.map(([doc]) => doc);
  }
  
  // Step 3: Advanced Retrieval with MMR
  async retrieveMMR(query: string, k: number = 5): Promise<Document[]> {
    // Maximum Marginal Relevance - balances relevance and diversity
    const results = await this.vectorStore.maxMarginalRelevanceSearch(
      query,
      {
        k,
        fetchK: k * 4,       // Fetch more initially
        lambda: 0.5          // Balance relevance vs diversity
      }
    );
    
    return results;
  }
  
  // Step 4: Contextual Compression
  async retrieveWithCompression(query: string, k: number = 5): Promise<string> {
    const docs = await this.retrieve(query, k);
    
    // Compress retrieved context
    const compressedContext = this.compressContext(docs, query);
    
    return compressedContext;
  }
  
  private compressContext(docs: Document[], query: string): string {
    // Simple compression: extract most relevant sentences
    const sentences: Array<{ text: string; relevance: number }> = [];
    
    docs.forEach(doc => {
      const docSentences = doc.pageContent.split('. ');
      docSentences.forEach(sentence => {
        // Calculate relevance (simplified)
        const relevance = this.calculateRelevance(sentence, query);
        sentences.push({ text: sentence, relevance });
      });
    });
    
    // Sort by relevance and take top sentences
    return sentences
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(s => s.text)
      .join('. ');
  }
  
  private calculateRelevance(sentence: string, query: string): number {
    // Simple keyword overlap (in production, use embeddings)
    const queryWords = query.toLowerCase().split(' ');
    const sentenceWords = sentence.toLowerCase().split(' ');
    
    const overlap = queryWords.filter(word => 
      sentenceWords.includes(word)
    ).length;
    
    return overlap / queryWords.length;
  }
}
```

### 1.2 Document Processing Deep Dive

```typescript
// src/rag/document-processing.ts
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import csv from 'csv-parser';
import { Document } from 'langchain/document';

// Advanced Document Processor
export class DocumentProcessor {
  // Process different file types
  async processFile(filePath: string): Promise<Document[]> {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    let content: string;
    let metadata: Record<string, any> = {
      source: fileName,
      type: ext,
      path: filePath,
      processedAt: new Date().toISOString()
    };
    
    switch (ext) {
      case '.txt':
      case '.md':
        content = await this.processText(filePath);
        break;
        
      case '.pdf':
        const pdfResult = await this.processPDF(filePath);
        content = pdfResult.text;
        metadata.pages = pdfResult.pages;
        metadata.info = pdfResult.info;
        break;
        
      case '.docx':
        content = await this.processWord(filePath);
        break;
        
      case '.csv':
        content = await this.processCSV(filePath);
        metadata.format = 'tabular';
        break;
        
      case '.json':
        content = await this.processJSON(filePath);
        metadata.format = 'structured';
        break;
        
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
    
    // Clean and normalize content
    content = this.cleanContent(content);
    
    // Extract additional metadata
    metadata = {
      ...metadata,
      ...this.extractMetadata(content)
    };
    
    return [new Document({ pageContent: content, metadata })];
  }
  
  // Process plain text
  private async processText(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }
  
  // Process PDF files
  private async processPDF(filePath: string): Promise<any> {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  }
  
  // Process Word documents
  private async processWord(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  // Process CSV files
  private async processCSV(filePath: string): Promise<string> {
    const results: any[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          // Convert to readable text format
          const text = results.map(row => 
            Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')
          ).join('\n');
          resolve(text);
        })
        .on('error', reject);
    });
  }
  
  // Process JSON files
  private async processJSON(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Convert to readable format
    return this.jsonToText(data);
  }
  
  private jsonToText(obj: any, indent = 0): string {
    const spaces = ' '.repeat(indent);
    
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number') return String(obj);
    if (obj === null) return 'null';
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.jsonToText(item, indent)).join('\n');
    }
    
    if (typeof obj === 'object') {
      return Object.entries(obj)
        .map(([key, value]) => 
          `${spaces}${key}: ${this.jsonToText(value, indent + 2)}`
        )
        .join('\n');
    }
    
    return String(obj);
  }
  
  // Clean and normalize content
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, '')   // Remove non-printable chars
      .trim();
  }
  
  // Extract metadata from content
  private extractMetadata(content: string): Record<string, any> {
    return {
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      hasNumbers: /\d/.test(content),
      hasUrls: /https?:\/\//.test(content),
      hasEmails: /@/.test(content),
      language: this.detectLanguage(content),
      summary: content.substring(0, 200) + '...'
    };
  }
  
  private detectLanguage(content: string): string {
    // Simple language detection (in production, use a library)
    const patterns = {
      english: /\b(the|and|of|to|in|is|that)\b/gi,
      spanish: /\b(el|la|de|que|en|es)\b/gi,
      french: /\b(le|de|la|et|les|est)\b/gi
    };
    
    const scores = Object.entries(patterns).map(([lang, pattern]) => ({
      lang,
      score: (content.match(pattern) || []).length
    }));
    
    return scores.sort((a, b) => b.score - a.score)[0].lang;
  }
}
```

### 1.3 Advanced Chunking Strategies

```typescript
// src/rag/chunking-strategies.ts

export class ChunkingStrategies {
  // Strategy 1: Semantic Chunking
  async semanticChunking(
    text: string,
    maxChunkSize: number = 1000
  ): Promise<string[]> {
    // Split by natural boundaries
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    
    return chunks;
  }
  
  // Strategy 2: Sliding Window
  slidingWindow(
    text: string,
    windowSize: number = 1000,
    stride: number = 500
  ): string[] {
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += stride) {
      const chunk = text.slice(i, i + windowSize);
      if (chunk.length > windowSize / 2) {  // Skip small final chunk
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }
  
  // Strategy 3: Sentence-based Chunking
  sentenceBasedChunking(
    text: string,
    sentencesPerChunk: number = 5,
    overlapSentences: number = 1
  ): string[] {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks: string[] = [];
    
    for (let i = 0; i < sentences.length; i += sentencesPerChunk - overlapSentences) {
      const chunk = sentences
        .slice(i, i + sentencesPerChunk)
        .join(' ')
        .trim();
      
      if (chunk) chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Strategy 4: Hierarchical Chunking
  hierarchicalChunking(text: string): ChunkHierarchy {
    // Create multiple levels of chunks
    const document = { text, children: [] as any[] };
    
    // Level 1: Sections (by headers)
    const sections = text.split(/^#+\s+/m);
    
    sections.forEach(section => {
      if (!section.trim()) return;
      
      const sectionNode = {
        text: section,
        level: 'section',
        children: [] as any[]
      };
      
      // Level 2: Paragraphs
      const paragraphs = section.split('\n\n');
      
      paragraphs.forEach(paragraph => {
        if (!paragraph.trim()) return;
        
        const paragraphNode = {
          text: paragraph,
          level: 'paragraph',
          children: [] as any[]
        };
        
        // Level 3: Sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [];
        
        sentences.forEach(sentence => {
          paragraphNode.children.push({
            text: sentence.trim(),
            level: 'sentence'
          });
        });
        
        sectionNode.children.push(paragraphNode);
      });
      
      document.children.push(sectionNode);
    });
    
    return document;
  }
  
  // Strategy 5: Topic-based Chunking (using LLM)
  async topicBasedChunking(
    text: string,
    model: any
  ): Promise<string[]> {
    // Use LLM to identify topic boundaries
    const prompt = `
      Identify natural topic boundaries in this text.
      Return a JSON array of topic sections.
      
      Text: ${text.substring(0, 3000)}...
      
      Format: [{ "topic": "...", "start": 0, "end": 100 }, ...]
    `;
    
    const response = await model.invoke(prompt);
    const topics = JSON.parse(response.content);
    
    return topics.map((topic: any) => 
      text.substring(topic.start, topic.end)
    );
  }
}

interface ChunkHierarchy {
  text: string;
  level?: string;
  children: ChunkHierarchy[];
}
```

---

## 🎯 Part 2: Vector Stores and Embeddings

### 2.1 Understanding Embeddings Deeply

```typescript
// src/rag/embeddings-deep-dive.ts
import { OpenAIEmbeddings } from '@langchain/openai';
import * as tf from '@tensorflow/tfjs';

export class EmbeddingsExplorer {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small'
    });
  }
  
  // Visualize how text becomes vectors
  async demonstrateEmbeddings() {
    const texts = [
      'The cat sat on the mat',
      'The kitten rested on the rug',
      'The dog played in the yard',
      'Python is a programming language',
      'JavaScript is used for web development'
    ];
    
    console.log('🔢 Converting text to vectors...\n');
    
    const vectors = await Promise.all(
      texts.map(async text => {
        const vector = await this.embeddings.embedQuery(text);
        return { text, vector };
      })
    );
    
    // Show vector properties
    vectors.forEach(({ text, vector }) => {
      console.log(`Text: "${text}"`);
      console.log(`  Dimensions: ${vector.length}`);
      console.log(`  First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
      console.log(`  Magnitude: ${this.magnitude(vector).toFixed(3)}`);
      console.log();
    });
    
    // Calculate similarities
    console.log('📊 Similarity Matrix:\n');
    this.printSimilarityMatrix(texts, vectors.map(v => v.vector));
  }
  
  // Calculate vector magnitude
  private magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }
  
  // Calculate cosine similarity
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = this.magnitude(vec1);
    const mag2 = this.magnitude(vec2);
    
    return dotProduct / (mag1 * mag2);
  }
  
  // Print similarity matrix
  private printSimilarityMatrix(texts: string[], vectors: number[][]) {
    // Header
    console.log('     ', texts.map((_, i) => `[${i}]`).join('    '));
    
    texts.forEach((text, i) => {
      const similarities = vectors.map(vec2 => 
        this.cosineSimilarity(vectors[i], vec2)
      );
      
      const row = similarities.map(sim => sim.toFixed(2)).join('  ');
      console.log(`[${i}] ${row}  "${text.substring(0, 20)}..."`);
    });
    
    console.log('\n(1.00 = identical, 0.00 = orthogonal, -1.00 = opposite)');
  }
  
  // Demonstrate embedding arithmetic
  async embeddingArithmetic() {
    console.log('\n🧮 Embedding Arithmetic:\n');
    
    // Get embeddings
    const king = await this.embeddings.embedQuery('king');
    const queen = await this.embeddings.embedQuery('queen');
    const man = await this.embeddings.embedQuery('man');
    const woman = await this.embeddings.embedQuery('woman');
    
    // Perform arithmetic: king - man + woman ≈ queen
    const result = king.map((val, i) => val - man[i] + woman[i]);
    
    // Compare result with queen
    const similarity = this.cosineSimilarity(result, queen);
    
    console.log('king - man + woman ≈ queen');
    console.log(`Similarity to queen: ${similarity.toFixed(3)}`);
    
    // This demonstrates that embeddings capture semantic relationships!
  }
  
  // Clustering embeddings
  async clusterEmbeddings(texts: string[], k: number = 3) {
    console.log(`\n🎯 Clustering ${texts.length} texts into ${k} groups:\n`);
    
    // Get embeddings
    const embeddings = await Promise.all(
      texts.map(text => this.embeddings.embedQuery(text))
    );
    
    // Simple K-means clustering
    const clusters = this.kMeansClustering(embeddings, k);
    
    // Display clusters
    clusters.forEach((cluster, i) => {
      console.log(`Cluster ${i + 1}:`);
      cluster.forEach(index => {
        console.log(`  - ${texts[index]}`);
      });
      console.log();
    });
  }
  
  private kMeansClustering(vectors: number[][], k: number): number[][] {
    // Simplified K-means implementation
    const n = vectors.length;
    const assignments = new Array(n).fill(0);
    const clusters: number[][] = Array(k).fill(null).map(() => []);
    
    // Random initial assignment
    for (let i = 0; i < n; i++) {
      assignments[i] = Math.floor(Math.random() * k);
    }
    
    // Iterate until convergence (simplified - just 10 iterations)
    for (let iter = 0; iter < 10; iter++) {
      // Clear clusters
      clusters.forEach(c => c.length = 0);
      
      // Assign to clusters
      assignments.forEach((cluster, i) => {
        clusters[cluster].push(i);
      });
      
      // Update assignments based on nearest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        
        for (let c = 0; c < k; c++) {
          if (clusters[c].length === 0) continue;
          
          // Calculate centroid
          const centroid = this.calculateCentroid(
            clusters[c].map(idx => vectors[idx])
          );
          
          // Calculate distance
          const dist = this.euclideanDistance(vectors[i], centroid);
          
          if (dist < minDist) {
            minDist = dist;
            bestCluster = c;
          }
        }
        
        assignments[i] = bestCluster;
      }
    }
    
    return clusters;
  }
  
  private calculateCentroid(vectors: number[][]): number[] {
    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);
    
    vectors.forEach(vec => {
      vec.forEach((val, i) => {
        centroid[i] += val / vectors.length;
      });
    });
    
    return centroid;
  }
  
  private euclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(
      vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0)
    );
  }
}
```

### 2.2 Vector Store Implementations

```typescript
// src/rag/vector-stores.ts
import { VectorStore } from 'langchain/vectorstores/base';
import { Document } from 'langchain/document';
import { Embeddings } from '@langchain/core/embeddings';

// Custom Vector Store Implementation
export class CustomVectorStore extends VectorStore {
  private vectors: Array<{
    id: string;
    vector: number[];
    document: Document;
  }> = [];
  
  private index: Map<string, number[]> = new Map(); // For fast lookup
  
  constructor(embeddings: Embeddings) {
    super(embeddings, {});
  }
  
  // Add documents with optimizations
  async addDocuments(documents: Document[]): Promise<string[]> {
    const ids: string[] = [];
    
    // Batch embed for efficiency
    const texts = documents.map(doc => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    
    vectors.forEach((vector, i) => {
      const id = this.generateId();
      ids.push(id);
      
      this.vectors.push({
        id,
        vector,
        document: documents[i]
      });
      
      // Build inverted index for metadata
      this.indexDocument(id, documents[i]);
    });
    
    // Optionally build HNSW index for fast search
    this.buildHNSWIndex();
    
    return ids;
  }
  
  // Similarity search with multiple algorithms
  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: any
  ): Promise<[Document, number][]> {
    // Apply filters first
    let candidates = this.vectors;
    if (filter) {
      candidates = this.applyFilter(candidates, filter);
    }
    
    // Calculate similarities
    const results = candidates.map(item => ({
      document: item.document,
      score: this.cosineSimilarity(query, item.vector)
    }));
    
    // Sort by score and return top k
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(r => [r.document, r.score]);
  }
  
  // Hybrid search: combine vector and keyword search
  async hybridSearch(
    query: string,
    k: number,
    alpha: number = 0.5 // Weight between vector and keyword
  ): Promise<Document[]> {
    // Vector search
    const queryVector = await this.embeddings.embedQuery(query);
    const vectorResults = await this.similaritySearchVectorWithScore(
      queryVector,
      k * 2
    );
    
    // Keyword search (BM25-like)
    const keywordResults = this.keywordSearch(query, k * 2);
    
    // Combine scores
    const combined = new Map<string, number>();
    
    vectorResults.forEach(([doc, score]) => {
      const id = doc.metadata.id || JSON.stringify(doc);
      combined.set(id, alpha * score);
    });
    
    keywordResults.forEach(([doc, score]) => {
      const id = doc.metadata.id || JSON.stringify(doc);
      const existing = combined.get(id) || 0;
      combined.set(id, existing + (1 - alpha) * score);
    });
    
    // Sort and return top k
    return Array.from(combined.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([id]) => this.getDocumentById(id))
      .filter(doc => doc !== undefined) as Document[];
  }
  
  // BM25-like keyword search
  private keywordSearch(query: string, k: number): [Document, number][] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scores = new Map<Document, number>();
    
    this.vectors.forEach(({ document }) => {
      const text = document.pageContent.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        const termFreq = (text.match(new RegExp(term, 'g')) || []).length;
        const docLength = text.length;
        
        // Simplified BM25
        const k1 = 1.2;
        const b = 0.75;
        const avgDocLength = 1000; // Assumed average
        
        score += (termFreq * (k1 + 1)) / 
          (termFreq + k1 * (1 - b + b * docLength / avgDocLength));
      });
      
      scores.set(document, score);
    });
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);
  }
  
  // Build inverted index for metadata filtering
  private indexDocument(id: string, document: Document) {
    // Index by metadata fields
    Object.entries(document.metadata).forEach(([key, value]) => {
      const indexKey = `${key}:${value}`;
      if (!this.index.has(indexKey)) {
        this.index.set(indexKey, []);
      }
      this.index.get(indexKey)!.push(id);
    });
  }
  
  // Apply metadata filters
  private applyFilter(
    candidates: any[],
    filter: Record<string, any>
  ): any[] {
    return candidates.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        return item.document.metadata[key] === value;
      });
    });
  }
  
  // HNSW index for fast approximate search
  private buildHNSWIndex() {
    // Simplified HNSW implementation
    // In production, use a library like hnswlib-node
    console.log('Building HNSW index for fast search...');
  }
  
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (mag1 * mag2);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(7);
  }
  
  private getDocumentById(id: string): Document | undefined {
    const item = this.vectors.find(v => 
      v.document.metadata.id === id || 
      JSON.stringify(v.document) === id
    );
    return item?.document;
  }
  
  // Required abstract methods
  async similaritySearch(query: string, k: number): Promise<Document[]> {
    const vector = await this.embeddings.embedQuery(query);
    const results = await this.similaritySearchVectorWithScore(vector, k);
    return results.map(([doc]) => doc);
  }
  
  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    vectors.forEach((vector, i) => {
      this.vectors.push({
        id: this.generateId(),
        vector,
        document: documents[i]
      });
    });
  }
  
  static async fromTexts(
    texts: string[],
    metadatas: object[],
    embeddings: Embeddings
  ): Promise<CustomVectorStore> {
    const store = new CustomVectorStore(embeddings);
    const documents = texts.map((text, i) => 
      new Document({ pageContent: text, metadata: metadatas[i] })
    );
    await store.addDocuments(documents);
    return store;
  }
  
  static async fromDocuments(
    documents: Document[],
    embeddings: Embeddings
  ): Promise<CustomVectorStore> {
    const store = new CustomVectorStore(embeddings);
    await store.addDocuments(documents);
    return store;
  }
}
```

---

## 🚀 Part 3: Advanced RAG Patterns

### 3.1 Query Enhancement Techniques

```typescript
// src/rag/query-enhancement.ts
import { ChatOpenAI } from '@langchain/openai';

export class QueryEnhancer {
  private model: ChatOpenAI;
  
  constructor() {
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.3
    });
  }
  
  // Technique 1: Query Expansion
  async expandQuery(query: string): Promise<string[]> {
    const prompt = `
      Generate 3 alternative phrasings of this question that might help find relevant information:
      
      Original: "${query}"
      
      Alternatives (one per line):
    `;
    
    const response = await this.model.invoke(prompt);
    const alternatives = response.content.toString().split('\n').filter(s => s.trim());
    
    return [query, ...alternatives];
  }
  
  // Technique 2: Hypothetical Document Embedding (HyDE)
  async generateHypotheticalDocument(query: string): Promise<string> {
    const prompt = `
      Write a short paragraph that would perfectly answer this question:
      "${query}"
      
      Write as if you're creating an ideal reference document:
    `;
    
    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }
  
  // Technique 3: Query Decomposition
  async decomposeQuery(query: string): Promise<string[]> {
    const prompt = `
      Break down this complex question into simpler sub-questions:
      "${query}"
      
      Sub-questions (one per line):
    `;
    
    const response = await this.model.invoke(prompt);
    return response.content.toString().split('\n').filter(s => s.trim());
  }
  
  // Technique 4: Contextual Query Refinement
  async refineWithContext(
    query: string,
    previousQueries: string[],
    previousAnswers: string[]
  ): Promise<string> {
    const context = previousQueries.map((q, i) => 
      `Q: ${q}\nA: ${previousAnswers[i]}`
    ).join('\n\n');
    
    const prompt = `
      Given this conversation context:
      ${context}
      
      Refine this follow-up question to be more specific:
      "${query}"
      
      Refined question:
    `;
    
    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }
  
  // Technique 5: Multi-hop Reasoning
  async generateMultiHopQueries(query: string): Promise<string[]> {
    const prompt = `
      This question might require multiple steps to answer.
      Break it down into a sequence of queries to gather information:
      
      Question: "${query}"
      
      Step-by-step queries (one per line):
    `;
    
    const response = await this.model.invoke(prompt);
    return response.content.toString().split('\n').filter(s => s.trim());
  }
}
```

### 3.2 Reranking and Filtering

```typescript
// src/rag/reranking.ts
import { Document } from 'langchain/document';
import { ChatOpenAI } from '@langchain/openai';

export class Reranker {
  private model: ChatOpenAI;
  
  constructor() {
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0
    });
  }
  
  // Cross-encoder reranking
  async crossEncoderRerank(
    query: string,
    documents: Document[],
    topK: number = 5
  ): Promise<Document[]> {
    // Score each document
    const scoredDocs = await Promise.all(
      documents.map(async doc => {
        const score = await this.scoreRelevance(query, doc.pageContent);
        return { doc, score };
      })
    );
    
    // Sort and return top K
    return scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc);
  }
  
  // Score relevance using LLM
  private async scoreRelevance(query: string, content: string): Promise<number> {
    const prompt = `
      Rate the relevance of this content to the query on a scale of 0-10.
      
      Query: "${query}"
      
      Content: "${content.substring(0, 500)}..."
      
      Respond with just a number 0-10:
    `;
    
    const response = await this.model.invoke(prompt);
    return parseFloat(response.content.toString()) / 10;
  }
  
  // Diversity-aware reranking (MMR)
  maximalMarginalRelevance(
    query: string,
    documents: Document[],
    lambda: number = 0.5,
    topK: number = 5
  ): Document[] {
    const selected: Document[] = [];
    const remaining = [...documents];
    
    while (selected.length < topK && remaining.length > 0) {
      let bestScore = -Infinity;
      let bestIndex = -1;
      
      remaining.forEach((doc, index) => {
        // Relevance to query
        const relevance = this.calculateRelevance(query, doc.pageContent);
        
        // Diversity from selected documents
        const diversity = selected.length === 0 ? 0 :
          Math.min(...selected.map(s => 
            this.calculateSimilarity(doc.pageContent, s.pageContent)
          ));
        
        // MMR score
        const score = lambda * relevance - (1 - lambda) * diversity;
        
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      
      if (bestIndex >= 0) {
        selected.push(remaining[bestIndex]);
        remaining.splice(bestIndex, 1);
      }
    }
    
    return selected;
  }
  
  // Lost in the middle mitigation
  lostInMiddleReorder(documents: Document[]): Document[] {
    // Place most relevant docs at beginning and end
    const n = documents.length;
    const reordered: Document[] = [];
    
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) {
        reordered.push(documents[Math.floor(i / 2)]);
      } else {
        reordered.push(documents[n - 1 - Math.floor(i / 2)]);
      }
    }
    
    return reordered;
  }
  
  // Filter by confidence threshold
  filterByConfidence(
    documents: Array<[Document, number]>,
    threshold: number = 0.5
  ): Document[] {
    return documents
      .filter(([_, score]) => score >= threshold)
      .map(([doc]) => doc);
  }
  
  private calculateRelevance(query: string, content: string): number {
    // Simple keyword overlap (in production, use embeddings)
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const overlap = queryWords.filter(word => 
      contentWords.includes(word)
    ).length;
    
    return overlap / queryWords.length;
  }
  
  private calculateSimilarity(text1: string, text2: string): number {
    // Jaccard similarity (in production, use embeddings)
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}
```

---

## 🔬 Part 4: Production RAG Optimization

### 4.1 Caching Strategies

```typescript
// src/rag/caching.ts
import crypto from 'crypto';

export class RAGCache {
  private cache = new Map<string, CacheEntry>();
  private embedCache = new Map<string, number[]>();
  
  // Semantic caching with similarity threshold
  async getSemanticCache(
    query: string,
    embeddings: any,
    threshold: number = 0.95
  ): Promise<CacheEntry | null> {
    const queryEmbed = await this.getOrComputeEmbedding(query, embeddings);
    
    let bestMatch: { entry: CacheEntry; score: number } | null = null;
    
    for (const [cachedQuery, entry] of this.cache.entries()) {
      const cachedEmbed = await this.getOrComputeEmbedding(cachedQuery, embeddings);
      const similarity = this.cosineSimilarity(queryEmbed, cachedEmbed);
      
      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { entry, score: similarity };
        }
      }
    }
    
    return bestMatch?.entry || null;
  }
  
  // Cache with TTL and LRU eviction
  set(
    query: string,
    result: any,
    ttl: number = 3600000 // 1 hour default
  ): void {
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };
    
    this.cache.set(query, entry);
    
    // Evict old entries if cache is too large
    if (this.cache.size > 1000) {
      this.evictLRU();
    }
  }
  
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      const lastAccess = entry.timestamp + entry.hits * 1000;
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  private async getOrComputeEmbedding(
    text: string,
    embeddings: any
  ): Promise<number[]> {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    
    if (!this.embedCache.has(hash)) {
      const embed = await embeddings.embedQuery(text);
      this.embedCache.set(hash, embed);
    }
    
    return this.embedCache.get(hash)!;
  }
  
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (mag1 * mag2);
  }
}

interface CacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
  hits: number;
}
```

### 4.2 Performance Monitoring

```typescript
// src/rag/monitoring.ts

export class RAGMonitor {
  private metrics: Map<string, Metric[]> = new Map();
  
  // Track retrieval performance
  async trackRetrieval(
    operation: () => Promise<any>,
    metadata: Record<string, any>
  ): Promise<any> {
    const start = performance.now();
    let success = true;
    let error: Error | null = null;
    
    try {
      const result = await operation();
      return result;
    } catch (e) {
      success = false;
      error = e as Error;
      throw e;
    } finally {
      const duration = performance.now() - start;
      
      this.recordMetric('retrieval', {
        duration,
        success,
        error: error?.message,
        ...metadata
      });
    }
  }
  
  // Analyze retrieval quality
  analyzeRetrievalQuality(
    retrieved: Document[],
    relevant: Document[]
  ): QualityMetrics {
    const retrievedSet = new Set(retrieved.map(d => d.metadata.id));
    const relevantSet = new Set(relevant.map(d => d.metadata.id));
    
    const intersection = new Set(
      [...retrievedSet].filter(x => relevantSet.has(x))
    );
    
    const precision = intersection.size / retrievedSet.size;
    const recall = intersection.size / relevantSet.size;
    const f1 = 2 * (precision * recall) / (precision + recall);
    
    return {
      precision,
      recall,
      f1,
      retrieved: retrievedSet.size,
      relevant: relevantSet.size,
      overlap: intersection.size
    };
  }
  
  // Generate performance report
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      summary: {},
      details: []
    };
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const durations = metrics.map(m => m.duration);
      const successRate = metrics.filter(m => m.success).length / metrics.length;
      
      report.summary[operation] = {
        count: metrics.length,
        avgDuration: this.average(durations),
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
        successRate
      };
    }
    
    return report;
  }
  
  private recordMetric(operation: string, metric: Metric): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push({
      ...metric,
      timestamp: Date.now()
    });
  }
  
  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  private percentile(numbers: number[], p: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index];
  }
}

interface Metric {
  duration: number;
  success: boolean;
  error?: string;
  timestamp?: number;
  [key: string]: any;
}

interface QualityMetrics {
  precision: number;
  recall: number;
  f1: number;
  retrieved: number;
  relevant: number;
  overlap: number;
}

interface PerformanceReport {
  summary: Record<string, any>;
  details: any[];
}
```

---

## 🎯 Comprehensive Exercises

### Exercise Set 1: Document Processing Mastery

```typescript
// exercises/01-document-processing.ts

/**
 * Exercise 1.1: Multi-format Document Processor
 * Build a processor that handles:
 * - PDFs with images and tables
 * - Word documents with formatting
 * - HTML with structure preservation
 * - Markdown with code blocks
 * - JSON/XML with schema understanding
 */
export async function exercise1_1() {
  // Your implementation here
}

/**
 * Exercise 1.2: Intelligent Chunking
 * Implement chunking that:
 * - Preserves semantic boundaries
 * - Maintains context across chunks
 * - Handles code blocks specially
 * - Respects document structure
 */
export async function exercise1_2() {
  // Your implementation here
}

/**
 * Exercise 1.3: Metadata Extraction
 * Extract and preserve:
 * - Document structure (headings, sections)
 * - Entities (people, places, dates)
 * - References and citations
 * - Tables and figures
 */
export async function exercise1_3() {
  // Your implementation here
}
```

### Exercise Set 2: Embedding and Vector Store Optimization

```typescript
// exercises/02-embeddings-vectors.ts

/**
 * Exercise 2.1: Custom Embedding Pipeline
 * Create a pipeline that:
 * - Preprocesses text for optimal embedding
 * - Handles multilingual content
 * - Compresses embeddings for storage
 * - Implements dimension reduction
 */
export async function exercise2_1() {
  // Your implementation here
}

/**
 * Exercise 2.2: Vector Store Comparison
 * Compare different vector stores:
 * - In-memory vs persistent
 * - Different similarity metrics
 * - Index structures (flat, HNSW, IVF)
 * - Performance benchmarks
 */
export async function exercise2_2() {
  // Your implementation here
}

/**
 * Exercise 2.3: Hybrid Search Implementation
 * Build a system that combines:
 * - Vector similarity search
 * - Keyword/BM25 search
 * - Metadata filtering
 * - Fuzzy matching
 */
export async function exercise2_3() {
  // Your implementation here
}
```

### Exercise Set 3: Advanced RAG Patterns

```typescript
// exercises/03-advanced-rag.ts

/**
 * Exercise 3.1: Multi-stage RAG Pipeline
 * Implement:
 * - Query understanding and expansion
 * - Multi-hop retrieval
 * - Answer generation with citations
 * - Self-consistency checking
 */
export async function exercise3_1() {
  // Your implementation here
}

/**
 * Exercise 3.2: Conversational RAG
 * Build RAG that:
 * - Maintains conversation context
 * - Handles follow-up questions
 * - Disambiguates references
 * - Tracks topic changes
 */
export async function exercise3_2() {
  // Your implementation here
}

/**
 * Exercise 3.3: RAG with Verification
 * Implement:
 * - Fact checking against sources
 * - Hallucination detection
 * - Confidence scoring
 * - Source validation
 */
export async function exercise3_3() {
  // Your implementation here
}

/**
 * Exercise 3.4: Multimodal RAG
 * Handle:
 * - Text and images together
 * - Tables and charts
 * - Code and documentation
 * - Audio transcripts
 */
export async function exercise3_4() {
  // Your implementation here
}
```

### Exercise Set 4: Production Optimization

```typescript
// exercises/04-production-rag.ts

/**
 * Exercise 4.1: RAG Performance Optimization
 * Optimize for:
 * - Sub-second response times
 * - Minimal token usage
 * - High concurrency
 * - Cache hit rates > 50%
 */
export async function exercise4_1() {
  // Your implementation here
}

/**
 * Exercise 4.2: RAG Monitoring Dashboard
 * Build monitoring for:
 * - Retrieval accuracy metrics
 * - Response time distribution
 * - Cache performance
 * - Error rates and types
 */
export async function exercise4_2() {
  // Your implementation here
}

/**
 * Exercise 4.3: A/B Testing Framework
 * Implement:
 * - Multiple RAG configurations
 * - Traffic splitting
 * - Metric collection
 * - Statistical analysis
 */
export async function exercise4_3() {
  // Your implementation here
}

/**
 * Exercise 4.4: Incremental Index Updates
 * Build a system for:
 * - Adding new documents without reindexing
 * - Updating existing documents
 * - Removing outdated content
 * - Version control for documents
 */
export async function exercise4_4() {
  // Your implementation here
}
```

---

## 🏆 Capstone Project: Knowledge Assistant Platform

### Project: Multi-Source Knowledge RAG System

Build a production-ready RAG system that can:

```typescript
// capstone/knowledge-assistant.ts

interface KnowledgeAssistant {
  // Document Management
  ingest: {
    fromFile(path: string): Promise<void>;
    fromUrl(url: string): Promise<void>;
    fromDatabase(query: string): Promise<void>;
    batch(sources: Source[]): Promise<void>;
  };
  
  // Retrieval Strategies
  retrieve: {
    simple(query: string): Promise<Document[]>;
    hybrid(query: string): Promise<Document[]>;
    multiHop(query: string): Promise<Document[]>;
    conversational(query: string, history: Message[]): Promise<Document[]>;
  };
  
  // Answer Generation
  answer: {
    concise(query: string): Promise<string>;
    detailed(query: string): Promise<string>;
    withCitations(query: string): Promise<AnswerWithSources>;
    streaming(query: string): AsyncGenerator<string>;
  };
  
  // Management
  admin: {
    stats(): IndexStats;
    optimize(): Promise<void>;
    export(): Promise<Backup>;
    import(backup: Backup): Promise<void>;
  };
}

// Implementation requirements:
// 1. Handle 10,000+ documents
// 2. Sub-second retrieval
// 3. 95%+ retrieval accuracy
// 4. Automatic index optimization
// 5. Built-in monitoring
// 6. API and CLI interfaces
```

---

## 📊 Assessment Rubric

### Self-Assessment Checklist

```typescript
interface Phase2Assessment {
  // Document Processing (25%)
  documentHandling: {
    multiFormat: number;        // Can process various formats
    chunking: number;           // Implements smart chunking
    metadata: number;           // Extracts rich metadata
    scale: number;             // Handles large documents
  };
  
  // Vector Operations (25%)
  vectorMastery: {
    embeddings: number;         // Understands embeddings deeply
    similarity: number;         // Can implement similarity search
    indexing: number;          // Knows index structures
    optimization: number;       // Can optimize for speed
  };
  
  // RAG Pipeline (25%)
  ragImplementation: {
    architecture: number;       // Designs complete pipelines
    retrieval: number;         // Implements various strategies
    generation: number;        // Generates quality answers
    citations: number;         // Handles source attribution
  };
  
  // Production Skills (25%)
  productionReady: {
    performance: number;        // Optimizes for production
    monitoring: number;        // Implements observability
    caching: number;          // Uses caching effectively
    scaling: number;          // Designs for scale
  };
}

// Scoring as before: 1-5 scale
```

---

## 🚀 Next Steps

### Preparing for Phase 3: Building Specialized Agents

Before moving on:
1. Complete all exercises
2. Build the capstone project
3. Achieve 90%+ retrieval accuracy
4. Optimize to sub-second response times

### Preview of Phase 3

In Phase 3, you'll learn:
- Agent personality design
- Role-based prompting
- Tool specialization
- Multi-agent communication
- Quality assurance

---

## 💡 Pro Tips

### RAG Best Practices

1. **Chunking Strategy**
   - Match chunk size to your use case
   - Preserve semantic boundaries
   - Include context in overlap

2. **Embedding Optimization**
   - Cache embeddings aggressively
   - Use appropriate models for your domain
   - Consider fine-tuning for specialized content

3. **Retrieval Tuning**
   - Start with k=5, adjust based on results
   - Use reranking for better precision
   - Implement fallback strategies

4. **Production Considerations**
   - Monitor retrieval quality continuously
   - Implement gradual rollouts
   - Keep backup retrieval methods
   - Version your indices

---

## 🎓 Final Thoughts

RAG is the bridge between the vast knowledge in your documents and the intelligence of LLMs. Master it, and you give your agents perfect memory and authoritative knowledge.

Remember: The quality of your RAG directly determines the quality of your agent's responses. Invest time in getting it right!

**Your documents are waiting to become intelligence. Let's transform them! 🚀**