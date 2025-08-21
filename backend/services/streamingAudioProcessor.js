const EventEmitter = require('events');

/**
 * Streaming Audio Processor
 * Handles real-time audio processing with optimization
 */
class StreamingAudioProcessor extends EventEmitter {
  constructor(workflowConfig, config = {}) {
    super();
    
    this.workflowConfig = workflowConfig;
    this.config = {
      sampleRate: config.sampleRate || 8000,
      audioFormat: config.audioFormat || 'mulaw',
      bufferSize: config.bufferSize || 1024,
      enableNoiseReduction: config.enableNoiseReduction !== false, // Default true
      enableEchoCancellation: config.enableEchoCancellation !== false, // Default true
      enableVAD: config.enableVAD !== false, // Voice Activity Detection - Default true
      streamingMode: config.streamingMode || 'bidirectional',
      ...config
    };

    // Audio processing state
    this.isProcessing = false;
    this.audioBuffer = [];
    this.processingQueue = [];
    this.languageConfig = workflowConfig?.globalSettings?.languageConfig;
    
    // Performance metrics
    this.metrics = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      errorCount: 0
    };

    console.log('[StreamingAudioProcessor] Initialized with config:', {
      sampleRate: this.config.sampleRate,
      audioFormat: this.config.audioFormat,
      streamingMode: this.config.streamingMode,
      optimizations: {
        noiseReduction: this.config.enableNoiseReduction,
        echoCancellation: this.config.enableEchoCancellation,
        voiceActivityDetection: this.config.enableVAD
      }
    });
  }

  /**
   * Process audio chunk through optimized pipeline
   */
  async processAudio(audioChunk) {
    const startTime = performance.now();
    
    try {
      console.log(`[StreamingAudioProcessor] Processing audio chunk: ${audioChunk.data?.length || 0} bytes`);
      
      // Validate audio chunk
      if (!audioChunk || !audioChunk.data) {
        throw new Error('Invalid audio chunk data');
      }

      // Apply audio optimizations
      const optimizedAudio = await this.applyAudioOptimizations(audioChunk);
      
      // Process through speech-to-text (simulated)
      const transcript = await this.processSTT(optimizedAudio);
      
      // Process through AI (would integrate with your existing Azure OpenAI)
      const aiResponse = await this.processAI(transcript, audioChunk.language || 'en-US');
      
      // Process through text-to-speech (simulated)
      const responseAudio = await this.processTTS(aiResponse, audioChunk.language || 'en-US');
      
      const processingTime = performance.now() - startTime;
      
      // Update metrics
      this.updateMetrics(processingTime);
      
      const result = {
        audioData: responseAudio,
        transcript: transcript,
        response: aiResponse,
        confidence: optimizedAudio.confidence || 0.95,
        isPartial: false,
        processingTime,
        language: audioChunk.language || 'en-US',
        optimizations: this.getAppliedOptimizations()
      };

      console.log(`[StreamingAudioProcessor] Audio processed in ${processingTime.toFixed(2)}ms`);
      
      this.emit('audioProcessed', {
        processingTime,
        confidence: result.confidence,
        language: result.language,
        optimizations: result.optimizations
      });

      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      console.error('[StreamingAudioProcessor] Audio processing failed:', error);
      
      this.metrics.errorCount++;
      
      this.emit('processingError', {
        error,
        processingTime,
        audioChunk
      });

      // Return error response
      return {
        audioData: Buffer.alloc(0),
        transcript: '',
        response: this.getErrorResponse(audioChunk.language || 'en-US'),
        confidence: 0,
        isPartial: false,
        processingTime,
        language: audioChunk.language || 'en-US',
        error: error.message
      };
    }
  }

  /**
   * Configure processor for specific language
   */
  async configureForLanguage(languageConfig) {
    try {
      this.languageConfig = languageConfig;
      
      console.log(`[StreamingAudioProcessor] Configured for language: ${languageConfig.primary}`);
      
      // Apply language-specific audio processing settings
      if (languageConfig.audioSettings) {
        this.config = { ...this.config, ...languageConfig.audioSettings };
      }

      this.emit('languageConfigured', {
        language: languageConfig.primary,
        config: this.config
      });

    } catch (error) {
      console.error('[StreamingAudioProcessor] Language configuration failed:', error);
      this.emit('configurationError', { error, languageConfig });
    }
  }

  /**
   * Generate fallback audio for error cases
   */
  async generateFallbackAudio(message, language = 'en-US') {
    try {
      console.log(`[StreamingAudioProcessor] Generating fallback audio for: ${message.substring(0, 50)}...`);
      
      // This would integrate with your TTS service
      // For now, return a placeholder buffer
      const fallbackAudio = Buffer.from(`fallback_audio_${language}_${Date.now()}`);
      
      return fallbackAudio;

    } catch (error) {
      console.error('[StreamingAudioProcessor] Fallback audio generation failed:', error);
      return Buffer.alloc(0);
    }
  }

  /**
   * Get processing metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.totalProcessed > 0 
        ? this.metrics.totalProcessingTime / this.metrics.totalProcessed 
        : 0,
      errorRate: this.metrics.totalProcessed > 0 
        ? this.metrics.errorCount / this.metrics.totalProcessed 
        : 0
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      errorCount: 0
    };
    
    console.log('[StreamingAudioProcessor] Metrics reset');
  }

  // Private helper methods
  async applyAudioOptimizations(audioChunk) {
    let optimizedData = audioChunk.data;
    let confidence = 0.95;

    // Apply noise reduction
    if (this.config.enableNoiseReduction) {
      optimizedData = await this.applyNoiseReduction(optimizedData);
    }

    // Apply echo cancellation
    if (this.config.enableEchoCancellation) {
      optimizedData = await this.applyEchoCancellation(optimizedData);
    }

    // Voice activity detection
    if (this.config.enableVAD) {
      const hasVoice = await this.detectVoiceActivity(optimizedData);
      if (!hasVoice) {
        confidence = 0;
      }
    }

    return {
      ...audioChunk,
      data: optimizedData,
      confidence
    };
  }

  async applyNoiseReduction(audioData) {
    // Placeholder for noise reduction algorithm
    // In production, you'd use a real noise reduction library
    console.log('[StreamingAudioProcessor] Applying noise reduction');
    return audioData;
  }

  async applyEchoCancellation(audioData) {
    // Placeholder for echo cancellation algorithm
    // In production, you'd use a real echo cancellation library
    console.log('[StreamingAudioProcessor] Applying echo cancellation');
    return audioData;
  }

  async detectVoiceActivity(audioData) {
    // Placeholder for voice activity detection
    // In production, you'd use a real VAD algorithm
    const hasVoice = audioData && audioData.length > 0;
    console.log(`[StreamingAudioProcessor] Voice activity detected: ${hasVoice}`);
    return hasVoice;
  }

  async processSTT(audioChunk) {
    // Placeholder for speech-to-text processing
    // This would integrate with Azure Speech Services or similar
    console.log('[StreamingAudioProcessor] Processing STT');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return 'Transcribed speech from audio';
  }

  async processAI(transcript, language) {
    // Placeholder for AI processing
    // This would integrate with your existing Azure OpenAI logic from twiml-ai.js
    console.log(`[StreamingAudioProcessor] Processing AI for language: ${language}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responses = {
      'en-US': 'Thank you for your message. How can I help you today?',
      'zh-HK': '多謝你嘅訊息。我可以點樣幫到你？',
      'zh-CN': '谢谢您的消息。我可以怎样帮助您？',
      'es-ES': 'Gracias por tu mensaje. ¿Cómo puedo ayudarte hoy?',
      'fr-FR': 'Merci pour votre message. Comment puis-je vous aider aujourd\'hui?'
    };
    
    return responses[language] || responses['en-US'];
  }

  async processTTS(text, language) {
    // Placeholder for text-to-speech processing
    // This would integrate with Azure Speech Services or similar
    console.log(`[StreamingAudioProcessor] Processing TTS for language: ${language}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 75));
    
    // Return placeholder audio data
    return Buffer.from(`tts_audio_${language}_${Date.now()}`);
  }

  getErrorResponse(language) {
    const errorMessages = {
      'en-US': "I'm sorry, I'm having trouble processing your audio. Could you please try again?",
      'zh-HK': '唔好意思，我處理你嘅聲音時遇到困難。可以再試一次嗎？',
      'zh-CN': '抱歉，我在处理您的音频时遇到了困难。您能再试一次吗？',
      'es-ES': 'Lo siento, tengo problemas para procesar tu audio. ¿Puedes intentarlo de nuevo?',
      'fr-FR': 'Désolé, j\'ai des difficultés à traiter votre audio. Pouvez-vous réessayer?'
    };
    
    return errorMessages[language] || errorMessages['en-US'];
  }

  getAppliedOptimizations() {
    const optimizations = [];
    
    if (this.config.enableNoiseReduction) optimizations.push('noise_reduction');
    if (this.config.enableEchoCancellation) optimizations.push('echo_cancellation');
    if (this.config.enableVAD) optimizations.push('voice_activity_detection');
    if (this.config.streamingMode === 'bidirectional') optimizations.push('bidirectional_streaming');
    
    return optimizations;
  }

  updateMetrics(processingTime) {
    this.metrics.totalProcessed++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.totalProcessed;
  }
}

module.exports = StreamingAudioProcessor;
