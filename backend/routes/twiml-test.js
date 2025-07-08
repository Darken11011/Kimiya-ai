// Simple test TwiML endpoint
module.exports = function handler(req, res) {
  console.log('=== TWIML TEST ENDPOINT CALLED ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  // Set proper headers for TwiML
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  // Generate simple working TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test from the TwiML endpoint. The backend is working correctly. This is a successful test call.</Say>
    <Pause length="2"/>
    <Say voice="alice">If you can hear this message, the TwiML routing is working properly. Thank you for testing!</Say>
    <Hangup/>
</Response>`;

  console.log('Sending test TwiML response');
  res.status(200).send(twiml);
};
