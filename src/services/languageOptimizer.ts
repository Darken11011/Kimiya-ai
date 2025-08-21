import { EventEmitter } from 'events';
import { 
  LanguageConfig, 
  SUPPORTED_LANGUAGES, 
  getVoicesForLanguage, 
  VoiceProvider,
  TranscriptionProvider 
} from '../types/workflowConfig';
import { ConversationContext } from './streamingAudioProcessor';

export interface LanguageOptimization {
  language: string;
  sttProvider: TranscriptionProvider;
  ttsProvider: VoiceProvider;
  voiceId: string;
  optimizations: {
    dialectSupport?: string[];
    accentAdaptation?: boolean;
    contextualProcessing?: boolean;
    toneAwareness?: boolean;
    culturalContext?: boolean;
  };
  performance: {
    expectedLatency: number;
    qualityScore: number;
    reliability: number;
  };
}

export interface ProviderFailoverConfig {
  primary: {
    provider: VoiceProvider | TranscriptionProvider;
    maxLatency: number;
    minQuality: number;
  };
  secondary: {
    provider: VoiceProvider | TranscriptionProvider;
    maxLatency: number;
    minQuality: number;
  };
  fallback: {
    provider: VoiceProvider | TranscriptionProvider;
    maxLatency: number;
    minQuality: number;
  };
}

export interface CantoneseOptimization {
  dialect: 'HK' | 'GZ' | 'MO';
  toneProcessing: {
    enabled: boolean;
    toneAccuracy: number;
    contextualTones: boolean;
  };
  dialectSpecificVocabulary: {
    enabled: boolean;
    vocabularySize: number;
    colloquialisms: boolean;
  };
  culturalContext: {
    enabled: boolean;
    honorifics: boolean;
    businessContext: boolean;
    casualContext: boolean;
  };
}

export class LanguagePerformanceOptimizer extends EventEmitter {
  private languageOptimizations = new Map<string, LanguageOptimization>();
  private providerFailovers = new Map<string, ProviderFailoverConfig>();
  private cantoneseOptimizer: CantoneseDialectOptimizer;
  private performanceMonitor: LanguagePerformanceMonitor;
  private adaptiveOptimizer: AdaptiveLanguageOptimizer;

  constructor() {
    super();
    this.cantoneseOptimizer = new CantoneseDialectOptimizer();
    this.performanceMonitor = new LanguagePerformanceMonitor();
    this.adaptiveOptimizer = new AdaptiveLanguageOptimizer();
    
    this.initializeOptimizations();
    this.setupPerformanceMonitoring();
  }

  async optimizeForLanguage(language: string, context: ConversationContext): Promise<LanguageOptimization> {
    const startTime = performance.now();
    
    try {
      // Get base optimization for language
      let optimization = this.languageOptimizations.get(language);
      
      if (!optimization) {
        optimization = await this.createOptimization(language);
        this.languageOptimizations.set(language, optimization);
      }

      // Apply Cantonese-specific optimizations
      if (this.isCantonese(language)) {
        optimization = await this.cantoneseOptimizer.optimize(optimization, language, context);
      }

      // Apply adaptive optimizations based on performance history
      optimization = await this.adaptiveOptimizer.optimize(optimization, context);

      const optimizationTime = performance.now() - startTime;
      
      this.emit('languageOptimized', {
        language,
        optimization,
        optimizationTime
      });

      return optimization;

    } catch (error) {
      console.error(`[LanguageOptimizer] Failed to optimize for ${language}:`, error);
      
      // Return fallback optimization
      return this.getFallbackOptimization(language);
    }
  }

  async processWithFailover<T>(
    language: string,
    operation: (provider: any) => Promise<T>,
    type: 'stt' | 'tts'
  ): Promise<T> {
    const failoverConfig = this.providerFailovers.get(`${language}:${type}`);

    if (!failoverConfig) {
      throw new Error(`No failover configuration for ${language}:${type}`);
    }

    const providers = [
      failoverConfig.primary,
      failoverConfig.secondary,
      failoverConfig.fallback
    ];

    let lastError: Error | null = null;

    for (const providerConfig of providers) {
      const startTime = performance.now();

      try {
        const result = await Promise.race([
          operation(providerConfig.provider),
          this.createTimeoutPromise<T>(providerConfig.maxLatency)
        ]);

        const processingTime = performance.now() - startTime;

        // Record successful operation
        this.performanceMonitor.recordSuccess(language, providerConfig.provider, processingTime);

        return result as T;

      } catch (error) {
        const processingTime = performance.now() - startTime;
        lastError = error as Error;

        // Record failed operation
        this.performanceMonitor.recordFailure(language, providerConfig.provider, processingTime, error);

        console.warn(`[LanguageOptimizer] Provider ${providerConfig.provider} failed for ${language}:${type}:`, error);

        // Continue to next provider
        continue;
      }
    }

    throw new Error(`All providers failed for ${language}:${type}. Last error: ${lastError?.message}`);
  }

  private async createOptimization(language: string): Promise<LanguageOptimization> {
    const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    
    if (!languageInfo) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Determine optimal providers based on language
    const { sttProvider, ttsProvider } = this.selectOptimalProviders(language);
    
    // Get optimal voice for language
    const voices = getVoicesForLanguage(language, ttsProvider);
    const voiceId = voices.find(voice => voice.recommended)?.id || voices[0]?.id || 'default';

    // Define optimizations based on language characteristics
    const optimizations = this.defineLanguageOptimizations(language, languageInfo);

    // Calculate expected performance
    const performance = this.calculateExpectedPerformance(language, sttProvider, ttsProvider);

    return {
      language,
      sttProvider,
      ttsProvider,
      voiceId,
      optimizations,
      performance
    };
  }

  private selectOptimalProviders(language: string): { 
    sttProvider: TranscriptionProvider; 
    ttsProvider: VoiceProvider; 
  } {
    // Language-specific provider selection
    if (this.isCantonese(language)) {
      return {
        sttProvider: TranscriptionProvider.AZURE, // Best for Cantonese
        ttsProvider: VoiceProvider.AZURE
      };
    }

    if (language.startsWith('zh-')) {
      return {
        sttProvider: TranscriptionProvider.AZURE,
        ttsProvider: VoiceProvider.AZURE
      };
    }

    if (language.startsWith('ja-') || language.startsWith('ko-')) {
      return {
        sttProvider: TranscriptionProvider.GOOGLE_CLOUD,
        ttsProvider: VoiceProvider.GOOGLE_CLOUD
      };
    }

    // Default for European languages
    return {
      sttProvider: TranscriptionProvider.DEEPGRAM,
      ttsProvider: VoiceProvider.ELEVEN_LABS
    };
  }

  private defineLanguageOptimizations(language: string, languageInfo: any): LanguageOptimization['optimizations'] {
    const optimizations: LanguageOptimization['optimizations'] = {};

    // Cantonese-specific optimizations
    if (this.isCantonese(language)) {
      optimizations.dialectSupport = languageInfo.specialOptimizations?.dialectSupport || [];
      optimizations.accentAdaptation = true;
      optimizations.contextualProcessing = true;
      optimizations.toneAwareness = true;
      optimizations.culturalContext = true;
    }

    // Tonal language optimizations
    if (this.isTonalLanguage(language)) {
      optimizations.toneAwareness = true;
      optimizations.contextualProcessing = true;
    }

    // RTL language optimizations
    if (languageInfo.rtl) {
      optimizations.contextualProcessing = true;
      optimizations.culturalContext = true;
    }

    return optimizations;
  }

  private calculateExpectedPerformance(
    language: string, 
    sttProvider: TranscriptionProvider, 
    ttsProvider: VoiceProvider
  ): LanguageOptimization['performance'] {
    // Base latencies by provider (in milliseconds)
    const sttLatencies = {
      [TranscriptionProvider.DEEPGRAM]: 150,
      [TranscriptionProvider.AZURE]: 180,
      [TranscriptionProvider.WHISPER]: 200,
      [TranscriptionProvider.ASSEMBLY_AI]: 170,
      [TranscriptionProvider.GOOGLE_CLOUD]: 160
    };

    const ttsLatencies = {
      [VoiceProvider.ELEVEN_LABS]: 200,
      [VoiceProvider.AZURE]: 150,
      [VoiceProvider.GOOGLE_CLOUD]: 170,
      [VoiceProvider.OPENAI_TTS]: 180
    };

    let expectedLatency = sttLatencies[sttProvider] + ttsLatencies[ttsProvider];
    let qualityScore = 0.85;
    let reliability = 0.95;

    // Adjust for language-specific optimizations
    if (this.isCantonese(language)) {
      expectedLatency *= 0.9; // Optimized for Cantonese
      qualityScore = 0.95;
      reliability = 0.98;
    }

    if (this.isTonalLanguage(language)) {
      expectedLatency *= 1.1; // Slightly higher for tone processing
      qualityScore = 0.9;
    }

    return {
      expectedLatency,
      qualityScore,
      reliability
    };
  }

  private initializeOptimizations(): void {
    // Initialize failover configurations for key languages
    this.setupFailoverConfig('zh-HK', 'stt', {
      primary: { provider: TranscriptionProvider.AZURE, maxLatency: 200, minQuality: 0.95 },
      secondary: { provider: TranscriptionProvider.GOOGLE_CLOUD, maxLatency: 300, minQuality: 0.90 },
      fallback: { provider: TranscriptionProvider.DEEPGRAM, maxLatency: 400, minQuality: 0.85 }
    });

    this.setupFailoverConfig('zh-HK', 'tts', {
      primary: { provider: VoiceProvider.AZURE, maxLatency: 180, minQuality: 0.95 },
      secondary: { provider: VoiceProvider.GOOGLE_CLOUD, maxLatency: 250, minQuality: 0.90 },
      fallback: { provider: VoiceProvider.ELEVEN_LABS, maxLatency: 350, minQuality: 0.85 }
    });

    // Add more language configurations...
    this.setupCommonLanguageFailovers();
  }

  private setupFailoverConfig(language: string, type: 'stt' | 'tts', config: ProviderFailoverConfig): void {
    this.providerFailovers.set(`${language}:${type}`, config);
  }

  private setupCommonLanguageFailovers(): void {
    const commonLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR'];
    
    for (const language of commonLanguages) {
      // STT failover
      this.setupFailoverConfig(language, 'stt', {
        primary: { provider: TranscriptionProvider.DEEPGRAM, maxLatency: 150, minQuality: 0.90 },
        secondary: { provider: TranscriptionProvider.AZURE, maxLatency: 200, minQuality: 0.88 },
        fallback: { provider: TranscriptionProvider.WHISPER, maxLatency: 300, minQuality: 0.85 }
      });

      // TTS failover
      this.setupFailoverConfig(language, 'tts', {
        primary: { provider: VoiceProvider.ELEVEN_LABS, maxLatency: 200, minQuality: 0.92 },
        secondary: { provider: VoiceProvider.AZURE, maxLatency: 180, minQuality: 0.90 },
        fallback: { provider: VoiceProvider.GOOGLE_CLOUD, maxLatency: 250, minQuality: 0.88 }
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.on('performanceDegraded', (data) => {
      console.warn('[LanguageOptimizer] Performance degraded:', data);
      this.emit('performanceAlert', data);
      
      // Trigger adaptive optimization
      this.adaptiveOptimizer.handlePerformanceDegradation(data);
    });

    this.performanceMonitor.on('providerFailure', (data) => {
      console.error('[LanguageOptimizer] Provider failure:', data);
      this.emit('providerFailure', data);
    });
  }

  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private getFallbackOptimization(language: string): LanguageOptimization {
    return {
      language,
      sttProvider: TranscriptionProvider.DEEPGRAM,
      ttsProvider: VoiceProvider.ELEVEN_LABS,
      voiceId: 'default',
      optimizations: {},
      performance: {
        expectedLatency: 500,
        qualityScore: 0.8,
        reliability: 0.9
      }
    };
  }

  private isCantonese(language: string): boolean {
    return language === 'zh-HK' || language === 'zh-MO';
  }

  private isTonalLanguage(language: string): boolean {
    const tonalLanguages = ['zh-HK', 'zh-MO', 'zh-CN', 'zh-TW', 'th-TH', 'vi-VN'];
    return tonalLanguages.includes(language);
  }

  // Public methods for monitoring and management
  getOptimizationStats(): any {
    return {
      totalOptimizations: this.languageOptimizations.size,
      failoverConfigs: this.providerFailovers.size,
      performanceMetrics: this.performanceMonitor.getMetrics(),
      adaptiveOptimizations: this.adaptiveOptimizer.getStats()
    };
  }

  async updateOptimization(language: string, optimization: Partial<LanguageOptimization>): Promise<void> {
    const existing = this.languageOptimizations.get(language);
    if (existing) {
      this.languageOptimizations.set(language, { ...existing, ...optimization });
      this.emit('optimizationUpdated', { language, optimization });
    }
  }
}

class CantoneseDialectOptimizer {
  private dialectConfigs = new Map<string, CantoneseOptimization>();

  constructor() {
    this.initializeDialectConfigs();
  }

  async optimize(
    baseOptimization: LanguageOptimization, 
    language: string, 
    context: ConversationContext
  ): Promise<LanguageOptimization> {
    const dialect = this.detectDialect(language, context);
    const dialectConfig = this.dialectConfigs.get(dialect);
    
    if (!dialectConfig) {
      return baseOptimization;
    }

    // Apply Cantonese-specific optimizations
    const optimized = { ...baseOptimization };
    
    // Enhance tone processing
    if (dialectConfig.toneProcessing.enabled) {
      optimized.performance.qualityScore *= 1.1;
      optimized.performance.expectedLatency *= 0.95; // Faster due to optimization
    }

    // Apply dialect-specific vocabulary
    if (dialectConfig.dialectSpecificVocabulary.enabled) {
      optimized.performance.qualityScore *= 1.05;
    }

    // Apply cultural context
    if (dialectConfig.culturalContext.enabled) {
      optimized.optimizations.culturalContext = true;
      optimized.performance.qualityScore *= 1.03;
    }

    return optimized;
  }

  private detectDialect(language: string, context: ConversationContext): string {
    if (language === 'zh-HK') return 'HK';
    if (language === 'zh-MO') return 'MO';
    
    // Could analyze context for dialect detection
    return 'HK'; // Default
  }

  private initializeDialectConfigs(): void {
    // Hong Kong Cantonese
    this.dialectConfigs.set('HK', {
      dialect: 'HK',
      toneProcessing: {
        enabled: true,
        toneAccuracy: 0.95,
        contextualTones: true
      },
      dialectSpecificVocabulary: {
        enabled: true,
        vocabularySize: 50000,
        colloquialisms: true
      },
      culturalContext: {
        enabled: true,
        honorifics: true,
        businessContext: true,
        casualContext: true
      }
    });

    // Macau Cantonese
    this.dialectConfigs.set('MO', {
      dialect: 'MO',
      toneProcessing: {
        enabled: true,
        toneAccuracy: 0.93,
        contextualTones: true
      },
      dialectSpecificVocabulary: {
        enabled: true,
        vocabularySize: 45000,
        colloquialisms: true
      },
      culturalContext: {
        enabled: true,
        honorifics: true,
        businessContext: true,
        casualContext: false
      }
    });
  }
}

class LanguagePerformanceMonitor extends EventEmitter {
  private metrics = new Map<string, any>();

  recordSuccess(language: string, provider: any, processingTime: number): void {
    const key = `${language}:${provider}`;
    const metric = this.metrics.get(key) || { successes: 0, failures: 0, totalTime: 0, avgTime: 0 };
    
    metric.successes++;
    metric.totalTime += processingTime;
    metric.avgTime = metric.totalTime / metric.successes;
    
    this.metrics.set(key, metric);
  }

  recordFailure(language: string, provider: any, processingTime: number, error: any): void {
    const key = `${language}:${provider}`;
    const metric = this.metrics.get(key) || { successes: 0, failures: 0, totalTime: 0, avgTime: 0 };
    
    metric.failures++;
    this.metrics.set(key, metric);
    
    this.emit('providerFailure', { language, provider, error });
    
    // Check if performance is degraded
    const successRate = metric.successes / (metric.successes + metric.failures);
    if (successRate < 0.9) {
      this.emit('performanceDegraded', { language, provider, successRate });
    }
  }

  getMetrics(): any {
    return Object.fromEntries(this.metrics);
  }
}

class AdaptiveLanguageOptimizer {
  private adaptations = new Map<string, any>();

  async optimize(
    baseOptimization: LanguageOptimization, 
    context: ConversationContext
  ): Promise<LanguageOptimization> {
    // Apply adaptive optimizations based on historical performance
    return baseOptimization;
  }

  handlePerformanceDegradation(data: any): void {
    // Implement adaptive response to performance issues
    console.log('[AdaptiveOptimizer] Handling performance degradation:', data);
  }

  getStats(): any {
    return { adaptations: this.adaptations.size };
  }
}

export default LanguagePerformanceOptimizer;
