import { EventEmitter } from 'events';
import { ConversationContext } from './streamingAudioProcessor';

export interface CacheEntry {
  id: string;
  input: string;
  response: string;
  audioData: Buffer;
  language: string;
  confidence: number;
  usage: number;
  lastUsed: number;
  created: number;
  metadata: {
    processingTime: number;
    voiceId: string;
    contextHash: string;
    semanticVector?: number[];
  };
}

export interface PredictionResult {
  response: string;
  audioData: Buffer;
  confidence: number;
  source: 'exact_match' | 'semantic_match' | 'pattern_match' | 'contextual_prediction';
  processingTime: number;
}

export interface ConversationPattern {
  id: string;
  pattern: string[];
  nextResponses: Array<{
    response: string;
    probability: number;
    audioData: Buffer;
  }>;
  language: string;
  usage: number;
  accuracy: number;
}

export class PredictiveResponseCache extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private patterns = new Map<string, ConversationPattern>();
  private semanticIndex = new Map<string, number[]>();
  private maxCacheSize: number;
  private maxAge: number;
  private semanticThreshold: number;
  private patternAnalyzer: ConversationPatternAnalyzer;
  private semanticMatcher: SemanticMatcher;

  constructor(options: {
    maxCacheSize?: number;
    maxAge?: number;
    semanticThreshold?: number;
  } = {}) {
    super();
    
    this.maxCacheSize = options.maxCacheSize || 10000;
    this.maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours
    this.semanticThreshold = options.semanticThreshold || 0.85;
    
    this.patternAnalyzer = new ConversationPatternAnalyzer();
    this.semanticMatcher = new SemanticMatcher();
    
    this.setupCleanupInterval();
  }

  async predict(input: string, context: ConversationContext): Promise<PredictionResult | null> {
    const startTime = performance.now();
    
    try {
      // 1. Try exact match first (fastest)
      const exactMatch = await this.findExactMatch(input, context);
      if (exactMatch) {
        return {
          ...exactMatch,
          source: 'exact_match',
          processingTime: performance.now() - startTime
        };
      }

      // 2. Try semantic similarity match
      const semanticMatch = await this.findSemanticMatch(input, context);
      if (semanticMatch && semanticMatch.confidence > this.semanticThreshold) {
        return {
          ...semanticMatch,
          source: 'semantic_match',
          processingTime: performance.now() - startTime
        };
      }

      // 3. Try pattern-based prediction
      const patternMatch = await this.findPatternMatch(context);
      if (patternMatch && patternMatch.confidence > 0.7) {
        return {
          ...patternMatch,
          source: 'pattern_match',
          processingTime: performance.now() - startTime
        };
      }

      // 4. Try contextual prediction
      const contextualPrediction = await this.findContextualPrediction(input, context);
      if (contextualPrediction && contextualPrediction.confidence > 0.6) {
        return {
          ...contextualPrediction,
          source: 'contextual_prediction',
          processingTime: performance.now() - startTime
        };
      }

      return null;

    } catch (error) {
      console.error('[PredictiveCache] Prediction failed:', error);
      return null;
    }
  }

  async cacheResponse(
    input: string, 
    response: string, 
    audioData: Buffer, 
    context: ConversationContext,
    processingTime: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(input, context);
    const contextHash = this.generateContextHash(context);
    
    // Generate semantic vector for similarity matching
    const semanticVector = await this.semanticMatcher.generateVector(input);
    
    const entry: CacheEntry = {
      id: cacheKey,
      input,
      response,
      audioData,
      language: context.language,
      confidence: 1.0,
      usage: 1,
      lastUsed: Date.now(),
      created: Date.now(),
      metadata: {
        processingTime,
        voiceId: this.extractVoiceId(context),
        contextHash,
        semanticVector
      }
    };

    // Store in cache
    this.cache.set(cacheKey, entry);
    
    // Store semantic vector for similarity search
    this.semanticIndex.set(cacheKey, semanticVector);
    
    // Update conversation patterns
    await this.updatePatterns(context, response);
    
    // Emit cache update event
    this.emit('cacheUpdated', { entry, cacheSize: this.cache.size });
    
    // Clean up if cache is too large
    if (this.cache.size > this.maxCacheSize) {
      await this.cleanup();
    }
  }

  private async findExactMatch(input: string, context: ConversationContext): Promise<Omit<PredictionResult, 'source' | 'processingTime'> | null> {
    const cacheKey = this.generateCacheKey(input, context);
    const entry = this.cache.get(cacheKey);
    
    if (entry && !this.isExpired(entry)) {
      // Update usage statistics
      entry.usage++;
      entry.lastUsed = Date.now();
      
      return {
        response: entry.response,
        audioData: entry.audioData,
        confidence: entry.confidence
      };
    }
    
    return null;
  }

  private async findSemanticMatch(input: string, context: ConversationContext): Promise<Omit<PredictionResult, 'source' | 'processingTime'> | null> {
    const inputVector = await this.semanticMatcher.generateVector(input);
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;
    
    for (const [cacheKey, entry] of this.cache.entries()) {
      if (this.isExpired(entry) || entry.language !== context.language) {
        continue;
      }
      
      const entryVector = this.semanticIndex.get(cacheKey);
      if (!entryVector) continue;
      
      const similarity = this.semanticMatcher.calculateSimilarity(inputVector, entryVector);
      
      if (similarity > bestSimilarity && similarity > this.semanticThreshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }
    
    if (bestMatch) {
      // Update usage statistics
      bestMatch.usage++;
      bestMatch.lastUsed = Date.now();
      
      return {
        response: bestMatch.response,
        audioData: bestMatch.audioData,
        confidence: bestSimilarity
      };
    }
    
    return null;
  }

  private async findPatternMatch(context: ConversationContext): Promise<Omit<PredictionResult, 'source' | 'processingTime'> | null> {
    const conversationPattern = this.patternAnalyzer.identifyPattern(context);
    
    if (!conversationPattern) return null;
    
    const pattern = this.patterns.get(conversationPattern.id);
    if (!pattern || pattern.language !== context.language) return null;
    
    // Find the most likely next response
    const sortedResponses = pattern.nextResponses.sort((a, b) => b.probability - a.probability);
    const bestResponse = sortedResponses[0];
    
    if (bestResponse && bestResponse.probability > 0.7) {
      return {
        response: bestResponse.response,
        audioData: bestResponse.audioData,
        confidence: bestResponse.probability
      };
    }
    
    return null;
  }

  private async findContextualPrediction(input: string, context: ConversationContext): Promise<Omit<PredictionResult, 'source' | 'processingTime'> | null> {
    // Analyze recent conversation history for contextual clues
    const recentHistory = context.conversationHistory.slice(-3);
    
    if (recentHistory.length < 2) return null;
    
    // Look for similar conversation flows
    const contextPattern = recentHistory.map(msg => msg.role + ':' + msg.content.substring(0, 50)).join('|');
    
    for (const [_, entry] of this.cache.entries()) {
      if (this.isExpired(entry) || entry.language !== context.language) {
        continue;
      }
      
      // Check if this cached response fits the current context
      const contextSimilarity = this.calculateContextSimilarity(contextPattern, entry.metadata.contextHash);
      
      if (contextSimilarity > 0.6) {
        return {
          response: entry.response,
          audioData: entry.audioData,
          confidence: contextSimilarity
        };
      }
    }
    
    return null;
  }

  private async updatePatterns(context: ConversationContext, response: string): Promise<void> {
    const pattern = this.patternAnalyzer.extractPattern(context, response);
    
    if (pattern) {
      const existingPattern = this.patterns.get(pattern.id);
      
      if (existingPattern) {
        // Update existing pattern
        existingPattern.usage++;
        
        // Update response probabilities
        const existingResponse = existingPattern.nextResponses.find(r => r.response === response);
        if (existingResponse) {
          existingResponse.probability = Math.min(1.0, existingResponse.probability + 0.1);
        } else {
          existingPattern.nextResponses.push({
            response,
            probability: 0.3,
            audioData: Buffer.alloc(0) // Will be filled when audio is available
          });
        }
        
        // Normalize probabilities
        const totalProb = existingPattern.nextResponses.reduce((sum, r) => sum + r.probability, 0);
        existingPattern.nextResponses.forEach(r => r.probability /= totalProb);
        
      } else {
        // Create new pattern
        this.patterns.set(pattern.id, pattern);
      }
    }
  }

  private generateCacheKey(input: string, context: ConversationContext): string {
    const normalizedInput = input.toLowerCase().trim();
    const contextKey = context.language + ':' + context.workflowState?.currentNode || 'default';
    return `${contextKey}:${this.hashString(normalizedInput)}`;
  }

  private generateContextHash(context: ConversationContext): string {
    const contextData = {
      language: context.language,
      recentHistory: context.conversationHistory.slice(-3).map(msg => msg.role + ':' + msg.content.substring(0, 30)),
      workflowState: context.workflowState?.currentNode || 'default'
    };
    
    return this.hashString(JSON.stringify(contextData));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private extractVoiceId(context: ConversationContext): string {
    return context.metadata?.voiceId || 'default';
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.created > this.maxAge;
  }

  private calculateContextSimilarity(pattern1: string, pattern2: string): number {
    // Simple Jaccard similarity for context patterns
    const set1 = new Set(pattern1.split('|'));
    const set2 = new Set(pattern2.split('|'));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private async cleanup(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by usage and last used time (LRU with usage weighting)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.usage * (1 / (Date.now() - a.lastUsed));
      const scoreB = b.usage * (1 / (Date.now() - b.lastUsed));
      return scoreA - scoreB;
    });
    
    // Remove least valuable entries
    const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.1));
    
    for (const [key] of toRemove) {
      this.cache.delete(key);
      this.semanticIndex.delete(key);
    }
    
    console.log(`[PredictiveCache] Cleaned up ${toRemove.length} entries. Cache size: ${this.cache.size}`);
    this.emit('cacheCleanup', { removedCount: toRemove.length, currentSize: this.cache.size });
  }

  private setupCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const expiredKeys: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry)) {
          expiredKeys.push(key);
        }
      }
      
      for (const key of expiredKeys) {
        this.cache.delete(key);
        this.semanticIndex.delete(key);
      }
      
      if (expiredKeys.length > 0) {
        console.log(`[PredictiveCache] Removed ${expiredKeys.length} expired entries`);
        this.emit('expiredCleanup', { removedCount: expiredKeys.length });
      }
    }, 5 * 60 * 1000);
  }

  // Public methods for monitoring and management
  getCacheStats(): any {
    const entries = Array.from(this.cache.values());
    const totalUsage = entries.reduce((sum, entry) => sum + entry.usage, 0);
    const avgUsage = entries.length > 0 ? totalUsage / entries.length : 0;
    
    const languageDistribution = entries.reduce((dist, entry) => {
      dist[entry.language] = (dist[entry.language] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    return {
      totalEntries: this.cache.size,
      totalPatterns: this.patterns.size,
      averageUsage: avgUsage,
      languageDistribution,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.audioData.length;
      totalSize += entry.input.length * 2; // Rough estimate for string
      totalSize += entry.response.length * 2;
      totalSize += 200; // Metadata overhead
    }
    
    return totalSize;
  }

  clearCache(): void {
    this.cache.clear();
    this.patterns.clear();
    this.semanticIndex.clear();
    this.emit('cacheCleared');
  }
}

class ConversationPatternAnalyzer {
  identifyPattern(context: ConversationContext): { id: string } | null {
    const history = context.conversationHistory;
    
    if (history.length < 2) return null;
    
    // Extract pattern from recent conversation
    const pattern = history.slice(-3).map(msg => 
      msg.role + ':' + this.categorizeMessage(msg.content)
    ).join('->');
    
    return { id: this.hashPattern(pattern) };
  }

  extractPattern(context: ConversationContext, response: string): ConversationPattern | null {
    const patternId = this.identifyPattern(context);
    if (!patternId) return null;
    
    const history = context.conversationHistory;
    const pattern = history.slice(-3).map(msg => msg.role + ':' + this.categorizeMessage(msg.content));
    
    return {
      id: patternId.id,
      pattern,
      nextResponses: [{
        response,
        probability: 0.5,
        audioData: Buffer.alloc(0)
      }],
      language: context.language,
      usage: 1,
      accuracy: 0.5
    };
  }

  private categorizeMessage(content: string): string {
    // Simple categorization - in a real implementation, this would be more sophisticated
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('hello') || lowerContent.includes('hi')) return 'greeting';
    if (lowerContent.includes('bye') || lowerContent.includes('goodbye')) return 'farewell';
    if (lowerContent.includes('?')) return 'question';
    if (lowerContent.includes('thank')) return 'thanks';
    if (lowerContent.includes('help')) return 'help_request';
    
    return 'general';
  }

  private hashPattern(pattern: string): string {
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'pattern_' + hash.toString(36);
  }
}

class SemanticMatcher {
  async generateVector(text: string): Promise<number[]> {
    // Placeholder implementation - in a real system, you'd use a proper embedding model
    // This creates a simple hash-based vector for demonstration
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(100).fill(0);
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      const index = Math.abs(hash) % vector.length;
      vector[index] += 1;
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  calculateSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;
    
    // Cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export default PredictiveResponseCache;
