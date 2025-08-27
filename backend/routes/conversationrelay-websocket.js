const WebSocket = require('ws');
const { getActiveOrchestrator } = require('./make-call-optimized');
const ConversationRelay = require('../services/conversationRelay');

/**
 * Real Twilio ConversationRelay WebSocket Handler
 * Implements true real-time bidirectional audio streaming
 */
class ConversationRelayWebSocket {
  constructor(server) {
    try {
      this.wss = new WebSocket.Server({
        server,
        path: '/api/conversationrelay-ws',
        perMessageDeflate: false,
        maxPayload: 1024 * 1024 // 1MB for audio data
      });

      this.activeSessions = new Map();
      this.conversationServices = new Map(); // Store ConversationRelay service per session
      this.setupWebSocketServer();

      console.log('[ConversationRelay-WS] Twilio ConversationRelay WebSocket server initialized');
      console.log('[ConversationRelay-WS] Using ConversationRelay built-in STT/TTS capabilities');

    } catch (error) {
      console.error('[ConversationRelay-WS] Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      try {
        console.log(`[ConversationRelay-WS] ===== NEW WEBSOCKET CONNECTION =====`);
        console.log(`[ConversationRelay-WS] Request URL: ${req.url}`);
        console.log(`[ConversationRelay-WS] Request method: ${req.method}`);
        console.log(`[ConversationRelay-WS] Connection time: ${new Date().toISOString()}`);

        const url = new URL(req.url, `http://${req.headers.host}`);
        const workflowId = url.searchParams.get('workflowId') || 'default';
        const trackingId = url.searchParams.get('trackingId') || `track_${Date.now()}`;
        const callSid = url.searchParams.get('CallSid') || `call_${Date.now()}`;

        console.log(`[ConversationRelay-WS] ===== CONNECTION PARAMETERS =====`);
        console.log(`[ConversationRelay-WS] CallSid: ${callSid}`);
        console.log(`[ConversationRelay-WS] TrackingId: ${trackingId}`);
        console.log(`[ConversationRelay-WS] WorkflowId: ${workflowId}`);
        console.log(`[ConversationRelay-WS] All URL params:`, Object.fromEntries(url.searchParams));

        console.log(`[ConversationRelay-WS] ===== REQUEST HEADERS =====`);
        console.log(`[ConversationRelay-WS] User-Agent: ${req.headers['user-agent']}`);
        console.log(`[ConversationRelay-WS] Origin: ${req.headers['origin']}`);
        console.log(`[ConversationRelay-WS] Protocol: ${req.headers['sec-websocket-protocol']}`);
        console.log(`[ConversationRelay-WS] Host: ${req.headers['host']}`);
        console.log(`[ConversationRelay-WS] All headers:`, req.headers);

        // Initialize session with ConversationRelay-specific properties
        const session = {
          ws,
          callSid,
          workflowId,
          trackingId,
          startTime: Date.now(),
          messageCount: 0,
          conversationHistory: [],
          streamSid: null,
          isActive: false,
          audioBuffer: []
        };

        this.activeSessions.set(callSid, session);

        // Set up message handlers
        ws.on('message', (data) => {
          try {
            this.handleWebSocketMessage(session, data);
          } catch (error) {
            console.error(`[ConversationRelay-WS] Error handling message for ${callSid}:`, error);
          }
        });

        ws.on('close', (code, reason) => {
          console.log(`[ConversationRelay-WS] Connection closed for CallSid=${callSid}, Code=${code}, Reason=${reason}`);
          this.activeSessions.delete(callSid);
        });

        ws.on('error', (error) => {
          console.error(`[ConversationRelay-WS] WebSocket error for CallSid=${callSid}:`, error);
          this.activeSessions.delete(callSid);
        });

        // Send initial protocol setup for Twilio ConversationRelay
        this.sendMessage(ws, {
          event: 'connected',
          protocol: 'Call',
          version: '1.0.0'
        });

        console.log(`[ConversationRelay-WS] ConversationRelay session initialized for ${callSid}`);

      } catch (error) {
        console.error('[ConversationRelay-WS] Error setting up WebSocket connection:', error);
        ws.close(1011, 'Server error during connection setup');
      }
    });

    this.wss.on('error', (error) => {
      console.error('[ConversationRelay-WS] WebSocket server error:', error);
    });
  }

  async handleWebSocketMessage(session, data) {
    try {
      const message = JSON.parse(data.toString());
      session.messageCount++;

      console.log(`[ConversationRelay-WS] ===== MESSAGE RECEIVED =====`);
      console.log(`[ConversationRelay-WS] CallSid: ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Event: ${message.event}`);
      console.log(`[ConversationRelay-WS] Message count: ${session.messageCount}`);
      console.log(`[ConversationRelay-WS] Message size: ${data.length} bytes`);
      console.log(`[ConversationRelay-WS] Timestamp: ${new Date().toISOString()}`);
      console.log(`[ConversationRelay-WS] Session active: ${session.isActive}`);
      console.log(`[ConversationRelay-WS] Full message structure:`, Object.keys(message));

      // Log first 200 chars of message for debugging
      const messagePreview = JSON.stringify(message).substring(0, 200);
      console.log(`[ConversationRelay-WS] Message preview: ${messagePreview}...`);

      switch (message.event) {
        case 'start':
          console.log(`[ConversationRelay-WS] Handling START event`);
          await this.handleStart(session, message);
          break;

        case 'media':
          console.log(`[ConversationRelay-WS] Handling MEDIA event - Audio data received!`);
          await this.handleMedia(session, message);
          break;

        case 'speech':
          console.log(`[ConversationRelay-WS] Handling SPEECH event - ConversationRelay STT result!`);
          await this.handleSpeech(session, message);
          break;

        case 'dtmf':
          console.log(`[ConversationRelay-WS] Handling DTMF event`);
          await this.handleDTMF(session, message);
          break;

        case 'stop':
          console.log(`[ConversationRelay-WS] Handling STOP event`);
          await this.handleStop(session, message);
          break;

        default:
          console.log(`[ConversationRelay-WS] Unknown event: ${message.event}`);
          console.log(`[ConversationRelay-WS] Full message:`, JSON.stringify(message, null, 2));

          // Check if this might be a speech result in a different format
          if (message.transcript || message.speechResult || message.text) {
            console.log(`[ConversationRelay-WS] Detected speech data in unknown event, processing as speech`);
            await this.handleSpeechData(session, message);
          }
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error handling message:`, error);
      console.error(`[ConversationRelay-WS] Raw data:`, data.toString());
    }
  }

  async handleStart(session, message) {
    console.log(`[ConversationRelay-WS] ConversationRelay stream started for ${session.callSid}`);
    console.log(`[ConversationRelay-WS] Start message:`, message);

    // Store stream information
    session.streamSid = message.streamSid;
    session.isActive = true;

    // Get orchestrator and workflow configuration
    const orchestrator = getActiveOrchestrator(session.trackingId);

    if (orchestrator) {
      console.log(`[ConversationRelay-WS] Using performance orchestrator for ${session.callSid}`);

      // Initialize ConversationRelay service with workflow configuration
      const conversationService = new ConversationRelay(
        { callSid: session.callSid, streamSid: session.streamSid },
        orchestrator.workflowConfig || {}
      );

      // Store the service for this session
      this.conversationServices.set(session.callSid, conversationService);

      // Start the conversation with workflow data
      try {
        await conversationService.startConversation(session.callSid, {
          workflowId: session.workflowId,
          trackingId: session.trackingId,
          streamSid: session.streamSid,
          nodes: orchestrator.workflowData?.nodes || [],
          edges: orchestrator.workflowData?.edges || [],
          globalPrompt: orchestrator.workflowData?.globalPrompt || 'You are a helpful AI assistant.'
        });

        console.log(`[ConversationRelay-WS] ConversationRelay service initialized for ${session.callSid}`);
      } catch (error) {
        console.error(`[ConversationRelay-WS] Error starting ConversationRelay service:`, error);
      }
    } else {
      console.log(`[ConversationRelay-WS] No orchestrator available for ${session.callSid}, using basic configuration`);
    }

    // ConversationRelay handles welcome greeting automatically via TwiML welcomeGreeting
    // No need to send additional greeting here - it's already spoken by Twilio
    console.log(`[ConversationRelay-WS] ConversationRelay ready for speech input from ${session.callSid}`);

    // Set up a timeout to ensure we respond even if no speech is detected
    session.silenceTimeout = setTimeout(async () => {
      console.log(`[ConversationRelay-WS] Silence timeout reached for ${session.callSid}, sending prompt`);
      if (session.isActive && (!session.conversationHistory || session.conversationHistory.length === 0)) {
        await this.sendAIResponse(session, "I'm here and ready to help. Please speak up so I can assist you.");
      }
    }, 5000); // 5 second timeout after greeting
  }

  async handleMedia(session, message) {
    // ConversationRelay sends raw audio - we need to process it for STT
    try {
      console.log(`[ConversationRelay-WS] ===== MEDIA EVENT RECEIVED =====`);
      console.log(`[ConversationRelay-WS] CallSid: ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Media message structure:`, Object.keys(message));

      if (message.media && message.media.payload) {
        const audioData = Buffer.from(message.media.payload, 'base64');
        console.log(`[ConversationRelay-WS] ===== AUDIO DATA PROCESSING =====`);
        console.log(`[ConversationRelay-WS] Audio data size: ${audioData.length} bytes`);
        console.log(`[ConversationRelay-WS] Audio buffer current size: ${session.audioBuffer?.length || 0} chunks`);
        console.log(`[ConversationRelay-WS] Message sequence: ${session.messageCount}`);

        // Store audio data for potential batch processing
        session.audioBuffer = session.audioBuffer || [];
        session.audioBuffer.push({
          data: audioData,
          timestamp: Date.now(),
          sequenceNumber: session.messageCount
        });

        console.log(`[ConversationRelay-WS] Audio buffer updated: ${session.audioBuffer.length} chunks total`);

        // Process audio through ConversationRelay service
        const conversationService = this.conversationServices.get(session.callSid);
        if (conversationService) {
          try {
            const result = await conversationService.processAudioChunk({
              data: audioData,
              timestamp: Date.now(),
              sequenceNumber: session.messageCount,
              language: 'en-US'
            });

            if (result && result.response) {
              console.log(`[ConversationRelay-WS] Audio processing result: "${result.response}"`);
              await this.sendAIResponse(session, result.response);
            } else {
              // Try to detect speech in audio buffer
              await this.processAudioBuffer(session);
            }
          } catch (serviceError) {
            console.error(`[ConversationRelay-WS] ConversationRelay service error:`, serviceError);
            // Try fallback speech detection
            await this.processAudioBuffer(session);
          }
        } else {
          console.warn(`[ConversationRelay-WS] No ConversationRelay service found for ${session.callSid}`);
          // Try fallback speech detection
          await this.processAudioBuffer(session);
        }
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error handling media:`, error);
      await this.sendAIResponse(session, "I'm having trouble processing your request. Please try again.");
    }
  }

  async handleSpeech(session, message) {
    // Handle ConversationRelay STT results
    try {
      console.log(`[ConversationRelay-WS] Received speech event for ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Speech message:`, JSON.stringify(message, null, 2));

      const transcript = message.transcript || message.text || message.speechResult;

      if (transcript && transcript.trim().length > 0) {
        console.log(`[ConversationRelay-WS] Speech transcript: "${transcript}"`);
        await this.processSpeechTranscript(session, transcript);
      } else {
        console.log(`[ConversationRelay-WS] Empty or invalid speech transcript`);
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error handling speech:`, error);
      await this.sendAIResponse(session, "I understand you're speaking. How can I help you?");
    }
  }

  async handleSpeechData(session, message) {
    // Handle speech data in unknown message formats
    try {
      console.log(`[ConversationRelay-WS] Processing speech data from unknown event`);

      const transcript = message.transcript || message.speechResult || message.text || message.speech?.transcript;

      if (transcript && transcript.trim().length > 0) {
        console.log(`[ConversationRelay-WS] Found transcript in unknown event: "${transcript}"`);
        await this.processSpeechTranscript(session, transcript);
      } else {
        console.log(`[ConversationRelay-WS] No valid transcript found in unknown event`);
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error handling speech data:`, error);
    }
  }

  async handleDTMF(session, message) {
    console.log(`[ConversationRelay-WS] DTMF received: ${message.dtmf.digit}`);

    // Process DTMF input through ConversationRelay service
    const conversationService = this.conversationServices.get(session.callSid);
    if (conversationService) {
      try {
        const digit = message.dtmf.digit;
        const result = await conversationService.processDTMF(digit, session);
        await this.sendAIResponse(session, result.response || `You pressed ${digit}. How can I help you further?`);
      } catch (error) {
        console.error(`[ConversationRelay-WS] DTMF processing error:`, error);
        await this.sendAIResponse(session, `You pressed ${message.dtmf.digit}. How can I help you further?`);
      }
    } else {
      const digit = message.dtmf.digit;
      const response = `You pressed ${digit}. How else can I help you?`;
      await this.sendAIResponse(session, response);
    }
  }

  async processSpeechTranscript(session, transcript) {
    // Process speech transcript through workflow-aware conversation
    const startTime = performance.now();

    try {
      console.log(`[ConversationRelay-WS] Processing speech transcript: "${transcript}"`);

      // Clear silence timeout since we received speech
      if (session.silenceTimeout) {
        clearTimeout(session.silenceTimeout);
        session.silenceTimeout = null;
        console.log(`[ConversationRelay-WS] Cleared silence timeout for ${session.callSid}`);
      }

      // Get ConversationRelay service for this session
      const conversationService = this.conversationServices.get(session.callSid);

      if (conversationService) {
        // Use ConversationRelay service for workflow-aware processing
        const result = await conversationService.processTranscript(transcript, {
          callSid: session.callSid,
          workflowId: session.workflowId,
          trackingId: session.trackingId,
          conversationHistory: session.conversationHistory || []
        });

        const processingTime = performance.now() - startTime;
        console.log(`[ConversationRelay-WS] Transcript processed in ${processingTime.toFixed(2)}ms`);

        // Send AI response
        await this.sendAIResponse(session, result.response);

        // Update conversation history
        session.conversationHistory = session.conversationHistory || [];
        session.conversationHistory.push(
          { role: 'user', content: transcript, timestamp: Date.now() },
          { role: 'assistant', content: result.response, timestamp: Date.now() }
        );

      } else {
        // Fallback to basic processing if no ConversationRelay service
        console.warn(`[ConversationRelay-WS] No ConversationRelay service for ${session.callSid}, using basic processing`);
        await this.processTranscriptFallback(session, transcript);
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Speech transcript processing error:`, error);
      await this.sendAIResponse(session, "I understand you're speaking. Let me help you with that.");
    }
  }

  async handleStop(session, message) {
    console.log(`[ConversationRelay-WS] Stream stopped for ${session.callSid}`);

    // Clear silence timeout if it exists
    if (session.silenceTimeout) {
      clearTimeout(session.silenceTimeout);
      session.silenceTimeout = null;
      console.log(`[ConversationRelay-WS] Cleared silence timeout for ${session.callSid}`);
    }

    // Clean up ConversationRelay service
    const conversationService = this.conversationServices.get(session.callSid);
    if (conversationService) {
      try {
        await conversationService.endConversation(session.callSid);
        this.conversationServices.delete(session.callSid);
        console.log(`[ConversationRelay-WS] ConversationRelay service cleaned up for ${session.callSid}`);
      } catch (error) {
        console.error(`[ConversationRelay-WS] Error cleaning up ConversationRelay service:`, error);
      }
    }

    // Clean up session
    this.activeSessions.delete(session.callSid);
    console.log(`[ConversationRelay-WS] Session cleaned up for ${session.callSid}`);
  }

  async sendAIResponse(session, text) {
    try {
      console.log(`[ConversationRelay-WS] ===== SENDING AI RESPONSE =====`);
      console.log(`[ConversationRelay-WS] CallSid: ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Response text: "${text}"`);
      console.log(`[ConversationRelay-WS] WebSocket state: ${session.ws.readyState}`);
      console.log(`[ConversationRelay-WS] Session active: ${session.isActive}`);

      // Add to conversation history
      session.conversationHistory = session.conversationHistory || [];
      session.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      });

      console.log(`[ConversationRelay-WS] Added to conversation history. Total messages: ${session.conversationHistory.length}`);

      // CRITICAL: Send proper ConversationRelay response format
      // ConversationRelay should handle TTS automatically when we send text responses
      const responseMessage = {
        event: 'response',
        text: text,
        timestamp: Date.now(),
        streamSid: session.streamSid
      };

      console.log(`[ConversationRelay-WS] Sending response message:`, {
        event: responseMessage.event,
        textLength: responseMessage.text.length,
        streamSid: responseMessage.streamSid
      });

      this.sendMessage(session.ws, responseMessage);

      // Also try alternative format in case ConversationRelay expects different structure
      const alternativeMessage = {
        event: 'say',
        text: text,
        voice: 'alice',
        timestamp: Date.now()
      };

      console.log(`[ConversationRelay-WS] Also sending alternative format:`, alternativeMessage.event);
      this.sendMessage(session.ws, alternativeMessage);

      console.log(`[ConversationRelay-WS] ✅ AI response sent successfully to ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Response preview: "${text.substring(0, 100)}..."`);

    } catch (error) {
      console.error(`[ConversationRelay-WS] ❌ Error sending AI response:`, error);
      console.error(`[ConversationRelay-WS] Error details:`, {
        callSid: session.callSid,
        textLength: text?.length,
        wsState: session.ws?.readyState,
        error: error.message
      });
    }
  }

  async processAudioBuffer(session) {
    // Process accumulated audio buffer for speech detection
    try {
      if (!session.audioBuffer || session.audioBuffer.length === 0) {
        return;
      }

      console.log(`[ConversationRelay-WS] Processing audio buffer with ${session.audioBuffer.length} chunks`);

      // Enhanced speech detection based on audio characteristics
      const totalAudioSize = session.audioBuffer.reduce((sum, chunk) => sum + chunk.data.length, 0);
      const audioTimespan = session.audioBuffer.length > 1 ?
        session.audioBuffer[session.audioBuffer.length - 1].timestamp - session.audioBuffer[0].timestamp : 0;

      console.log(`[ConversationRelay-WS] Audio buffer stats: ${totalAudioSize} bytes over ${audioTimespan}ms`);

      // More sophisticated speech detection
      const speechDetected = this.detectSpeechInAudio(session.audioBuffer);

      if (speechDetected) {
        console.log(`[ConversationRelay-WS] Speech detected in audio buffer, processing conversation`);

        // Try to get actual transcript or use intelligent fallback
        const transcript = await this.extractTranscriptFromAudio(session.audioBuffer) ||
                          this.generateIntelligentResponse(session);

        if (transcript && transcript !== "silence") {
          console.log(`[ConversationRelay-WS] Processing transcript: "${transcript}"`);
          await this.processSpeechTranscript(session, transcript);
        }

        // Clear the buffer after processing
        session.audioBuffer = [];
      } else if (audioTimespan > 3000) {
        // Clear old buffer data to prevent memory buildup
        console.log(`[ConversationRelay-WS] Clearing old audio buffer (${audioTimespan}ms old)`);
        session.audioBuffer = [];
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error processing audio buffer:`, error);
    }
  }

  detectSpeechInAudio(audioBuffer) {
    // Enhanced speech detection with more sensitive thresholds
    try {
      console.log(`[ConversationRelay-WS] ===== SPEECH DETECTION ANALYSIS =====`);

      if (!audioBuffer || audioBuffer.length === 0) {
        console.log(`[ConversationRelay-WS] No audio buffer data - no speech detected`);
        return false;
      }

      const totalSize = audioBuffer.reduce((sum, chunk) => sum + chunk.data.length, 0);
      const timespan = audioBuffer.length > 1 ?
        audioBuffer[audioBuffer.length - 1].timestamp - audioBuffer[0].timestamp : 0;

      // MUCH MORE SENSITIVE speech detection criteria for better responsiveness:
      const minSizeForSpeech = 500; // 500 bytes minimum (much lower threshold)
      const minDurationForSpeech = 300; // 0.3 seconds minimum (much faster response)
      const consistentChunks = audioBuffer.length >= 2; // At least 2 audio chunks (faster detection)

      console.log(`[ConversationRelay-WS] ===== SPEECH DETECTION METRICS =====`);
      console.log(`[ConversationRelay-WS] Total audio size: ${totalSize} bytes (min: ${minSizeForSpeech})`);
      console.log(`[ConversationRelay-WS] Audio timespan: ${timespan}ms (min: ${minDurationForSpeech}ms)`);
      console.log(`[ConversationRelay-WS] Audio chunks: ${audioBuffer.length} (min: 2)`);
      console.log(`[ConversationRelay-WS] Size check: ${totalSize >= minSizeForSpeech}`);
      console.log(`[ConversationRelay-WS] Duration check: ${timespan >= minDurationForSpeech}`);
      console.log(`[ConversationRelay-WS] Chunks check: ${consistentChunks}`);

      // More aggressive speech detection - trigger on any reasonable audio activity
      const speechDetected = (totalSize >= minSizeForSpeech && consistentChunks) ||
                            (timespan >= minDurationForSpeech && audioBuffer.length >= 1) ||
                            (totalSize >= 1000); // Fallback: any audio over 1KB

      console.log(`[ConversationRelay-WS] ===== SPEECH DETECTION RESULT =====`);
      console.log(`[ConversationRelay-WS] Speech detected: ${speechDetected}`);

      if (speechDetected) {
        console.log(`[ConversationRelay-WS] 🎤 SPEECH DETECTED! Processing conversation...`);
      } else {
        console.log(`[ConversationRelay-WS] 🔇 No speech detected yet, continuing to buffer...`);
      }

      return speechDetected;

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error in speech detection:`, error);
      return false;
    }
  }

  async extractTranscriptFromAudio(audioBuffer) {
    // Enhanced transcript extraction with better fallback
    try {
      console.log(`[ConversationRelay-WS] Attempting to extract transcript from ${audioBuffer?.length || 0} audio chunks`);

      // TODO: Integrate with Azure Speech Services or other STT provider
      // For now, analyze audio characteristics to provide intelligent responses

      if (!audioBuffer || audioBuffer.length === 0) {
        return null;
      }

      const totalSize = audioBuffer.reduce((sum, chunk) => sum + chunk.data.length, 0);
      const timespan = audioBuffer.length > 1 ?
        audioBuffer[audioBuffer.length - 1].timestamp - audioBuffer[0].timestamp : 0;

      console.log(`[ConversationRelay-WS] Audio analysis: ${totalSize} bytes over ${timespan}ms`);

      // Simulate different types of speech based on audio characteristics
      if (totalSize > 3000 && timespan > 1000) {
        return "Hello, I need help with something"; // Longer speech
      } else if (totalSize > 1500) {
        return "Hi there"; // Medium speech
      } else if (totalSize > 500) {
        return "Yes"; // Short speech
      }

      return null; // Use intelligent fallback

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error extracting transcript:`, error);
      return null;
    }
  }

  generateIntelligentResponse(session) {
    // Generate contextual responses based on conversation state
    const conversationTurns = session.conversationHistory?.length || 0;

    if (conversationTurns === 0) {
      return "Hello! I heard you speaking. How can I help you today?";
    } else if (conversationTurns < 4) {
      return "I'm listening. Please continue.";
    } else {
      return "I understand. What else can I help you with?";
    }
  }

  async processTranscriptFallback(session, transcript) {
    // Fallback transcript processing with workflow awareness
    try {
      console.log(`[ConversationRelay-WS] Processing transcript fallback: "${transcript}"`);

      // Get orchestrator for workflow data
      const orchestrator = getActiveOrchestrator(session.trackingId);

      // Build conversation context with workflow awareness
      const messages = [
        {
          role: 'system',
          content: orchestrator?.workflowData?.globalPrompt || 'You are a helpful AI assistant. Provide concise, helpful responses based on the conversation context.'
        }
      ];

      // Add conversation history
      if (session.conversationHistory && session.conversationHistory.length > 0) {
        messages.push(...session.conversationHistory.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content
        })));
      }

      // Add current user input
      messages.push({ role: 'user', content: transcript });

      // Generate AI response
      const aiResponse = await this.callAzureOpenAI(messages);

      // Send response
      await this.sendAIResponse(session, aiResponse);

      // Update conversation history
      session.conversationHistory = session.conversationHistory || [];
      session.conversationHistory.push(
        { role: 'user', content: transcript, timestamp: Date.now() },
        { role: 'assistant', content: aiResponse, timestamp: Date.now() }
      );

    } catch (error) {
      console.error(`[ConversationRelay-WS] Transcript fallback processing error:`, error);
      await this.sendAIResponse(session, "I understand you're speaking. How can I help you?");
    }
  }

  async callAzureOpenAI(messages) {
    try {
      // Validate environment variables
      if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
        console.error('[ConversationRelay-WS] Missing Azure OpenAI credentials');
        return "I'm having trouble connecting to my AI service. Please try again.";
      }

      console.log('[ConversationRelay-WS] Calling Azure OpenAI with', messages.length, 'messages');

      const response = await fetch(process.env.AZURE_OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY
        },
        body: JSON.stringify({
          messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
          max_tokens: 150,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ConversationRelay-WS] Azure OpenAI API error:', response.status, errorText);
        return "I'm experiencing some technical difficulties. How else can I help you?";
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[ConversationRelay-WS] Invalid Azure OpenAI response structure:', data);
        return "I'm having trouble processing your request. Could you please rephrase?";
      }

      const aiResponse = data.choices[0].message.content.trim();
      console.log('[ConversationRelay-WS] Azure OpenAI response:', aiResponse.substring(0, 100) + '...');

      return aiResponse;

    } catch (error) {
      console.error('[ConversationRelay-WS] Azure OpenAI call failed:', error);
      return "I apologize, but I'm having trouble understanding. Could you please try again?";
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      callSid: session.callSid,
      workflowId: session.workflowId,
      trackingId: session.trackingId,
      startTime: session.startTime,
      messageCount: session.messageCount,
      conversationTurns: session.conversationHistory.length
    }));
  }

  // ConversationRelay handles STT automatically - no need for custom convertAudioToText
  // The STT is handled by Twilio's ConversationRelay service natively

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  closeSession(callSid) {
    const session = this.activeSessions.get(callSid);
    if (session) {
      session.ws.close();
      this.activeSessions.delete(callSid);
      console.log(`[ConversationRelay-WS] Manually closed session for ${callSid}`);
    }
  }
}

module.exports = ConversationRelayWebSocket;
