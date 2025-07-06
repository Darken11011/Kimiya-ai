module.exports = function handler(req, res) {
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  // Generate basic TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from your Call Flow Weaver application. The call is working successfully. Thank you for testing!</Say>
    <Pause length="1"/>
    <Say voice="alice">This call will now end. Goodbye!</Say>
</Response>`;

  res.send(twiml);
}
