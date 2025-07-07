export default function handler(req, res) {
  // Allow both GET and POST requests from Twilio
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  // Set proper headers for TwiML
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  console.log('TwiML endpoint called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  // Generate basic TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from Kimiyi AI. The call is working successfully. Thank you for testing!</Say>
    <Pause length="1"/>
    <Say voice="alice">This call will now end. Goodbye!</Say>
</Response>`;

  console.log('Sending TwiML response:', twiml);

  // Send the TwiML response
  res.status(200).end(twiml);
}
