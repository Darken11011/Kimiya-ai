import { WorkflowConfig, LanguageConfig, VoiceProvider, getVoicesForLanguage } from '../types/workflowConfig';
import { AudioChunk, StreamingResponse } from './conversationRelay';
import PredictiveResponseCache, { PredictionResult } from './predictiveCache';
import LanguagePerformanceOptimizer from './languageOptimizer';

export interface STTProvider {
  name: string;
  processAudio(audio: Buffer, language: string): Promise<STTResult>;
  processStreamingAudio(audioStream: AsyncIterable<Buffer>, language: string): AsyncIterable<STTResult>;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  isPartial: boolean;
  language: string;
  processingTime: number;
}

export interface AIProvider {
  name: string;
  processText(text: string, context: ConversationContext): Promise<AIResponse>;
  processStreamingText(textStream: AsyncIterable<string>, context: ConversationContext): AsyncIterable<AIResponse>;
}

export interface AIResponse {
  text: string;
  confidence: number;
  isPartial: boolean;
  processingTime: number;
  tokens: number;
}

export interface TTSProvider {
  name: string;
  synthesizeText(text: string, language: string, voiceId: string): Promise<TTSResult>;
  synthesizeStreamingText(textStream: AsyncIterable<string>, language: string, voiceId: string): AsyncIterable<TTSResult>;
}

export interface TTSResult {
  audioData: Buffer;
  duration: number;
  processingTime: number;
  quality: number;
}

export interface ConversationContext {
  callSid: string;
  userId?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  workflowState: any;
  language: string;
  metadata: Record<string, any>;
}

export class StreamingAudioProcessor {
  private workflowConfig: WorkflowConfig;
  private languageConfig?: LanguageConfig;
  private sttProvider: STTProvider;
  private aiProvider: AIProvider;
  private ttsProvider: TTSProvider;
  private context: ConversationContext;
  private predictiveCache: PredictiveResponseCache;
  private languageOptimizer: LanguagePerformanceOptimizer;

  constructor(workflowConfig: WorkflowConfig) {
    this.workflowConfig = workflowConfig;
    this.languageConfig = workflowConfig.globalSettings?.languageConfig;

    // Initialize performance optimization systems
    this.predictiveCache = new PredictiveResponseCache({
      maxCacheSize: 10000,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      semanticThreshold: 0.85
    });

    this.languageOptimizer = new LanguagePerformanceOptimizer();

    // Initialize providers based on configuration
    this.sttProvider = this.createSTTProvider();
    this.aiProvider = this.createAIProvider();
    this.ttsProvider = this.createTTSProvider();

    this.context = {
      callSid: '',
      conversationHistory: [],
      workflowState: {},
      language: workflowConfig.globalSettings?.defaultLanguage || 'en-US',
      metadata: {}
    };

    this.setupPerformanceMonitoring();
  }

  async processAudio(audioChunk: AudioChunk): Promise<Omit<StreamingResponse, 'processingTime' | 'language'>> {
    const startTime = performance.now();

    try {
      // Phase 1: Speech-to-Text with language optimization
      const languageOptimization = await this.languageOptimizer.optimizeForLanguage(
        audioChunk.language || this.context.language,
        this.context
      );

      const sttResult = await this.languageOptimizer.processWithFailover(
        this.context.language,
        (provider) => this.sttProvider.processAudio(audioChunk.data, audioChunk.language || this.context.language),
        'stt'
      );

      // Skip processing if confidence is too low or it's just silence
      if (sttResult.confidence < 0.3 || !sttResult.transcript.trim()) {
        return {
          audioData: Buffer.alloc(0),
          transcript: sttResult.transcript,
          confidence: sttResult.confidence,
          isPartial: sttResult.isPartial
        };
      }

      // Update conversation context
      this.updateConversationContext('user', sttResult.transcript);

      // Phase 2: Check predictive cache first
      const prediction = await this.predictiveCache.predict(sttResult.transcript, this.context);

      if (prediction && prediction.confidence > 0.8) {
        console.log(`[StreamingAudioProcessor] Using cached response (${prediction.source}): ${prediction.confidence}`);

        // Update conversation context with cached response
        this.updateConversationContext('assistant', prediction.response);

        return {
          audioData: prediction.audioData,
          transcript: sttResult.transcript,
          confidence: prediction.confidence,
          isPartial: false
        };
      }

      // Phase 3: AI Processing (if no cache hit)
      const aiResponse = await this.aiProvider.processText(sttResult.transcript, this.context);

      // Update conversation context with AI response
      this.updateConversationContext('assistant', aiResponse.text);

      // Phase 4: Text-to-Speech with language optimization
      const voiceId = this.getOptimalVoiceId(this.context.language, languageOptimization);

      const ttsResult = await this.languageOptimizer.processWithFailover(
        this.context.language,
        (provider) => this.ttsProvider.synthesizeText(aiResponse.text, this.context.language, voiceId),
        'tts'
      );

      // Cache the response for future use
      const totalProcessingTime = performance.now() - startTime;
      await this.predictiveCache.cacheResponse(
        sttResult.transcript,
        aiResponse.text,
        ttsResult.audioData,
        this.context,
        totalProcessingTime
      );

      return {
        audioData: ttsResult.audioData,
        transcript: sttResult.transcript,
        confidence: Math.min(sttResult.confidence, aiResponse.confidence),
        isPartial: sttResult.isPartial || aiResponse.isPartial
      };

    } catch (error) {
      console.error('[StreamingAudioProcessor] Processing failed:', error);

      // Generate error response
      const errorMessage = this.getErrorMessage(this.context.language);
      const errorAudio = await this.generateErrorAudio(errorMessage);

      return {
        audioData: errorAudio,
        transcript: '',
        confidence: 0,
        isPartial: false
      };
    }
  }

  async processStreamingAudio(audioStream: AsyncIterable<AudioChunk>): Promise<AsyncIterable<StreamingResponse>> {
    const processor = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        for await (const audioChunk of audioStream) {
          const startTime = performance.now();
          
          try {
            const result = await processor.processAudio(audioChunk);
            const processingTime = performance.now() - startTime;
            
            yield {
              ...result,
              processingTime,
              language: processor.context.language
            };
            
          } catch (error) {
            console.error('[StreamingAudioProcessor] Streaming processing failed:', error);
            
            const errorAudio = await processor.generateErrorAudio(
              processor.getErrorMessage(processor.context.language)
            );
            
            yield {
              audioData: errorAudio,
              transcript: '',
              confidence: 0,
              isPartial: false,
              processingTime: performance.now() - startTime,
              language: processor.context.language
            };
          }
        }
      }
    };
  }

  private createSTTProvider(): STTProvider {
    const provider = this.workflowConfig.transcription?.provider || 'deepgram';
    
    switch (provider) {
      case 'deepgram':
        return new DeepgramSTTProvider(this.workflowConfig.transcription?.deepgram);
      case 'azure':
        return new AzureSTTProvider(this.workflowConfig.transcription?.azure);
      case 'whisper':
        return new WhisperSTTProvider(this.workflowConfig.transcription?.whisper);
      default:
        return new DeepgramSTTProvider(this.workflowConfig.transcription?.deepgram);
    }
  }

  private createAIProvider(): AIProvider {
    const provider = this.workflowConfig.llm?.provider || 'openai';
    
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(this.workflowConfig.llm?.openAI);
      case 'anthropic':
        return new AnthropicProvider(this.workflowConfig.llm?.anthropic);
      case 'azure_openai':
        return new AzureOpenAIProvider(this.workflowConfig.llm?.azure);
      default:
        return new OpenAIProvider(this.workflowConfig.llm?.openAI);
    }
  }

  private createTTSProvider(): TTSProvider {
    const provider = this.workflowConfig.voice?.provider || VoiceProvider.ELEVEN_LABS;
    
    switch (provider) {
      case VoiceProvider.ELEVEN_LABS:
        return new ElevenLabsTTSProvider(this.workflowConfig.voice?.elevenLabs);
      case VoiceProvider.AZURE:
        return new AzureTTSProvider(this.workflowConfig.voice?.azure);
      case VoiceProvider.GOOGLE_CLOUD:
        return new GoogleCloudTTSProvider(this.workflowConfig.voice?.googleCloud);
      default:
        return new ElevenLabsTTSProvider(this.workflowConfig.voice?.elevenLabs);
    }
  }

  private getOptimalVoiceId(language: string, optimization?: any): string {
    // Use optimization if available
    if (optimization?.voiceId) {
      return optimization.voiceId;
    }

    const provider = this.workflowConfig.voice?.provider || VoiceProvider.ELEVEN_LABS;
    const voices = getVoicesForLanguage(language, provider);

    // Prefer recommended voices
    const recommendedVoice = voices.find(voice => voice.recommended);
    if (recommendedVoice) {
      return recommendedVoice.id;
    }

    // Fallback to first available voice
    return voices.length > 0 ? voices[0].id : 'default';
  }

  private setupPerformanceMonitoring(): void {
    // Monitor cache performance
    this.predictiveCache.on('cacheUpdated', (data) => {
      console.log(`[StreamingAudioProcessor] Cache updated. Size: ${data.cacheSize}`);
    });

    this.predictiveCache.on('cacheCleanup', (data) => {
      console.log(`[StreamingAudioProcessor] Cache cleanup: ${data.removedCount} entries removed`);
    });

    // Monitor language optimization performance
    this.languageOptimizer.on('languageOptimized', (data) => {
      console.log(`[StreamingAudioProcessor] Language optimized: ${data.language} in ${data.optimizationTime}ms`);
    });

    this.languageOptimizer.on('performanceAlert', (data) => {
      console.warn(`[StreamingAudioProcessor] Performance alert:`, data);
    });

    this.languageOptimizer.on('providerFailure', (data) => {
      console.error(`[StreamingAudioProcessor] Provider failure:`, data);
    });
  }

  private updateConversationContext(role: 'user' | 'assistant', content: string): void {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });
    
    // Keep only last 10 messages for memory efficiency
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
    }
  }

  private getErrorMessage(language: string): string {
    const errorMessages: Record<string, string> = {
      'en-US': "I'm sorry, I didn't catch that. Could you please repeat?",
      'zh-HK': '唔好意思，我聽唔清楚，可以再講一次嗎？',
      'zh-CN': '抱歉，我没听清楚，您能再说一遍吗？',
      'es-ES': 'Lo siento, no te he entendido. ¿Puedes repetir?',
      'fr-FR': 'Désolé, je n\'ai pas compris. Pouvez-vous répéter?',
      'ja-JP': 'すみません、聞き取れませんでした。もう一度お願いします。',
      'ko-KR': '죄송합니다. 잘 들리지 않았습니다. 다시 말씀해 주시겠어요?'
    };
    
    return errorMessages[language] || errorMessages['en-US'];
  }

  private async generateErrorAudio(message: string): Promise<Buffer> {
    try {
      const voiceId = this.getOptimalVoiceId(this.context.language);
      const ttsResult = await this.ttsProvider.synthesizeText(message, this.context.language, voiceId);
      return ttsResult.audioData;
    } catch (error) {
      console.error('[StreamingAudioProcessor] Error audio generation failed:', error);
      // Return empty buffer as last resort
      return Buffer.alloc(0);
    }
  }

  async configureForLanguage(languageConfig: LanguageConfig): Promise<void> {
    this.languageConfig = languageConfig;
    this.context.language = languageConfig.primary;
    
    // Reconfigure providers if needed for language-specific optimizations
    if (languageConfig.specialLanguages?.[languageConfig.primary]) {
      const specialConfig = languageConfig.specialLanguages[languageConfig.primary];
      console.log(`[StreamingAudioProcessor] Applying special optimizations for ${languageConfig.primary}:`, specialConfig);
    }
  }

  async generateFallbackAudio(message: string): Promise<Buffer> {
    return this.generateErrorAudio(message);
  }

  setContext(context: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): ConversationContext {
    return { ...this.context };
  }
}

// Placeholder provider implementations
class DeepgramSTTProvider implements STTProvider {
  name = 'deepgram';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processAudio(audio: Buffer, language: string): Promise<STTResult> {
    const startTime = performance.now();
    // Placeholder implementation
    return {
      transcript: 'Placeholder transcript from Deepgram',
      confidence: 0.95,
      isPartial: false,
      language,
      processingTime: performance.now() - startTime
    };
  }

  async *processStreamingAudio(audioStream: AsyncIterable<Buffer>, language: string): AsyncIterable<STTResult> {
    for await (const audio of audioStream) {
      yield await this.processAudio(audio, language);
    }
  }
}

class AzureSTTProvider implements STTProvider {
  name = 'azure';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processAudio(audio: Buffer, language: string): Promise<STTResult> {
    const startTime = performance.now();
    // Placeholder implementation with Cantonese optimization
    const isCantonese = language.startsWith('zh-HK') || language.startsWith('zh-MO');
    
    return {
      transcript: isCantonese ? 'Placeholder Cantonese transcript from Azure' : 'Placeholder transcript from Azure',
      confidence: isCantonese ? 0.98 : 0.95, // Higher confidence for optimized languages
      isPartial: false,
      language,
      processingTime: performance.now() - startTime
    };
  }

  async *processStreamingAudio(audioStream: AsyncIterable<Buffer>, language: string): AsyncIterable<STTResult> {
    for await (const audio of audioStream) {
      yield await this.processAudio(audio, language);
    }
  }
}

class WhisperSTTProvider implements STTProvider {
  name = 'whisper';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processAudio(audio: Buffer, language: string): Promise<STTResult> {
    const startTime = performance.now();
    return {
      transcript: 'Placeholder transcript from Whisper',
      confidence: 0.92,
      isPartial: false,
      language,
      processingTime: performance.now() - startTime
    };
  }

  async *processStreamingAudio(audioStream: AsyncIterable<Buffer>, language: string): AsyncIterable<STTResult> {
    for await (const audio of audioStream) {
      yield await this.processAudio(audio, language);
    }
  }
}

class OpenAIProvider implements AIProvider {
  name = 'openai';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processText(text: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = performance.now();
    return {
      text: `AI response to: "${text}"`,
      confidence: 0.95,
      isPartial: false,
      processingTime: performance.now() - startTime,
      tokens: 50
    };
  }

  async *processStreamingText(textStream: AsyncIterable<string>, context: ConversationContext): AsyncIterable<AIResponse> {
    for await (const text of textStream) {
      yield await this.processText(text, context);
    }
  }
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processText(text: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = performance.now();
    return {
      text: `Claude response to: "${text}"`,
      confidence: 0.96,
      isPartial: false,
      processingTime: performance.now() - startTime,
      tokens: 45
    };
  }

  async *processStreamingText(textStream: AsyncIterable<string>, context: ConversationContext): AsyncIterable<AIResponse> {
    for await (const text of textStream) {
      yield await this.processText(text, context);
    }
  }
}

class AzureOpenAIProvider implements AIProvider {
  name = 'azure_openai';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async processText(text: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = performance.now();
    return {
      text: `Azure OpenAI response to: "${text}"`,
      confidence: 0.95,
      isPartial: false,
      processingTime: performance.now() - startTime,
      tokens: 48
    };
  }

  async *processStreamingText(textStream: AsyncIterable<string>, context: ConversationContext): AsyncIterable<AIResponse> {
    for await (const text of textStream) {
      yield await this.processText(text, context);
    }
  }
}

class ElevenLabsTTSProvider implements TTSProvider {
  name = 'elevenlabs';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async synthesizeText(text: string, language: string, voiceId: string): Promise<TTSResult> {
    const startTime = performance.now();
    return {
      audioData: Buffer.from(`ElevenLabs audio for: "${text}"`),
      duration: text.length * 50, // Rough estimate
      processingTime: performance.now() - startTime,
      quality: 0.95
    };
  }

  async *synthesizeStreamingText(textStream: AsyncIterable<string>, language: string, voiceId: string): AsyncIterable<TTSResult> {
    for await (const text of textStream) {
      yield await this.synthesizeText(text, language, voiceId);
    }
  }
}

class AzureTTSProvider implements TTSProvider {
  name = 'azure';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async synthesizeText(text: string, language: string, voiceId: string): Promise<TTSResult> {
    const startTime = performance.now();
    const isCantonese = language.startsWith('zh-HK') || language.startsWith('zh-MO');
    
    return {
      audioData: Buffer.from(`Azure TTS audio for: "${text}"`),
      duration: text.length * (isCantonese ? 60 : 50), // Cantonese might be slightly longer
      processingTime: performance.now() - startTime,
      quality: isCantonese ? 0.98 : 0.95 // Higher quality for optimized languages
    };
  }

  async *synthesizeStreamingText(textStream: AsyncIterable<string>, language: string, voiceId: string): AsyncIterable<TTSResult> {
    for await (const text of textStream) {
      yield await this.synthesizeText(text, language, voiceId);
    }
  }
}

class GoogleCloudTTSProvider implements TTSProvider {
  name = 'google_cloud';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async synthesizeText(text: string, language: string, voiceId: string): Promise<TTSResult> {
    const startTime = performance.now();
    return {
      audioData: Buffer.from(`Google Cloud TTS audio for: "${text}"`),
      duration: text.length * 55,
      processingTime: performance.now() - startTime,
      quality: 0.93
    };
  }

  async *synthesizeStreamingText(textStream: AsyncIterable<string>, language: string, voiceId: string): AsyncIterable<TTSResult> {
    for await (const text of textStream) {
      yield await this.synthesizeText(text, language, voiceId);
    }
  }
}
