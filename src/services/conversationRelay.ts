import { EventEmitter } from 'events';
import { WorkflowConfig, LanguageConfig } from '../types/workflowConfig';

export interface ConversationRelayConfig {
  enabled: boolean;
  streamingMode: 'bidirectional' | 'unidirectional';
  audioFormat: 'mulaw' | 'linear16';
  sampleRate: 8000 | 16000;
  bufferSize: number;
  latencyOptimization: {
    enableJitterBuffer: boolean;
    adaptiveBitrate: boolean;
    echoCancellation: boolean;
    noiseReduction: boolean;
    voiceActivityDetection: boolean;
  };
  performance: {
    targetLatency: number; // Target latency in ms
    maxLatency: number;    // Maximum acceptable latency
    qualityThreshold: number; // Minimum quality score (0-1)
  };
}

export interface AudioChunk {
  data: Buffer;
  timestamp: number;
  sequenceNumber: number;
  language?: string;
  confidence?: number;
}

export interface StreamingResponse {
  audioData: Buffer;
  transcript?: string;
  confidence: number;
  processingTime: number;
  language: string;
  isPartial: boolean;
}

export class TwilioConversationRelay extends EventEmitter {
  private config: ConversationRelayConfig;
  private workflowConfig: WorkflowConfig;
  private isActive: boolean = false;
  private audioBuffer: Buffer[] = [];
  private sequenceNumber: number = 0;
  private performanceMetrics: PerformanceMetrics;
  private streamProcessor: StreamingAudioProcessor;

  constructor(config: ConversationRelayConfig, workflowConfig: WorkflowConfig) {
    super();
    this.config = config;
    this.workflowConfig = workflowConfig;
    this.performanceMetrics = new PerformanceMetrics();
    this.streamProcessor = new StreamingAudioProcessor(workflowConfig);
    
    this.setupEventHandlers();
  }

  async startConversation(callSid: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`[ConversationRelay] Starting conversation for call ${callSid}`);
      
      // Initialize streaming connection
      await this.initializeStream(callSid);
      
      // Set up bidirectional audio processing
      await this.setupBidirectionalStreaming();
      
      this.isActive = true;
      
      const initTime = performance.now() - startTime;
      console.log(`[ConversationRelay] Conversation started in ${initTime}ms`);
      
      this.emit('conversationStarted', { callSid, initTime });
      
    } catch (error) {
      console.error('[ConversationRelay] Failed to start conversation:', error);
      this.emit('error', { callSid, error });
      throw error;
    }
  }

  async processAudioChunk(audioChunk: AudioChunk): Promise<StreamingResponse> {
    const processingStartTime = performance.now();
    
    try {
      // Apply real-time audio optimizations
      const optimizedAudio = await this.optimizeAudioChunk(audioChunk);
      
      // Process through streaming pipeline
      const response = await this.streamProcessor.processAudio(optimizedAudio);
      
      const processingTime = performance.now() - processingStartTime;
      
      // Update performance metrics
      this.performanceMetrics.recordProcessingTime(processingTime);
      
      // Check if we're meeting latency targets
      if (processingTime > this.config.performance.targetLatency) {
        console.warn(`[ConversationRelay] Processing time ${processingTime}ms exceeds target ${this.config.performance.targetLatency}ms`);
        this.emit('performanceWarning', { processingTime, target: this.config.performance.targetLatency });
      }
      
      const streamingResponse: StreamingResponse = {
        ...response,
        processingTime,
        language: this.workflowConfig.globalSettings?.defaultLanguage || 'en-US'
      };
      
      this.emit('audioProcessed', streamingResponse);
      
      return streamingResponse;
      
    } catch (error) {
      console.error('[ConversationRelay] Audio processing failed:', error);
      this.emit('processingError', { audioChunk, error });
      throw error;
    }
  }

  private async initializeStream(callSid: string): Promise<void> {
    // Initialize Twilio Media Stream
    const mediaStreamConfig = {
      callSid,
      track: 'both', // inbound and outbound
      statusCallback: `${process.env.WEBHOOK_BASE_URL}/twilio/media-stream-status`,
      statusCallbackMethod: 'POST'
    };

    // Set up WebSocket connection for real-time audio
    await this.setupWebSocketConnection(callSid);
    
    // Configure audio processing pipeline
    await this.configureAudioPipeline();
  }

  private async setupBidirectionalStreaming(): Promise<void> {
    // Configure inbound audio processing (user speech)
    this.on('inboundAudio', async (audioData: Buffer) => {
      const audioChunk: AudioChunk = {
        data: audioData,
        timestamp: Date.now(),
        sequenceNumber: this.sequenceNumber++,
        language: this.workflowConfig.globalSettings?.defaultLanguage
      };
      
      try {
        const response = await this.processAudioChunk(audioChunk);
        
        // Send response audio back to user
        this.sendOutboundAudio(response.audioData);
        
      } catch (error) {
        console.error('[ConversationRelay] Inbound audio processing failed:', error);
        // Send error response or fallback audio
        await this.handleProcessingError(error);
      }
    });

    // Configure outbound audio streaming (AI responses)
    this.on('outboundAudio', (audioData: Buffer) => {
      this.sendAudioToTwilio(audioData);
    });
  }

  private async optimizeAudioChunk(audioChunk: AudioChunk): Promise<AudioChunk> {
    let optimizedData = audioChunk.data;
    
    // Apply noise reduction if enabled
    if (this.config.latencyOptimization.noiseReduction) {
      optimizedData = await this.applyNoiseReduction(optimizedData);
    }
    
    // Apply echo cancellation if enabled
    if (this.config.latencyOptimization.echoCancellation) {
      optimizedData = await this.applyEchoCancellation(optimizedData);
    }
    
    // Voice activity detection
    if (this.config.latencyOptimization.voiceActivityDetection) {
      const hasVoice = await this.detectVoiceActivity(optimizedData);
      if (!hasVoice) {
        // Skip processing for silence
        return { ...audioChunk, data: Buffer.alloc(0), confidence: 0 };
      }
    }
    
    return {
      ...audioChunk,
      data: optimizedData,
      confidence: await this.calculateAudioConfidence(optimizedData)
    };
  }

  private async setupWebSocketConnection(callSid: string): Promise<void> {
    // This would integrate with Twilio's Media Streams API
    // Implementation would depend on your WebSocket setup
    console.log(`[ConversationRelay] Setting up WebSocket for call ${callSid}`);
  }

  private async configureAudioPipeline(): Promise<void> {
    // Configure the audio processing pipeline based on language settings
    const languageConfig = this.workflowConfig.globalSettings?.languageConfig;
    
    if (languageConfig) {
      await this.streamProcessor.configureForLanguage(languageConfig);
    }
  }

  private sendOutboundAudio(audioData: Buffer): void {
    this.emit('outboundAudio', audioData);
  }

  private sendAudioToTwilio(audioData: Buffer): void {
    // Send audio data back to Twilio Media Stream
    // This would use your WebSocket connection to Twilio
    console.log(`[ConversationRelay] Sending ${audioData.length} bytes to Twilio`);
  }

  private async handleProcessingError(error: any): Promise<void> {
    // Generate fallback response
    const fallbackMessage = "I'm sorry, I didn't catch that. Could you please repeat?";
    const fallbackAudio = await this.streamProcessor.generateFallbackAudio(fallbackMessage);
    this.sendOutboundAudio(fallbackAudio);
  }

  private async applyNoiseReduction(audioData: Buffer): Promise<Buffer> {
    // Implement noise reduction algorithm
    // This is a placeholder - you'd use a real noise reduction library
    return audioData;
  }

  private async applyEchoCancellation(audioData: Buffer): Promise<Buffer> {
    // Implement echo cancellation
    // This is a placeholder - you'd use a real echo cancellation library
    return audioData;
  }

  private async detectVoiceActivity(audioData: Buffer): Promise<boolean> {
    // Implement voice activity detection
    // This is a placeholder - you'd use a real VAD algorithm
    return audioData.length > 0;
  }

  private async calculateAudioConfidence(audioData: Buffer): Promise<number> {
    // Calculate confidence score for audio quality
    // This is a placeholder - you'd implement real audio quality metrics
    return 0.95;
  }

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('[ConversationRelay] Error:', error);
      this.performanceMetrics.recordError(error);
    });

    this.on('performanceWarning', (data) => {
      console.warn('[ConversationRelay] Performance warning:', data);
      this.performanceMetrics.recordWarning(data);
    });
  }

  async stopConversation(callSid: string): Promise<void> {
    console.log(`[ConversationRelay] Stopping conversation for call ${callSid}`);
    this.isActive = false;
    
    // Clean up resources
    this.audioBuffer = [];
    this.sequenceNumber = 0;
    
    // Emit final metrics
    const metrics = this.performanceMetrics.getFinalMetrics();
    this.emit('conversationEnded', { callSid, metrics });
  }

  getPerformanceMetrics(): any {
    return this.performanceMetrics.getCurrentMetrics();
  }
}

class PerformanceMetrics {
  private processingTimes: number[] = [];
  private errors: any[] = [];
  private warnings: any[] = [];
  private startTime: number = Date.now();

  recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Keep only last 100 measurements for memory efficiency
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
  }

  recordError(error: any): void {
    this.errors.push({ timestamp: Date.now(), error });
  }

  recordWarning(warning: any): void {
    this.warnings.push({ timestamp: Date.now(), warning });
  }

  getCurrentMetrics(): any {
    const avgProcessingTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length 
      : 0;

    const p95ProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.sort((a, b) => a - b)[Math.floor(this.processingTimes.length * 0.95)]
      : 0;

    return {
      averageProcessingTime: avgProcessingTime,
      p95ProcessingTime,
      totalProcessedChunks: this.processingTimes.length,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      uptime: Date.now() - this.startTime
    };
  }

  getFinalMetrics(): any {
    return {
      ...this.getCurrentMetrics(),
      finalProcessingTimes: [...this.processingTimes],
      allErrors: [...this.errors],
      allWarnings: [...this.warnings]
    };
  }
}

class StreamingAudioProcessor {
  private workflowConfig: WorkflowConfig;
  private languageConfig?: LanguageConfig;

  constructor(workflowConfig: WorkflowConfig) {
    this.workflowConfig = workflowConfig;
    this.languageConfig = workflowConfig.globalSettings?.languageConfig;
  }

  async processAudio(audioChunk: AudioChunk): Promise<Omit<StreamingResponse, 'processingTime' | 'language'>> {
    // This is a placeholder for the actual streaming audio processing
    // In a real implementation, this would:
    // 1. Convert audio to text using streaming STT
    // 2. Process text through AI model
    // 3. Convert response to audio using streaming TTS
    // 4. Return the audio data
    
    return {
      audioData: Buffer.from('placeholder_audio_data'),
      transcript: 'Placeholder transcript',
      confidence: 0.95,
      isPartial: false
    };
  }

  async configureForLanguage(languageConfig: LanguageConfig): Promise<void> {
    this.languageConfig = languageConfig;
    console.log(`[StreamingAudioProcessor] Configured for language: ${languageConfig.primary}`);
  }

  async generateFallbackAudio(message: string): Promise<Buffer> {
    // Generate fallback audio for error cases
    return Buffer.from('fallback_audio_data');
  }
}

export default TwilioConversationRelay;
