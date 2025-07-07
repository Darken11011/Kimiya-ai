const express = require('express');
const router = express.Router();

// Default TwiML response
router.post('/default', (req, res) => {
  console.log('📋 Default TwiML requested');
  
  res.set('Content-Type', 'text/xml');
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from your Call Flow Weaver application. The call is working successfully. Thank you for testing!</Say>
    <Pause length="1"/>
    <Say voice="alice">This call will now end. Goodbye!</Say>
</Response>`;

  console.log('📤 Sending default TwiML response');
  res.send(twiml);
});

// Workflow-specific TwiML
router.post('/workflow/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  console.log('🔄 Workflow TwiML requested for ID:', workflowId);
  
  res.set('Content-Type', 'text/xml');
  
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a workflow-based call from your Call Flow Weaver application. Workflow ID: ${workflowId}. The call is working successfully.</Say>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="3" timeout="10">
        <Say voice="alice">Please tell me how I can help you today.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
    <Hangup/>
</Response>`;

  console.log('📤 Sending workflow TwiML response for:', workflowId);
  res.send(twiml);
});

// Process speech input for workflows
router.post('/process/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const { SpeechResult, Confidence } = req.body;
  
  console.log(`🎤 Processing speech for workflow ${workflowId}:`, { 
    SpeechResult, 
    Confidence,
    timestamp: new Date().toISOString()
  });
  
  res.set('Content-Type', 'text/xml');
  
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;
  
  // Basic response based on speech input
  let responseText = "Thank you for your input.";
  let shouldContinue = true;
  
  if (SpeechResult) {
    const speech = SpeechResult.toLowerCase();
    
    if (speech.includes('hello') || speech.includes('hi')) {
      responseText = "Hello! How can I assist you today?";
    } else if (speech.includes('help')) {
      responseText = "I'm here to help you. What do you need assistance with?";
    } else if (speech.includes('bye') || speech.includes('goodbye') || speech.includes('end')) {
      responseText = "Thank you for calling. Have a great day! Goodbye.";
      shouldContinue = false;
    } else if (speech.includes('thank you') || speech.includes('thanks')) {
      responseText = "You're welcome! Is there anything else I can help you with?";
    } else {
      responseText = `You said: ${SpeechResult}. How can I help you with that?`;
    }
  }

  let twiml;
  if (shouldContinue) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${responseText}</Say>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="3" timeout="10">
        <Say voice="alice">What else can I help you with?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${responseText}</Say>
    <Hangup/>
</Response>`;
  }

  console.log('📤 Sending speech processing TwiML response');
  res.send(twiml);
});

module.exports = router;
