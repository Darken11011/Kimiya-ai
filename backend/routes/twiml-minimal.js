// Minimal TwiML endpoint that should always work
module.exports = function handler(req, res) {
  console.log('=== MINIMAL TWIML ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  try {
    // Set proper headers for TwiML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const speechResult = req.body.SpeechResult || '';
    
    console.log('Processing minimal call:', {
      hasUserInput: !!speechResult,
      speechResult: speechResult
    });

    let twiml;
    
    if (!speechResult) {
      // First interaction
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your AI assistant. How can I help you today?</Say>
    <Gather input="speech" timeout="5" action="/api/twiml-minimal" method="POST">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;
    } else {
      // User provided input
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for telling me about ${speechResult}. I understand your request.</Say>
    <Gather input="speech" timeout="5" action="/api/twiml-minimal" method="POST">
        <Say voice="alice">Is there anything else I can help you with?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! Have a great day!</Say>
    <Hangup/>
</Response>`;
    }

    console.log('Sending minimal TwiML response');
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN MINIMAL TWIML ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Absolute minimal fallback
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. We are experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
</Response>`;
    
    console.log('Sending absolute minimal fallback');
    res.status(200).send(fallbackTwiML);
  }
};
