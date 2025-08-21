import { EventEmitter } from 'events';
import { WorkflowConfig } from '../types/workflowConfig';
import TwilioConversationRelay, { ConversationRelayConfig, AudioChunk } from './conversationRelay';
import { StreamingAudioProcessor } from './streamingAudioProcessor';
import PredictiveResponseCache from './predictiveCache';
import LanguagePerformanceOptimizer from './languageOptimizer';

export interface PerformanceConfig {
  targetLatency: number;        // Target response latency in ms
  maxLatency: number;          // Maximum acceptable latency in ms
  qualityThreshold: number;    // Minimum quality score (0-1)
  cacheEnabled: boolean;       // Enable predictive caching
  languageOptimization: boolean; // Enable language-specific optimizations
  failoverEnabled: boolean;    // Enable provider failover
  monitoring: {
    enabled: boolean;
    metricsInterval: number;   // Metrics collection interval in ms
    alertThresholds: {
      latency: number;
      errorRate: number;
      cacheHitRate: number;
    };
  };
}

export interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  cacheHitRate: number;
  languageOptimizationRate: number;
  providerFailoverRate: number;
  totalProcessedRequests: number;
  uptime: number;
  currentThroughput: number;
}

export interface CallPerformanceData {
  callSid: string;
  language: string;
  totalLatency: number;
  cacheHits: number;
  cacheMisses: number;
  providerFailovers: number;
  qualityScore: number;
  processingSteps: Array<{
    step: string;
    duration: number;
    provider?: string;
    cached?: boolean;
  }>;
}

export class PerformanceOrchestrator extends EventEmitter {
  private config: PerformanceConfig;
  private workflowConfig: WorkflowConfig;
  private conversationRelay: TwilioConversationRelay;
  private streamingProcessor: StreamingAudioProcessor;
  private predictiveCache: PredictiveResponseCache;
  private languageOptimizer: LanguagePerformanceOptimizer;
  
  private metrics: PerformanceMetrics;
  private callData = new Map<string, CallPerformanceData>();
  private startTime: number;
  private metricsInterval?: NodeJS.Timeout;

  constructor(workflowConfig: WorkflowConfig, performanceConfig?: Partial<PerformanceConfig>) {
    super();
    
    this.workflowConfig = workflowConfig;
    this.config = {
      targetLatency: 300,
      maxLatency: 500,
      qualityThreshold: 0.85,
      cacheEnabled: true,
      languageOptimization: true,
      failoverEnabled: true,
      monitoring: {
        enabled: true,
        metricsInterval: 30000, // 30 seconds
        alertThresholds: {
          latency: 400,
          errorRate: 0.05,
          cacheHitRate: 0.3
        }
      },
      ...performanceConfig
    };

    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    
    this.initializeServices();
    this.setupEventHandlers();
    
    if (this.config.monitoring.enabled) {
      this.startMetricsCollection();
    }
  }

  async startOptimizedConversation(callSid: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`[PerformanceOrchestrator] Starting optimized conversation for call ${callSid}`);
      
      // Initialize call performance tracking
      this.initializeCallTracking(callSid);
      
      // Start conversation relay with optimized configuration
      await this.conversationRelay.startConversation(callSid);
      
      const initTime = performance.now() - startTime;
      console.log(`[PerformanceOrchestrator] Optimized conversation started in ${initTime}ms`);
      
      this.emit('conversationStarted', { callSid, initTime });
      
    } catch (error) {
      console.error(`[PerformanceOrchestrator] Failed to start optimized conversation:`, error);
      this.emit('error', { callSid, error, phase: 'initialization' });
      throw error;
    }
  }

  async processOptimizedAudio(callSid: string, audioChunk: AudioChunk): Promise<void> {
    const processingStartTime = performance.now();
    const callData = this.callData.get(callSid);
    
    if (!callData) {
      throw new Error(`No call data found for ${callSid}`);
    }

    try {
      // Process audio through optimized pipeline
      const response = await this.conversationRelay.processAudioChunk(audioChunk);
      
      const totalProcessingTime = performance.now() - processingStartTime;
      
      // Update call performance data
      this.updateCallPerformance(callSid, {
        totalLatency: totalProcessingTime,
        qualityScore: response.confidence,
        processingSteps: [
          {
            step: 'audio_processing',
            duration: totalProcessingTime,
            cached: response.confidence > 0.9 // High confidence might indicate cache hit
          }
        ]
      });

      // Update global metrics
      this.updateGlobalMetrics(totalProcessingTime, response.confidence);
      
      // Check performance against targets
      await this.checkPerformanceTargets(callSid, totalProcessingTime);
      
      this.emit('audioProcessed', {
        callSid,
        processingTime: totalProcessingTime,
        confidence: response.confidence,
        language: response.language
      });

    } catch (error) {
      const processingTime = performance.now() - processingStartTime;
      
      console.error(`[PerformanceOrchestrator] Audio processing failed for ${callSid}:`, error);
      
      // Update error metrics
      this.updateErrorMetrics(callSid, error, processingTime);
      
      this.emit('processingError', { callSid, error, processingTime });
      throw error;
    }
  }

  async stopOptimizedConversation(callSid: string): Promise<CallPerformanceData> {
    try {
      console.log(`[PerformanceOrchestrator] Stopping optimized conversation for call ${callSid}`);
      
      // Stop conversation relay
      await this.conversationRelay.stopConversation(callSid);
      
      // Get final call performance data
      const callData = this.callData.get(callSid);
      if (!callData) {
        throw new Error(`No call data found for ${callSid}`);
      }

      // Clean up call tracking
      this.callData.delete(callSid);
      
      this.emit('conversationEnded', { callSid, performanceData: callData });
      
      return callData;

    } catch (error) {
      console.error(`[PerformanceOrchestrator] Failed to stop optimized conversation:`, error);
      this.emit('error', { callSid, error, phase: 'cleanup' });
      throw error;
    }
  }

  private initializeServices(): void {
    // Initialize predictive cache
    this.predictiveCache = new PredictiveResponseCache({
      maxCacheSize: 10000,
      maxAge: 24 * 60 * 60 * 1000,
      semanticThreshold: 0.85
    });

    // Initialize language optimizer
    this.languageOptimizer = new LanguagePerformanceOptimizer();

    // Initialize streaming processor with optimizations
    this.streamingProcessor = new StreamingAudioProcessor(this.workflowConfig);

    // Initialize conversation relay with optimized configuration
    const relayConfig: ConversationRelayConfig = {
      enabled: true,
      streamingMode: 'bidirectional',
      audioFormat: 'mulaw',
      sampleRate: 8000,
      bufferSize: 1024,
      latencyOptimization: {
        enableJitterBuffer: true,
        adaptiveBitrate: true,
        echoCancellation: true,
        noiseReduction: true,
        voiceActivityDetection: true
      },
      performance: {
        targetLatency: this.config.targetLatency,
        maxLatency: this.config.maxLatency,
        qualityThreshold: this.config.qualityThreshold
      }
    };

    this.conversationRelay = new TwilioConversationRelay(relayConfig, this.workflowConfig);
  }

  private setupEventHandlers(): void {
    // Conversation relay events
    this.conversationRelay.on('audioProcessed', (data) => {
      this.handleAudioProcessed(data);
    });

    this.conversationRelay.on('performanceWarning', (data) => {
      this.handlePerformanceWarning(data);
    });

    this.conversationRelay.on('error', (data) => {
      this.handleError(data);
    });

    // Cache events
    if (this.config.cacheEnabled) {
      this.predictiveCache.on('cacheUpdated', (data) => {
        this.metrics.cacheHitRate = this.calculateCacheHitRate();
      });
    }

    // Language optimizer events
    if (this.config.languageOptimization) {
      this.languageOptimizer.on('performanceAlert', (data) => {
        this.emit('performanceAlert', data);
      });

      this.languageOptimizer.on('providerFailure', (data) => {
        this.metrics.providerFailoverRate = this.calculateFailoverRate();
        this.emit('providerFailure', data);
      });
    }
  }

  private initializeCallTracking(callSid: string): void {
    const language = this.workflowConfig.globalSettings?.defaultLanguage || 'en-US';
    
    this.callData.set(callSid, {
      callSid,
      language,
      totalLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      providerFailovers: 0,
      qualityScore: 0,
      processingSteps: []
    });
  }

  private updateCallPerformance(callSid: string, update: Partial<CallPerformanceData>): void {
    const callData = this.callData.get(callSid);
    if (callData) {
      Object.assign(callData, update);
      
      if (update.processingSteps) {
        callData.processingSteps.push(...update.processingSteps);
      }
    }
  }

  private updateGlobalMetrics(processingTime: number, confidence: number): void {
    this.metrics.totalProcessedRequests++;
    
    // Update latency metrics (simplified - in production, use proper percentile calculation)
    this.metrics.averageLatency = (this.metrics.averageLatency + processingTime) / 2;
    this.metrics.p95Latency = Math.max(this.metrics.p95Latency, processingTime);
    this.metrics.p99Latency = Math.max(this.metrics.p99Latency, processingTime);
    
    // Update throughput
    this.metrics.currentThroughput = this.calculateCurrentThroughput();
  }

  private updateErrorMetrics(callSid: string, error: any, processingTime: number): void {
    this.metrics.totalProcessedRequests++;
    
    // Update error rate (simplified calculation)
    const errorCount = this.metrics.errorRate * this.metrics.totalProcessedRequests + 1;
    this.metrics.errorRate = errorCount / this.metrics.totalProcessedRequests;
  }

  private async checkPerformanceTargets(callSid: string, processingTime: number): Promise<void> {
    // Check latency target
    if (processingTime > this.config.targetLatency) {
      this.emit('performanceAlert', {
        type: 'latency_exceeded',
        callSid,
        actual: processingTime,
        target: this.config.targetLatency
      });
    }

    // Check maximum latency
    if (processingTime > this.config.maxLatency) {
      this.emit('performanceAlert', {
        type: 'max_latency_exceeded',
        callSid,
        actual: processingTime,
        max: this.config.maxLatency,
        severity: 'critical'
      });
    }
  }

  private handleAudioProcessed(data: any): void {
    // Handle successful audio processing
    console.log(`[PerformanceOrchestrator] Audio processed successfully:`, data);
  }

  private handlePerformanceWarning(data: any): void {
    console.warn(`[PerformanceOrchestrator] Performance warning:`, data);
    this.emit('performanceWarning', data);
  }

  private handleError(data: any): void {
    console.error(`[PerformanceOrchestrator] Error:`, data);
    this.emit('error', data);
  }

  private calculateCacheHitRate(): number {
    // Simplified calculation - in production, track actual cache hits/misses
    return 0.4; // Placeholder
  }

  private calculateFailoverRate(): number {
    // Simplified calculation - in production, track actual failovers
    return 0.02; // Placeholder
  }

  private calculateCurrentThroughput(): number {
    const uptime = Date.now() - this.startTime;
    return this.metrics.totalProcessedRequests / (uptime / 1000); // Requests per second
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      cacheHitRate: 0,
      languageOptimizationRate: 0,
      providerFailoverRate: 0,
      totalProcessedRequests: 0,
      uptime: 0,
      currentThroughput: 0
    };
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.metrics.uptime = Date.now() - this.startTime;
      
      // Check alert thresholds
      this.checkAlertThresholds();
      
      // Emit metrics update
      this.emit('metricsUpdate', this.metrics);
      
    }, this.config.monitoring.metricsInterval);
  }

  private checkAlertThresholds(): void {
    const thresholds = this.config.monitoring.alertThresholds;
    
    if (this.metrics.averageLatency > thresholds.latency) {
      this.emit('alert', {
        type: 'high_latency',
        value: this.metrics.averageLatency,
        threshold: thresholds.latency
      });
    }

    if (this.metrics.errorRate > thresholds.errorRate) {
      this.emit('alert', {
        type: 'high_error_rate',
        value: this.metrics.errorRate,
        threshold: thresholds.errorRate
      });
    }

    if (this.metrics.cacheHitRate < thresholds.cacheHitRate) {
      this.emit('alert', {
        type: 'low_cache_hit_rate',
        value: this.metrics.cacheHitRate,
        threshold: thresholds.cacheHitRate
      });
    }
  }

  // Public API methods
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getCallPerformanceData(callSid: string): CallPerformanceData | undefined {
    return this.callData.get(callSid);
  }

  getAllCallData(): CallPerformanceData[] {
    return Array.from(this.callData.values());
  }

  updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  async shutdown(): Promise<void> {
    console.log('[PerformanceOrchestrator] Shutting down...');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Stop all active conversations
    for (const callSid of this.callData.keys()) {
      try {
        await this.stopOptimizedConversation(callSid);
      } catch (error) {
        console.error(`Failed to stop conversation ${callSid}:`, error);
      }
    }

    this.emit('shutdown', { finalMetrics: this.metrics });
  }
}

export default PerformanceOrchestrator;
