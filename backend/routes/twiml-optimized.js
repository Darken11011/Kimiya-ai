const { getActiveOrchestrator } = require('./make-call-optimized');

/**
 * Fast TwiML Optimized Handler - Prevents Timeout Issues
 * Generates TwiML immediately without heavy processing to avoid 15s timeout
 */
module.exports = async function twimlOptimizedHandler(req, res) {
  const startTime = performance.now();

  try {
    // Set proper headers for TwiML immediately
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.id || 'default';
    const trackingId = req.query.trackingId || 'default';
    const callSid = req.body.CallSid || req.query.CallSid;

    console.log(`[TwiML-Optimized] ===== FAST TWIML REQUEST =====`);
    console.log(`[TwiML-Optimized] Call: ${callSid}, Workflow: ${workflowId}, Tracking: ${trackingId}`);

    // FAST PATH: Generate TwiML immediately without heavy processing
    // The actual conversation processing will happen in the WebSocket handler
    const fastTwiML = generateFastTwiML(workflowId, trackingId);
    
    const processingTime = performance.now() - startTime;
    console.log(`[TwiML-Optimized] FAST TwiML generated in ${processingTime.toFixed(2)}ms`);
    
    // Send response immediately to prevent timeout
    res.status(200).send(fastTwiML);
    
    // Optional: Initialize orchestrator in background (non-blocking)
    setImmediate(() => {
      try {
        const orchestrator = getActiveOrchestrator(trackingId);
        if (orchestrator) {
          console.log(`[TwiML-Optimized] Background orchestrator ready for ${trackingId}`);
        }
      } catch (error) {
        console.error(`[TwiML-Optimized] Background orchestrator error:`, error);
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error(`[TwiML-Optimized] Error after ${processingTime.toFixed(2)}ms:`, error);
    
    // Fast fallback
    return generateFastFallbackTwiML(req, res);
  }
};

// Fast TwiML generation functions
function generateFastTwiML(workflowId, trackingId) {
  console.log(`[generateFastTwiML] ===== CREATING TWIML =====`);
  console.log(`[generateFastTwiML] Workflow: ${workflowId}, Tracking: ${trackingId}`);

  // Get host for WebSocket URL
  const host = process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com';
  const wsUrl = host.replace('https://', 'wss://').replace('http://', 'ws://');

  // CRITICAL: Include all necessary parameters for ConversationRelay
  const websocketUrl = `${wsUrl}/api/conversationrelay-ws?workflowId=${workflowId}&trackingId=${trackingId}`;

  console.log(`[generateFastTwiML] WebSocket URL: ${websocketUrl}`);

  // CRITICAL: Encode & in URL parameters to prevent XML parsing errors
  const connectActionUrl = `/api/connect-action?workflowId=${workflowId}&amp;trackingId=${trackingId}`;
  const encodedWebsocketUrl = websocketUrl.replace(/&/g, '&amp;');

  // EMERGENCY: Try both ConversationRelay and Media Streams fallback
  const useMediaStreamsFallback = req.query.fallback === 'true';

  let twiml;

  if (useMediaStreamsFallback) {
    // Media Streams fallback to bypass ElevenLabs completely
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello Aditya! I'm your Kimiya. How can I help you today?</Say>
    <Connect>
        <Stream url="${encodedWebsocketUrl}" />
    </Connect>
</Response>`;
  } else {
    // ConversationRelay with ElevenLabs-compatible voice
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Fast ConversationRelay TwiML with Debug Info -->
    <Connect action="${connectActionUrl}">
        <ConversationRelay
            url="${encodedWebsocketUrl}"
            welcomeGreeting="Hello Aditya! I'm your Kimiya. How can I help you today?"
            voice="alice"
            language="en-US"
        />
    </Connect>
</Response>`;
  }

  console.log(`[generateFastTwiML] ===== TWIML GENERATED =====`);
  console.log(`[generateFastTwiML] TwiML length: ${twiml.length} chars`);
  console.log(`[generateFastTwiML] WebSocket URL encoded: ${encodedWebsocketUrl}`);
  console.log(`[generateFastTwiML] Connect action: ${connectActionUrl}`);

  return twiml;
}

function generateFastFallbackTwiML(req, res) {
  console.log('[generateFastFallbackTwiML] Creating emergency fallback TwiML');

  const workflowId = req.query.id || 'fallback';
  const trackingId = req.query.trackingId || 'emergency';

  // Set headers
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  // Generate emergency ConversationRelay TwiML
  const host = process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com';
  const wsUrl = host.replace('https://', 'wss://').replace('http://', 'ws://');
  const websocketUrl = `${wsUrl}/api/conversationrelay-ws?workflowId=${workflowId}&trackingId=${trackingId}`;

  const connectActionUrl = `/api/connect-action?workflowId=${workflowId}&amp;trackingId=${trackingId}`;
  const encodedWebsocketUrl = websocketUrl.replace(/&/g, '&amp;');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Emergency Fallback ConversationRelay TwiML -->
    <Connect action="${connectActionUrl}">
        <ConversationRelay
            url="${encodedWebsocketUrl}"
            welcomeGreeting="Hello! I'm your AI assistant. How can I help you today?"
            voice="alice"
            language="en-US"
        />
    </Connect>
</Response>`;

  console.log('[generateFastFallbackTwiML] Sending emergency fallback TwiML');
  res.status(200).send(twiml);
}
