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

    console.log(`[TwiML-Optimized] Processing call ${callSid} with tracking ${trackingId}`);

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
    const twiml = generateOptimizedTwiML(cleanResponse, workflowId, trackingId, totalProcessingTime);

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

    // Send optimized TwiML response
    res.status(200).send(twiml);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`[TwiML-Optimized] Request failed after ${totalTime}ms:`, error);
    
    // Send error TwiML
    const errorTwiml = generateErrorTwiML(error.message);
    res.status(200).send(errorTwiml);
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
  const optimizationIndicator = processingTime < 300 ? 'optimized' : 'standard';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Optimized response generated in ${processingTime.toFixed(0)}ms -->
    <Say voice="alice">${response}</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-optimized?id=${workflowId}&trackingId=${trackingId}" method="POST">
        <Say voice="alice">I'm listening...</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Let me try again.</Say>
    <Gather input="speech" timeout="8" speechTimeout="2" action="/api/twiml-optimized?id=${workflowId}&trackingId=${trackingId}" method="POST">
        <Say voice="alice">Please go ahead, I'm here to help.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! If you need further assistance, please call back. Have a great day!</Say>
    <Hangup/>
</Response>`;
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
  console.log('[TwiML-Optimized] Falling back to standard processing');
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your AI assistant. The optimized system is currently unavailable, but I'm still here to help you.</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-ai?id=${req.query.id}" method="POST">
        <Say voice="alice">How can I assist you today?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;

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
