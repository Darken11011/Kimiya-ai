module.exports = function handler(req, res) {
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { workflowId } = req.query;
  const { SpeechResult, Confidence } = req.body;
  
  console.log(`Processing speech for workflow ${workflowId}:`, { SpeechResult, Confidence });
  
  // Basic response based on speech input
  let responseText = "Thank you for your input.";
  
  if (SpeechResult) {
    // Simple keyword-based responses
    const speech = SpeechResult.toLowerCase();
    
    if (speech.includes('hello') || speech.includes('hi')) {
      responseText = "Hello! How can I assist you today?";
    } else if (speech.includes('help')) {
      responseText = "I'm here to help you. What do you need assistance with?";
    } else if (speech.includes('bye') || speech.includes('goodbye')) {
      responseText = "Thank you for calling. Have a great day! Goodbye.";
      
      // End the call
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${responseText}</Say>
    <Hangup/>
</Response>`;
      return res.send(twiml);
    } else {
      responseText = `You said: ${SpeechResult}. How can I help you with that?`;
    }
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${responseText}</Say>
    <Gather input="speech" action="${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/twiml/process/${workflowId}" method="POST" speechTimeout="3" timeout="10">
        <Say voice="alice">What else can I help you with?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`;

  res.send(twiml);
}
