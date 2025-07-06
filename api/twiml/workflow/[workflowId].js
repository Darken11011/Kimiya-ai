module.exports = function handler(req, res) {
  // Set content type for TwiML
  res.setHeader('Content-Type', 'text/xml');

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { workflowId } = req.query;
  
  // For now, generate a basic TwiML response
  // In the future, this could fetch workflow data and generate dynamic TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a workflow-based call from your Call Flow Weaver application. Workflow ID: ${workflowId}. The call is working successfully.</Say>
    <Gather input="speech" action="${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/twiml/process/${workflowId}" method="POST" speechTimeout="3" timeout="10">
        <Say voice="alice">Please tell me how I can help you today.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
    <Hangup/>
</Response>`;

  res.send(twiml);
}
