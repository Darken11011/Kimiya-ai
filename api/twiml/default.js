export default function handler(req, res) {
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');

  // Allow both GET and POST requests from Twilio
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  console.log('TwiML endpoint called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  // Generate basic TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from your Call Flow Weaver application. The call is working successfully. Thank you for testing!</Say>
    <Pause length="1"/>
    <Say voice="alice">This call will now end. Goodbye!</Say>
</Response>`;

  console.log('Sending TwiML response:', twiml);
  res.send(twiml);
}
