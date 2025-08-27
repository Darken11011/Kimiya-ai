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
  console.log(`[generateFastTwiML] Creating TwiML for workflow: ${workflowId}, tracking: ${trackingId}`);

  // Get host for WebSocket URL
  const host = process.env.WEBHOOK_BASE_URL || 'https://kimiyi-ai.onrender.com';
  const wsUrl = host.replace('https://', 'wss://').replace('http://', 'ws://');
  const websocketUrl = `${wsUrl}/api/conversationrelay-ws?workflowId=${workflowId}&trackingId=${trackingId}`;

  // CRITICAL: Encode & in URL parameters to prevent XML parsing errors
  const connectActionUrl = `/api/connect-action?workflowId=${workflowId}&amp;trackingId=${trackingId}`;
  const encodedWebsocketUrl = websocketUrl.replace(/&/g, '&amp;');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Fast ConversationRelay TwiML -->
    <Connect action="${connectActionUrl}">
        <ConversationRelay
            url="${encodedWebsocketUrl}"
            welcomeGreeting="Hello! I'm your AI assistant. How can I help you today?"
        />
    </Connect>
</Response>`;

  console.log(`[generateFastTwiML] Generated TwiML (${twiml.length} chars)`);
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
        />
    </Connect>
</Response>`;

  console.log('[generateFastFallbackTwiML] Sending emergency fallback TwiML');
  res.status(200).send(twiml);
}
