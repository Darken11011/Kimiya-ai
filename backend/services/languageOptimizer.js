const EventEmitter = require('events');

/**
 * Language Performance Optimizer
 * Optimizes processing for 50+ languages with Cantonese specialization
 */
class LanguageOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabledLanguages: config.enabledLanguages || this.getDefaultLanguages(),
      cantoneseOptimization: config.cantoneseOptimization !== false, // Default true
      responseOptimization: config.responseOptimization !== false, // Default true
      cacheByLanguage: config.cacheByLanguage !== false, // Default true
      ...config
    };

    // Language-specific configurations
    this.languageConfigs = this.initializeLanguageConfigs();
    
    // Performance tracking
    this.languageStats = new Map();
    
    console.log('[LanguageOptimizer] Initialized with support for', this.config.enabledLanguages.length, 'languages');
    
    if (this.config.cantoneseOptimization) {
      console.log('[LanguageOptimizer] Cantonese specialization enabled');
    }
  }

  /**
   * Optimize processing for a specific language
   */
  async optimizeForLanguage(language, context = {}) {
    try {
      const startTime = performance.now();
      
      // Get language configuration
      const langConfig = this.getLanguageConfig(language);
      
      if (!langConfig) {
        console.warn(`[LanguageOptimizer] Unsupported language: ${language}, falling back to en-US`);
        language = 'en-US';
      }

      // Apply language-specific optimizations
      const optimizations = await this.applyLanguageOptimizations(language, context);
      
      const processingTime = performance.now() - startTime;
      
      // Update statistics
      this.updateLanguageStats(language, processingTime, optimizations);
      
      console.log(`[LanguageOptimizer] Optimized for ${language} in ${processingTime.toFixed(2)}ms`);
      
      this.emit('languageOptimized', {
        language,
        processingTime,
        optimizations,
        context
      });

      return {
        language,
        optimizations,
        processingTime,
        config: langConfig
      };

    } catch (error) {
      console.error(`[LanguageOptimizer] Optimization failed for ${language}:`, error);
      this.emit('optimizationError', { language, error, context });
      
      // Return fallback optimization
      return this.getFallbackOptimization(language);
    }
  }

  /**
   * Get optimized prompt for a specific language
   */
  getOptimizedPrompt(basePrompt, language, context = {}) {
    const langConfig = this.getLanguageConfig(language);
    
    if (!langConfig) {
      return basePrompt;
    }

    let optimizedPrompt = basePrompt;

    // Apply language-specific prompt optimizations
    if (langConfig.promptOptimizations) {
      // Add cultural context
      if (langConfig.promptOptimizations.culturalContext) {
        optimizedPrompt += ` ${langConfig.promptOptimizations.culturalContext}`;
      }

      // Add language-specific instructions
      if (langConfig.promptOptimizations.languageInstructions) {
        optimizedPrompt += ` ${langConfig.promptOptimizations.languageInstructions}`;
      }

      // Cantonese specialization
      if (language === 'zh-HK' && this.config.cantoneseOptimization) {
        optimizedPrompt += ' 請用廣東話回應，語調要自然親切。';
      }
    }

    return optimizedPrompt;
  }

  /**
   * Optimize response for language-specific characteristics
   */
  optimizeResponse(response, language, context = {}) {
    const langConfig = this.getLanguageConfig(language);
    
    if (!langConfig || !this.config.responseOptimization) {
      return response;
    }

    let optimizedResponse = response;

    // Apply language-specific response optimizations
    if (langConfig.responseOptimizations) {
      // Adjust formality level
      if (langConfig.responseOptimizations.formalityLevel) {
        optimizedResponse = this.adjustFormality(optimizedResponse, langConfig.responseOptimizations.formalityLevel, language);
      }

      // Apply cultural adaptations
      if (langConfig.responseOptimizations.culturalAdaptations) {
        optimizedResponse = this.applyCulturalAdaptations(optimizedResponse, langConfig.responseOptimizations.culturalAdaptations);
      }

      // Cantonese-specific optimizations
      if (language === 'zh-HK' && this.config.cantoneseOptimization) {
        optimizedResponse = this.optimizeCantoneseResponse(optimizedResponse);
      }
    }

    return optimizedResponse;
  }

  /**
   * Get language statistics
   */
  getLanguageStats() {
    const stats = {};
    
    for (const [language, data] of this.languageStats.entries()) {
      stats[language] = {
        requestCount: data.requestCount,
        averageProcessingTime: data.totalProcessingTime / data.requestCount,
        optimizationsApplied: data.optimizationsApplied,
        lastUsed: data.lastUsed
      };
    }

    return {
      supportedLanguages: this.config.enabledLanguages.length,
      languageStats: stats,
      cantoneseOptimization: this.config.cantoneseOptimization,
      totalRequests: Array.from(this.languageStats.values()).reduce((sum, data) => sum + data.requestCount, 0)
    };
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language) {
    return this.config.enabledLanguages.includes(language) || language === 'en-US';
  }

  // Private helper methods
  getDefaultLanguages() {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA',
      'zh-CN', 'zh-HK', 'zh-TW',
      'es-ES', 'es-MX', 'es-AR',
      'fr-FR', 'fr-CA',
      'de-DE', 'de-AT',
      'it-IT',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'ar-SA',
      'hi-IN',
      'th-TH',
      'vi-VN',
      'nl-NL',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI',
      'pl-PL',
      'cs-CZ',
      'hu-HU',
      'ro-RO',
      'bg-BG',
      'hr-HR',
      'sk-SK',
      'sl-SI',
      'et-EE',
      'lv-LV',
      'lt-LT',
      'mt-MT',
      'tr-TR',
      'he-IL',
      'fa-IR',
      'ur-PK',
      'bn-BD',
      'ta-IN',
      'te-IN',
      'ml-IN',
      'kn-IN',
      'gu-IN',
      'mr-IN',
      'pa-IN'
    ];
  }

  initializeLanguageConfigs() {
    return {
      'en-US': {
        promptOptimizations: {
          culturalContext: 'Respond in a friendly, professional American English style.',
          languageInstructions: 'Use clear, concise language.'
        },
        responseOptimizations: {
          formalityLevel: 'moderate',
          culturalAdaptations: ['direct_communication', 'time_conscious']
        }
      },
      'zh-HK': {
        promptOptimizations: {
          culturalContext: '以香港廣東話的文化背景回應。',
          languageInstructions: '用廣東話回答，要自然親切。'
        },
        responseOptimizations: {
          formalityLevel: 'polite',
          culturalAdaptations: ['respectful_tone', 'indirect_communication']
        }
      },
      'zh-CN': {
        promptOptimizations: {
          culturalContext: '以中国大陆的文化背景回应。',
          languageInstructions: '用简体中文回答，语调要礼貌专业。'
        },
        responseOptimizations: {
          formalityLevel: 'formal',
          culturalAdaptations: ['respectful_tone', 'hierarchical_awareness']
        }
      },
      'es-ES': {
        promptOptimizations: {
          culturalContext: 'Responde con el contexto cultural español.',
          languageInstructions: 'Usa español peninsular formal pero amigable.'
        },
        responseOptimizations: {
          formalityLevel: 'polite',
          culturalAdaptations: ['warm_communication', 'relationship_focused']
        }
      },
      'fr-FR': {
        promptOptimizations: {
          culturalContext: 'Répondez dans le contexte culturel français.',
          languageInstructions: 'Utilisez un français poli et professionnel.'
        },
        responseOptimizations: {
          formalityLevel: 'formal',
          culturalAdaptations: ['eloquent_expression', 'cultural_refinement']
        }
      }
    };
  }

  getLanguageConfig(language) {
    return this.languageConfigs[language] || this.languageConfigs['en-US'];
  }

  async applyLanguageOptimizations(language, context) {
    const optimizations = [];

    // Prompt optimization
    if (context.prompt) {
      optimizations.push('prompt_optimization');
    }

    // Response optimization
    if (this.config.responseOptimization) {
      optimizations.push('response_optimization');
    }

    // Cantonese specialization
    if (language === 'zh-HK' && this.config.cantoneseOptimization) {
      optimizations.push('cantonese_specialization');
    }

    // Language-specific caching
    if (this.config.cacheByLanguage) {
      optimizations.push('language_specific_caching');
    }

    return optimizations;
  }

  updateLanguageStats(language, processingTime, optimizations) {
    if (!this.languageStats.has(language)) {
      this.languageStats.set(language, {
        requestCount: 0,
        totalProcessingTime: 0,
        optimizationsApplied: 0,
        lastUsed: Date.now()
      });
    }

    const stats = this.languageStats.get(language);
    stats.requestCount++;
    stats.totalProcessingTime += processingTime;
    stats.optimizationsApplied += optimizations.length;
    stats.lastUsed = Date.now();
  }

  adjustFormality(response, formalityLevel, language) {
    // This would implement actual formality adjustments
    // For now, return the response as-is
    return response;
  }

  applyCulturalAdaptations(response, adaptations) {
    // This would implement cultural adaptations
    // For now, return the response as-is
    return response;
  }

  optimizeCantoneseResponse(response) {
    // Cantonese-specific optimizations
    // This would implement actual Cantonese language optimizations
    return response;
  }

  getFallbackOptimization(language) {
    return {
      language: 'en-US',
      optimizations: ['fallback'],
      processingTime: 0,
      config: this.languageConfigs['en-US']
    };
  }
}

module.exports = LanguageOptimizer;
