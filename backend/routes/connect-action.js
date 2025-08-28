/**
 * Connect Action Handler for ConversationRelay
 * Handles the action callback when ConversationRelay connection ends
 */
module.exports = async function connectActionHandler(req, res) {
  try {
    // Set proper headers for TwiML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.workflowId || req.body.workflowId;
    const trackingId = req.query.trackingId || req.body.trackingId;
    const callSid = req.body.CallSid;
    const connectStatus = req.body.ConnectStatus;
    const connectDuration = req.body.ConnectDuration;

    console.log(`[Connect-Action] ConversationRelay connection ended:`, {
      callSid,
      connectStatus,
      connectDuration,
      workflowId,
      trackingId,
      timestamp: new Date().toISOString()
    });

    // Log detailed connection information
    if (connectStatus === 'completed') {
      console.log(`[Connect-Action] ✅ ConversationRelay completed successfully after ${connectDuration} seconds`);
      console.log(`[Connect-Action] Real-time audio streaming session ended normally`);
    } else if (connectStatus === 'failed') {
      console.error(`[Connect-Action] ❌ ConversationRelay failed with status: ${connectStatus}`);
      console.error(`[Connect-Action] This may indicate WebSocket connection issues`);
    } else {
      console.log(`[Connect-Action] ConversationRelay ended with status: ${connectStatus}`);
    }

    // Log all request parameters for debugging
    console.log(`[Connect-Action] Full request body:`, req.body);
    console.log(`[Connect-Action] Full request query:`, req.query);

    // Clean up any active orchestrator
    try {
      const { removeActiveOrchestrator } = require('./make-call-optimized');
      const orchestrator = removeActiveOrchestrator(trackingId);
      if (orchestrator) {
        await orchestrator.stopOptimizedConversation(callSid);
        console.log(`[Connect-Action] Cleaned up orchestrator for ${callSid}`);
      }
    } catch (error) {
      console.error(`[Connect-Action] Error cleaning up orchestrator:`, error);
    }

    // Generate closing TwiML
    const closingTwiML = generateClosingTwiML(connectStatus, connectDuration);
    
    res.status(200).send(closingTwiML);

  } catch (error) {
    console.error('[Connect-Action] Error processing connect action:', error);
    
    // Send error TwiML - ConversationRelay native TTS
    const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Thank you for calling. Have a great day!</Say>
    <Hangup/>
</Response>`;
    
    res.status(200).send(errorTwiML);
  }
};

function generateClosingTwiML(connectStatus, connectDuration) {
  let closingMessage = "Thank you for calling! Have a great day!";
  
  // Customize message based on connection status
  switch (connectStatus) {
    case 'completed':
      if (connectDuration && parseInt(connectDuration) > 30) {
        closingMessage = "Thank you for the conversation! If you need further assistance, please call back. Have a great day!";
      } else {
        closingMessage = "Thank you for calling! If you need more help, please call back. Have a great day!";
      }
      break;
      
    case 'failed':
      closingMessage = "I apologize for the technical difficulties. Please try calling back. Thank you!";
      break;
      
    case 'busy':
      closingMessage = "I'm currently busy. Please try calling back in a moment. Thank you!";
      break;
      
    case 'no-answer':
      closingMessage = "Thank you for calling. If you need assistance, please call back. Have a great day!";
      break;
      
    default:
      closingMessage = "Thank you for calling! Have a great day!";
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${closingMessage}</Say>
    <Hangup/>
</Response>`;
}
