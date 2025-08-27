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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const workflowId = url.searchParams.get('workflowId') || 'default';
        const trackingId = url.searchParams.get('trackingId') || `track_${Date.now()}`;
        const callSid = url.searchParams.get('CallSid') || `call_${Date.now()}`;

        console.log(`[ConversationRelay-WS] New Twilio ConversationRelay connection: CallSid=${callSid}, TrackingId=${trackingId}, WorkflowId=${workflowId}`);
        console.log(`[ConversationRelay-WS] Request headers:`, {
          'user-agent': req.headers['user-agent'],
          'origin': req.headers['origin'],
          'sec-websocket-protocol': req.headers['sec-websocket-protocol']
        });

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

      switch (message.event) {
        case 'start':
          console.log(`[ConversationRelay-WS] Handling START event`);
          await this.handleStart(session, message);
          break;

        case 'media':
          console.log(`[ConversationRelay-WS] Handling MEDIA event - Audio data received!`);
          await this.handleMedia(session, message);
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
  }

  async handleMedia(session, message) {
    // ConversationRelay handles STT automatically - we should receive speech events, not raw audio
    try {
      console.log(`[ConversationRelay-WS] Received media message for ${session.callSid}`);
      console.log(`[ConversationRelay-WS] Message type:`, message.event);
      console.log(`[ConversationRelay-WS] Message structure:`, Object.keys(message));

      // ConversationRelay should automatically handle STT and send us speech events
      // If we're receiving raw audio, it means ConversationRelay STT isn't working as expected

      if (message.media && message.media.payload) {
        console.log(`[ConversationRelay-WS] Received raw audio data (${Buffer.from(message.media.payload, 'base64').length} bytes)`);
        console.log(`[ConversationRelay-WS] ConversationRelay should handle STT automatically - this may indicate a configuration issue`);

        // For now, let's try to process this with our ConversationRelay service
        const conversationService = this.conversationServices.get(session.callSid);
        if (conversationService) {
          try {
            const audioData = Buffer.from(message.media.payload, 'base64');
            const result = await conversationService.processAudioChunk({
              data: audioData,
              timestamp: Date.now(),
              sequenceNumber: session.messageCount,
              language: 'en-US'
            });

            if (result && result.response) {
              await this.sendAIResponse(session, result.response);
            }
          } catch (serviceError) {
            console.error(`[ConversationRelay-WS] ConversationRelay service error:`, serviceError);
            await this.sendAIResponse(session, "I'm processing your request. Please continue speaking.");
          }
        } else {
          console.warn(`[ConversationRelay-WS] No ConversationRelay service found for ${session.callSid}`);
          await this.sendAIResponse(session, "I'm listening. How can I help you?");
        }
      }

    } catch (error) {
      console.error(`[ConversationRelay-WS] Error handling media:`, error);
      await this.sendAIResponse(session, "I'm having trouble processing your request. Please try again.");
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
      // Add to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      });
      
      // Send text response (ConversationRelay will handle TTS)
      this.sendMessage(session.ws, {
        event: 'response',
        text: text,
        voice: 'alice'
      });
      
      console.log(`[ConversationRelay-WS] Sent AI response to ${session.callSid}: ${text.substring(0, 50)}...`);
      
    } catch (error) {
      console.error(`[ConversationRelay-WS] Error sending AI response:`, error);
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
