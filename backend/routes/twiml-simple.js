// Simple TwiML endpoint for conversational calls without complex AI processing
module.exports = function handler(req, res) {
  console.log('=== SIMPLE TWIML ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  // Set proper headers for TwiML
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  const workflowId = req.query.id || 'default';
  const userInput = req.body?.SpeechResult || req.body?.Digits || '';
  const callSid = req.body?.CallSid || 'unknown';

  console.log('Processing simple conversation:', {
    workflowId,
    userInput,
    callSid,
    hasUserInput: !!userInput
  });

  let twiml;
  
  if (!userInput) {
    // First interaction - greet and ask for input
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your AI assistant from Call Flow Weaver. I'm here to help you with any questions or tasks you might have. What can I do for you today?</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-simple?id=${workflowId}" method="POST">
        <Say voice="alice">Please tell me how I can assist you.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling, goodbye!</Say>
    <Hangup/>
</Response>`;
  } else {
    // User provided input - give a helpful response
    const responses = [
      `Thank you for telling me about ${userInput}. I understand you need help with that.`,
      `I heard you mention ${userInput}. That's interesting, let me help you with that.`,
      `You said ${userInput}. I'm here to assist you with whatever you need.`,
      `I understand you're asking about ${userInput}. I'm happy to help you.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${randomResponse}</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-simple?id=${workflowId}" method="POST">
        <Say voice="alice">Is there anything else I can help you with today?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling Call Flow Weaver! Have a great day!</Say>
    <Hangup/>
</Response>`;
  }

  console.log('Sending simple TwiML response');
  res.status(200).send(twiml);
};
