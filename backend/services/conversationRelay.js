const EventEmitter = require('events');
const StreamingAudioProcessor = require('./streamingAudioProcessor');
const PredictiveCache = require('./predictiveCache');
const LanguageOptimizer = require('./languageOptimizer');

class ConversationRelay extends EventEmitter {
  constructor(config, workflowConfig) {
    super();
    this.config = config;
    this.workflowConfig = workflowConfig;
    this.isActive = false;
    this.audioBuffer = [];
    this.sequenceNumber = 0;
    this.performanceMetrics = new PerformanceMetrics();
    this.streamProcessor = new StreamingAudioProcessor(workflowConfig);
    this.activeCalls = new Map();
    
    this.setupEventHandlers();
    console.log('[ConversationRelay] Initialized with bidirectional streaming');
  }

  async startConversation(callSid, workflowData) {
    const startTime = performance.now();

    try {
      console.log(`[ConversationRelay] Starting conversation for call ${callSid}`);
      console.log(`[ConversationRelay] Workflow data:`, {
        workflowId: workflowData.workflowId,
        nodesCount: workflowData.nodes?.length || 0,
        edgesCount: workflowData.edges?.length || 0,
        hasGlobalPrompt: !!workflowData.globalPrompt
      });

      // Store workflow data for this call
      this.activeCalls.set(callSid, {
        workflowData,
        conversationHistory: [],
        currentNode: 'start',
        startTime: Date.now(),
        isActive: true
      });

      // Initialize streaming connection
      await this.initializeStream(callSid, workflowData);

      // Set up bidirectional audio processing
      await this.setupBidirectionalStreaming(callSid);

      this.isActive = true;

      const initTime = performance.now() - startTime;
      console.log(`[ConversationRelay] Conversation started in ${initTime}ms`);

      this.emit('conversationStarted', { callSid, initTime, workflowData });

    } catch (error) {
      console.error('[ConversationRelay] Failed to start conversation:', error);
      this.emit('error', { callSid, error });
      throw error;
    }
  }

  async processAudioChunk(audioChunk) {
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
      
      const streamingResponse = {
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

  async initializeStream(callSid, workflowData) {
    // Store call data for processing
    this.activeCalls.set(callSid, {
      workflowData,
      startTime: Date.now(),
      messageHistory: [],
      currentNodeId: workflowData?.nodes?.[0]?.id || null,
      conversationTurns: 0
    });

    // Initialize Twilio Media Stream configuration
    const mediaStreamConfig = {
      callSid,
      track: 'both', // inbound and outbound
      statusCallback: `${process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com'}/api/media-stream-status`,
      statusCallbackMethod: 'POST'
    };

    // Set up WebSocket connection for real-time audio (if available)
    await this.setupWebSocketConnection(callSid);
    
    // Configure audio processing pipeline
    await this.configureAudioPipeline(workflowData);
    
    console.log(`[ConversationRelay] Stream initialized for call ${callSid}`);
  }

  async setupBidirectionalStreaming(callSid) {
    const callData = this.activeCalls.get(callSid);
    if (!callData) {
      throw new Error(`No call data found for ${callSid}`);
    }

    // Configure inbound audio processing (user speech)
    this.on('inboundAudio', async (audioData, receivedCallSid) => {
      if (receivedCallSid !== callSid) return;
      
      const audioChunk = {
        data: audioData,
        timestamp: Date.now(),
        sequenceNumber: this.sequenceNumber++,
        language: callData.workflowData?.globalSettings?.defaultLanguage || 'en-US'
      };
      
      try {
        const response = await this.processAudioChunk(audioChunk);
        
        // Send response audio back to user
        this.sendOutboundAudio(response.audioData, callSid);
        
      } catch (error) {
        console.error('[ConversationRelay] Inbound audio processing failed:', error);
        // Send error response or fallback audio
        await this.handleProcessingError(error, callSid);
      }
    });

    // Configure outbound audio streaming (AI responses)
    this.on('outboundAudio', (audioData, receivedCallSid) => {
      if (receivedCallSid !== callSid) return;
      this.sendAudioToTwilio(audioData, callSid);
    });
    
    console.log(`[ConversationRelay] Bidirectional streaming setup complete for call ${callSid}`);
  }

  async optimizeAudioChunk(audioChunk) {
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

  async setupWebSocketConnection(callSid) {
    // This would integrate with Twilio's Media Streams API
    // For now, we'll use the existing TwiML approach but with optimized processing
    console.log(`[ConversationRelay] WebSocket connection setup for call ${callSid} (using TwiML bridge)`);
  }

  async configureAudioPipeline(workflowData) {
    // Configure the audio processing pipeline based on language settings
    const languageConfig = workflowData?.globalSettings?.languageConfig;
    
    if (languageConfig) {
      await this.streamProcessor.configureForLanguage(languageConfig);
    }
    
    console.log('[ConversationRelay] Audio pipeline configured');
  }

  sendOutboundAudio(audioData, callSid) {
    this.emit('outboundAudio', audioData, callSid);
  }

  sendAudioToTwilio(audioData, callSid) {
    // Send audio data back to Twilio Media Stream
    // For now, this integrates with the existing TwiML system
    console.log(`[ConversationRelay] Sending ${audioData.length} bytes to Twilio for call ${callSid}`);
  }

  async handleProcessingError(error, callSid) {
    const callData = this.activeCalls.get(callSid);
    const language = callData?.workflowData?.globalSettings?.defaultLanguage || 'en-US';
    
    // Generate fallback response
    const fallbackMessage = this.getErrorMessage(language);
    const fallbackAudio = await this.streamProcessor.generateFallbackAudio(fallbackMessage);
    this.sendOutboundAudio(fallbackAudio, callSid);
  }

  getErrorMessage(language) {
    const errorMessages = {
      'en-US': "I'm sorry, I didn't catch that. Could you please repeat?",
      'zh-HK': '唔好意思，我聽唔清楚，可以再講一次嗎？',
      'zh-CN': '抱歉，我没听清楚，您能再说一遍吗？',
      'es-ES': 'Lo siento, no te he entendido. ¿Puedes repetir?',
      'fr-FR': 'Désolé, je n\'ai pas compris. Pouvez-vous répéter?'
    };
    
    return errorMessages[language] || errorMessages['en-US'];
  }

  async applyNoiseReduction(audioData) {
    // Implement noise reduction algorithm
    // This is a placeholder - you'd use a real noise reduction library
    return audioData;
  }

  async applyEchoCancellation(audioData) {
    // Implement echo cancellation
    // This is a placeholder - you'd use a real echo cancellation library
    return audioData;
  }

  async detectVoiceActivity(audioData) {
    // Implement voice activity detection
    // This is a placeholder - you'd use a real VAD algorithm
    return audioData.length > 0;
  }

  async calculateAudioConfidence(audioData) {
    // Calculate confidence score for audio quality
    // This is a placeholder - you'd implement real audio quality metrics
    return 0.95;
  }

  setupEventHandlers() {
    this.on('error', (error) => {
      console.error('[ConversationRelay] Error:', error);
      this.performanceMetrics.recordError(error);
    });

    this.on('performanceWarning', (data) => {
      console.warn('[ConversationRelay] Performance warning:', data);
      this.performanceMetrics.recordWarning(data);
    });
  }

  async stopConversation(callSid) {
    console.log(`[ConversationRelay] Stopping conversation for call ${callSid}`);
    this.isActive = false;
    
    // Clean up call data
    this.activeCalls.delete(callSid);
    
    // Clean up resources
    this.audioBuffer = [];
    this.sequenceNumber = 0;
    
    // Emit final metrics
    const metrics = this.performanceMetrics.getFinalMetrics();
    this.emit('conversationEnded', { callSid, metrics });
  }

  getPerformanceMetrics() {
    return this.performanceMetrics.getCurrentMetrics();
  }
}

class PerformanceMetrics {
  constructor() {
    this.processingTimes = [];
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  recordProcessingTime(time) {
    this.processingTimes.push(time);
    
    // Keep only last 100 measurements for memory efficiency
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
  }

  recordError(error) {
    this.errors.push({ timestamp: Date.now(), error });
  }

  recordWarning(warning) {
    this.warnings.push({ timestamp: Date.now(), warning });
  }

  getCurrentMetrics() {
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

  getFinalMetrics() {
    return {
      ...this.getCurrentMetrics(),
      finalProcessingTimes: [...this.processingTimes],
      allErrors: [...this.errors],
      allWarnings: [...this.warnings]
    };
  }
  async endConversation(callSid) {
    console.log(`[ConversationRelay] Ending conversation for call ${callSid}`);

    const callData = this.activeCalls.get(callSid);
    if (callData) {
      callData.isActive = false;

      // Emit conversation ended event with metrics
      this.emit('conversationEnded', {
        callSid,
        duration: Date.now() - callData.startTime,
        messageCount: callData.messageCount || 0
      });

      // Clean up resources
      this.activeCalls.delete(callSid);
    }

    this.isActive = false;
  }

  async processTranscript(transcript, context) {
    // Process speech transcript with workflow awareness
    const startTime = performance.now();

    try {
      console.log(`[ConversationRelay] Processing transcript: "${transcript}" for call ${context.callSid}`);

      const callData = this.activeCalls.get(context.callSid);
      if (!callData) {
        throw new Error(`No call data found for ${context.callSid}`);
      }

      // Add user message to conversation history
      callData.conversationHistory.push({
        role: 'user',
        content: transcript,
        timestamp: Date.now()
      });

      // Process through workflow logic
      const response = await this.processWorkflowLogic(transcript, callData);

      // Add assistant response to conversation history
      callData.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      const processingTime = performance.now() - startTime;
      console.log(`[ConversationRelay] Transcript processed in ${processingTime.toFixed(2)}ms`);

      return {
        response,
        processingTime,
        confidence: 0.95,
        workflowNode: callData.currentNode
      };

    } catch (error) {
      console.error(`[ConversationRelay] Transcript processing error:`, error);
      return {
        response: "I understand you're speaking. How can I help you?",
        processingTime: performance.now() - startTime,
        confidence: 0.5,
        error: error.message
      };
    }
  }

  async processDTMF(digit, session) {
    // Process DTMF input with workflow awareness
    try {
      console.log(`[ConversationRelay] Processing DTMF: ${digit} for call ${session.callSid}`);

      const callData = this.activeCalls.get(session.callSid);
      if (!callData) {
        return { response: `You pressed ${digit}. How can I help you?` };
      }

      // Process DTMF through workflow logic
      const response = await this.processWorkflowLogic(`DTMF:${digit}`, callData);

      return {
        response,
        digit,
        workflowNode: callData.currentNode
      };

    } catch (error) {
      console.error(`[ConversationRelay] DTMF processing error:`, error);
      return { response: `You pressed ${digit}. How can I help you further?` };
    }
  }

  async processWorkflowLogic(input, callData) {
    // Process input through workflow nodes and logic
    try {
      const { workflowData } = callData;

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: workflowData.globalPrompt || 'You are a helpful AI assistant. Provide concise, helpful responses.'
        }
      ];

      // Add recent conversation history
      if (callData.conversationHistory.length > 0) {
        messages.push(...callData.conversationHistory.slice(-5));
      }

      // Add current input
      messages.push({ role: 'user', content: input });

      // Generate AI response
      const response = await this.generateAIResponse(messages);

      return response;

    } catch (error) {
      console.error(`[ConversationRelay] Workflow logic error:`, error);
      return "I'm here to help. What would you like to know?";
    }
  }

  async generateAIResponse(messages) {
    // Generate AI response using configured LLM
    try {
      // This would integrate with Azure OpenAI or other LLM
      // For now, return a contextual response based on input
      const lastMessage = messages[messages.length - 1];
      const input = lastMessage.content.toLowerCase();

      if (input.includes('hello') || input.includes('hi')) {
        return "Hello! I'm here to help you. What can I do for you today?";
      }

      if (input.includes('help')) {
        return "I'd be happy to help you. Could you tell me more about what you need assistance with?";
      }

      if (input.includes('thank')) {
        return "You're welcome! Is there anything else I can help you with?";
      }

      return "I understand. How can I assist you with that?";

    } catch (error) {
      console.error(`[ConversationRelay] AI response generation error:`, error);
      return "I'm here to help. Could you please tell me more about what you need?";
    }
  }
}

module.exports = ConversationRelay;
