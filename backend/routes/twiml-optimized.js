const { getActiveOrchestrator } = require('./make-call-optimized');

// Store call states for optimized processing
const callStates = new Map();

module.exports = async function twimlOptimizedHandler(req, res) {
  const startTime = performance.now();

  try {
    // Set proper headers for TwiML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.id;
    const trackingId = req.query.trackingId;
    const callSid = req.body.CallSid || req.query.CallSid;

    console.log(`[TwiML-Optimized] ===== CONVERSATIONRELAY REQUEST =====`);
    console.log(`[TwiML-Optimized] Processing call ${callSid} with tracking ${trackingId}`);
    console.log(`[TwiML-Optimized] Request method: ${req.method}`);
    console.log(`[TwiML-Optimized] Request body keys:`, Object.keys(req.body || {}));
    console.log(`[TwiML-Optimized] Speech result:`, req.body.SpeechResult ? 'present' : 'none');
    console.log(`[TwiML-Optimized] Full request URL:`, req.url);

    // Validate required parameters
    if (!workflowId || !trackingId) {
      console.warn(`[TwiML-Optimized] Missing required parameters: workflowId=${workflowId}, trackingId=${trackingId}`);
      console.log(`[TwiML-Optimized] Using fallback ConversationRelay configuration`);
      return fallbackToStandardProcessing(req, res);
    }

    // Get the performance orchestrator for this call
    const orchestrator = getActiveOrchestrator(trackingId);
    if (!orchestrator) {
      console.warn(`[TwiML-Optimized] No orchestrator found for tracking ID ${trackingId}, falling back to standard processing`);
      return fallbackToStandardProcessing(req, res);
    }

    // Get or initialize call state
    let callState = callStates.get(callSid);
    if (!callState) {
      callState = {
        callSid,
        trackingId,
        workflowId,
        messages: [],
        currentNodeId: null,
        conversationTurns: 0,
        startTime: Date.now(),
        lastProcessingTime: 0
      };
      callStates.set(callSid, callState);
      console.log(`[TwiML-Optimized] Initialized call state for ${callSid}`);
    }

    // Extract speech result from Twilio
    const speechResult = req.body.SpeechResult || req.body.Digits || null;
    const confidence = parseFloat(req.body.Confidence || '0.95');

    console.log(`[TwiML-Optimized] Speech input:`, {
      callSid,
      speechResult: speechResult ? speechResult.substring(0, 100) + '...' : 'null',
      confidence,
      turn: callState.conversationTurns
    });

    let aiResponse;
    let processingTime = 0;

    try {
      const processingStartTime = performance.now();

      if (!speechResult) {
        // First interaction - generate greeting using orchestrator
        aiResponse = await generateOptimizedGreeting(orchestrator, callState);
      } else {
        // Process user input through optimized pipeline
        aiResponse = await processOptimizedUserInput(orchestrator, callState, speechResult, confidence);
      }

      processingTime = performance.now() - processingStartTime;
      callState.lastProcessingTime = processingTime;

      console.log(`[TwiML-Optimized] AI response generated in ${processingTime}ms:`, {
        callSid,
        responseLength: aiResponse.length,
        optimizationUsed: processingTime < 300 ? 'cache_hit' : 'full_processing'
      });

    } catch (error) {
      console.error(`[TwiML-Optimized] AI processing failed:`, error);
      aiResponse = getErrorResponse(callState.language || 'en-US');
      processingTime = performance.now() - startTime;
    }

    // Update call state
    if (speechResult) {
      callState.messages.push({
        role: 'user',
        content: speechResult,
        timestamp: new Date(),
        confidence
      });
      callState.conversationTurns++;
    }

    callState.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      processingTime
    });

    // Clean response for TwiML
    const cleanResponse = aiResponse
      .replace(/[<>&"']/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
        return entities[match];
      })
      .substring(0, 4000); // Twilio limit

    // Generate optimized TwiML with performance indicators
    const totalProcessingTime = performance.now() - startTime;
    let twiml;

    try {
      twiml = generateOptimizedTwiML(cleanResponse, workflowId, trackingId, totalProcessingTime);

      // Validate TwiML is not empty and contains required elements
      if (!twiml || !twiml.includes('<Response>') || !twiml.includes('</Response>')) {
        throw new Error('Generated TwiML is invalid or empty');
      }

      console.log(`[TwiML-Optimized] Generated TwiML length: ${twiml.length} characters`);
      console.log(`[TwiML-Optimized] TwiML preview:`, twiml.substring(0, 200) + '...');

    } catch (twimlError) {
      console.error(`[TwiML-Optimized] TwiML generation failed:`, twimlError);
      console.log(`[TwiML-Optimized] Falling back to standard processing due to TwiML generation error`);
      return fallbackToStandardProcessing(req, res);
    }

    console.log(`[TwiML-Optimized] Total request processed in ${totalProcessingTime}ms (Target: <300ms)`);

    // Emit performance metrics
    if (orchestrator) {
      orchestrator.emit('requestProcessed', {
        callSid,
        processingTime: totalProcessingTime,
        aiProcessingTime: processingTime,
        cacheUsed: processingTime < 200,
        optimizationActive: true
      });
    }

    // Send optimized ConversationRelay TwiML response
    console.log(`[TwiML-Optimized] ===== SENDING CONVERSATIONRELAY TWIML =====`);
    console.log(`[TwiML-Optimized] TwiML length: ${twiml.length} characters`);
    console.log(`[TwiML-Optimized] WebSocket URL included: ${twiml.includes('conversationrelay-ws')}`);
    res.status(200).send(twiml);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`[TwiML-Optimized] ===== CRITICAL ERROR =====`);
    console.error(`[TwiML-Optimized] Request failed after ${totalTime}ms:`, error);
    console.error(`[TwiML-Optimized] Error stack:`, error.stack);
    console.error(`[TwiML-Optimized] Request body:`, req.body);
    console.error(`[TwiML-Optimized] Request query:`, req.query);
    console.error(`[TwiML-Optimized] ===== END ERROR =====`);

    // Ensure we always send valid TwiML with proper headers
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    // Send fallback ConversationRelay TwiML instead of error TwiML
    console.log(`[TwiML-Optimized] Sending fallback ConversationRelay TwiML due to error`);
    return fallbackToStandardProcessing(req, res);
  }
};

async function generateOptimizedGreeting(orchestrator, callState) {
  // Use orchestrator's optimized processing for greeting
  try {
    const greetingPrompt = "Generate a friendly, professional greeting to start the conversation.";
    
    // This would integrate with the orchestrator's predictive cache
    const cachedGreeting = await orchestrator.predictiveCache?.predict(greetingPrompt, {
      callSid: callState.callSid,
      language: 'en-US',
      conversationHistory: [],
      workflowState: { currentNode: 'start' },
      metadata: { type: 'greeting' }
    });

    if (cachedGreeting && cachedGreeting.confidence > 0.8) {
      console.log(`[TwiML-Optimized] Using cached greeting (${cachedGreeting.source})`);
      return cachedGreeting.response;
    }

    // Fallback to AI generation
    return await callAzureOpenAI([
      { role: 'system', content: 'You are a helpful AI assistant. Generate a brief, friendly greeting.' },
      { role: 'user', content: greetingPrompt }
    ]);

  } catch (error) {
    console.error('[TwiML-Optimized] Greeting generation failed:', error);
    return "Hello! I'm your AI assistant. How can I help you today?";
  }
}

async function processOptimizedUserInput(orchestrator, callState, speechResult, confidence) {
  try {
    // Build conversation context for optimization
    const context = {
      callSid: callState.callSid,
      language: 'en-US',
      conversationHistory: callState.messages.slice(-5), // Last 5 messages for context
      workflowState: { 
        currentNode: callState.currentNodeId,
        conversationTurns: callState.conversationTurns
      },
      metadata: { 
        confidence,
        processingMode: 'optimized'
      }
    };

    // Try predictive cache first (Phase 2 optimization)
    const prediction = await orchestrator.predictiveCache?.predict(speechResult, context);
    
    if (prediction && prediction.confidence > 0.8) {
      console.log(`[TwiML-Optimized] Cache hit: ${prediction.source} (${prediction.confidence})`);
      return prediction.response;
    }

    // Use language optimization (Phase 3)
    const languageOptimization = await orchestrator.languageOptimizer?.optimizeForLanguage('en-US', context);
    
    // Process through AI with optimizations
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant. Provide concise, helpful responses.' },
      ...callState.messages.slice(-3).map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: speechResult }
    ];

    const aiResponse = await callAzureOpenAI(messages);

    // Cache the response for future use (Phase 2 optimization)
    if (orchestrator.predictiveCache) {
      await orchestrator.predictiveCache.cacheResponse(
        speechResult,
        aiResponse,
        Buffer.from('audio_placeholder'), // Would be actual audio in full implementation
        context,
        performance.now() - Date.now()
      );
    }

    return aiResponse;

  } catch (error) {
    console.error('[TwiML-Optimized] User input processing failed:', error);
    throw error;
  }
}

function generateOptimizedTwiML(response, workflowId, trackingId, processingTime) {
  console.log(`[generateOptimizedTwiML] Called with response: "${response?.substring(0, 50)}..."`);

  // Get host for WebSocket URL
  const host = process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com';
  const wsUrl = host.replace('https://', 'wss://').replace('http://', 'ws://');
  const websocketUrl = `${wsUrl}/api/conversationrelay-ws?workflowId=${workflowId}&trackingId=${trackingId}`;

  // Prepare welcome greeting for ConversationRelay
  const welcomeGreeting = (response || "Hello! I'm your AI assistant. How can I help you today?")
    .replace(/[<>&"']/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
      return entities[match];
    })
    .substring(0, 200); // Keep greeting concise for ConversationRelay

  // Generate ConversationRelay TwiML for real-time bidirectional audio streaming
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Real-time ConversationRelay with ${processingTime.toFixed(0)}ms processing -->
    <Connect action="/api/connect-action?workflowId=${workflowId}&trackingId=${trackingId}">
        <ConversationRelay
            url="${websocketUrl}"
            welcomeGreeting="${welcomeGreeting}"
            voice="alice"
            dtmfDetection="true"
            interruptByDtmf="true"
        />
    </Connect>
</Response>`;

  console.log(`[generateOptimizedTwiML] Generated ConversationRelay TwiML (${twiml.length} chars)`);
  console.log(`[generateOptimizedTwiML] WebSocket URL: ${websocketUrl}`);

  return twiml;
}

function generateErrorTwiML(errorMessage) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">I apologize, but I'm experiencing some technical difficulties. Please try calling back in a moment.</Say>
    <Hangup/>
</Response>`;
}

function getErrorResponse(language) {
  const errorMessages = {
    'en-US': "I'm sorry, I'm having trouble processing your request. Could you please try again?",
    'zh-HK': '唔好意思，我處理你嘅要求時遇到困難。可以再試一次嗎？',
    'zh-CN': '抱歉，我在处理您的请求时遇到了困难。您能再试一次吗？'
  };
  
  return errorMessages[language] || errorMessages['en-US'];
}

function fallbackToStandardProcessing(req, res) {
  console.log('[TwiML-Optimized] Falling back to ConversationRelay with basic configuration');

  const workflowId = req.query.id || 'default';
  const trackingId = req.query.trackingId || 'fallback';

  // Ensure proper headers are set
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  // Generate ConversationRelay TwiML even for fallback (no traditional TwiML)
  const host = process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com';
  const wsUrl = host.replace('https://', 'wss://').replace('http://', 'ws://');
  const websocketUrl = `${wsUrl}/api/conversationrelay-ws?workflowId=${workflowId}&trackingId=${trackingId}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Fallback ConversationRelay TwiML -->
    <Connect action="/api/connect-action?workflowId=${workflowId}&trackingId=${trackingId}">
        <ConversationRelay
            url="${websocketUrl}"
            welcomeGreeting="Hello! I'm your AI assistant. How can I help you today?"
            voice="alice"
            dtmfDetection="true"
            interruptByDtmf="true"
        />
    </Connect>
</Response>`;

  console.log('[TwiML-Optimized] Sending fallback ConversationRelay TwiML');
  res.status(200).send(twiml);
}

// Azure OpenAI integration (reused from existing twiml-ai.js)
async function callAzureOpenAI(messages) {
  try {
    const response = await fetch(process.env.AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
        max_tokens: 150, // Reduced for faster responses
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', response.status, errorText);
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Azure OpenAI call failed:', error);
    throw error;
  }
}

// Clean up call states periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [callSid, callState] of callStates.entries()) {
    if (now - callState.startTime > maxAge) {
      callStates.delete(callSid);
      console.log(`[TwiML-Optimized] Cleaned up expired call state for ${callSid}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes
