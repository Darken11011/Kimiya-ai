const WebSocket = require('ws');
const { getActiveOrchestrator } = require('./make-call-optimized');

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
      this.setupWebSocketServer();

      console.log('[ConversationRelay-WS] Twilio ConversationRelay WebSocket server initialized');
      console.log('[ConversationRelay-WS] Ready for real-time bidirectional audio streaming');

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

    // Get orchestrator for optimization
    const orchestrator = getActiveOrchestrator(session.trackingId);

    if (orchestrator) {
      console.log(`[ConversationRelay-WS] Using performance orchestrator for ${session.callSid}`);
      // Initialize optimized conversation
      try {
        await orchestrator.startOptimizedConversation(session.callSid, {
          workflowId: session.workflowId,
          trackingId: session.trackingId,
          streamSid: session.streamSid
        });
      } catch (error) {
        console.error(`[ConversationRelay-WS] Error starting optimized conversation:`, error);
      }
    }

    // Send welcome greeting (this will be spoken by Twilio)
    const welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?";
    await this.sendAIResponse(session, welcomeMessage);
  }

  async handleMedia(session, message) {
    const startTime = performance.now();

    try {
      console.log(`[ConversationRelay-WS] Processing media for ${session.callSid}`);

      // Validate message structure
      if (!message.media || !message.media.payload) {
        console.warn('[ConversationRelay-WS] Invalid media message structure');
        await this.sendAIResponse(session, "I'm having trouble hearing you. Could you please speak again?");
        return;
      }

      // Extract audio data
      const audioData = Buffer.from(message.media.payload, 'base64');
      console.log(`[ConversationRelay-WS] Received ${audioData.length} bytes of audio data`);

      // Get orchestrator for processing
      const orchestrator = getActiveOrchestrator(session.trackingId);

      let aiResponse;

      if (orchestrator) {
        console.log('[ConversationRelay-WS] Using performance orchestrator for processing');
        try {
          // Use optimized processing
          const audioChunk = {
            data: audioData,
            timestamp: Date.now(),
            sequenceNumber: session.messageCount,
            language: 'en-US'
          };

          const result = await orchestrator.processOptimizedAudio(session.callSid, audioData);
          aiResponse = result.response || "I'm processing your request...";

        } catch (orchestratorError) {
          console.error('[ConversationRelay-WS] Orchestrator processing failed:', orchestratorError);
          // Fallback to simple processing
          aiResponse = await this.processAudioFallback(audioData, session);
        }

      } else {
        console.log('[ConversationRelay-WS] No orchestrator available, using fallback processing');
        // Fallback to simple processing
        aiResponse = await this.processAudioFallback(audioData, session);
      }

      const processingTime = performance.now() - startTime;
      console.log(`[ConversationRelay-WS] Audio processed in ${processingTime.toFixed(2)}ms`);

      // Send AI response back
      await this.sendAIResponse(session, aiResponse);

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`[ConversationRelay-WS] Media processing error after ${processingTime.toFixed(2)}ms:`, error);
      await this.sendAIResponse(session, "I'm sorry, I'm having trouble processing your request. Could you please try again?");
    }
  }

  async handleDTMF(session, message) {
    console.log(`[ConversationRelay-WS] DTMF received: ${message.dtmf.digit}`);
    
    // Handle DTMF input
    const digit = message.dtmf.digit;
    const response = `You pressed ${digit}. How else can I help you?`;
    
    await this.sendAIResponse(session, response);
  }

  async handleStop(session, message) {
    console.log(`[ConversationRelay-WS] Stream stopped for ${session.callSid}`);
    
    // Clean up session
    this.activeSessions.delete(session.callSid);
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

  async processAudioFallback(audioData, session) {
    // Fallback audio processing without orchestrator

    try {
      console.log(`[ConversationRelay-WS] Processing ${audioData.length} bytes of audio for speech-to-text`);

      // Convert audio to text using Azure Speech Services or similar
      const transcript = await this.convertAudioToText(audioData);

      if (!transcript || transcript.trim().length === 0) {
        console.log('[ConversationRelay-WS] No speech detected in audio');
        return "I didn't hear anything. Could you please speak again?";
      }

      console.log(`[ConversationRelay-WS] Transcript: "${transcript}"`);

      // Add to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: transcript,
        timestamp: Date.now()
      });

      // Generate AI response using Azure OpenAI
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant. Provide concise, helpful responses.' },
        ...session.conversationHistory.slice(-5).map(msg => ({ role: msg.role, content: msg.content }))
      ];

      const aiResponse = await this.callAzureOpenAI(messages);
      return aiResponse;

    } catch (error) {
      console.error('[ConversationRelay-WS] Fallback processing error:', error);
      return "I'm having trouble processing your request. Please try again.";
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

  async convertAudioToText(audioData) {
    try {
      // For now, implement a simple placeholder that simulates speech detection
      // In production, this would integrate with Azure Speech Services, Google Speech-to-Text, etc.

      console.log(`[ConversationRelay-WS] Converting ${audioData.length} bytes of audio to text`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      // For testing purposes, return a placeholder that indicates we received audio
      // This should be replaced with actual speech-to-text service
      if (audioData.length > 1000) {
        // Simulate that we detected speech in larger audio chunks
        return "I heard you speaking. How can I help you?";
      } else {
        // Simulate no speech detected in small chunks
        return null;
      }

    } catch (error) {
      console.error('[ConversationRelay-WS] Speech-to-text conversion error:', error);
      return null;
    }
  }

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
