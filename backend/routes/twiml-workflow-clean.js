// Simplified workflow-based TwiML endpoint that Twilio can reliably process
module.exports = function handler(req, res) {
  console.log('=== SIMPLE WORKFLOW TWIML ENDPOINT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  try {
    // Set proper headers for TwiML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.id || 'default';
    const speechResult = req.body.SpeechResult || '';
    const step = parseInt(req.query.step || '0'); // Track conversation step

    console.log('Processing simple workflow:', {
      workflowId,
      step,
      hasUserInput: !!speechResult
    });

    // Get workflow data from global storage (simplified)
    const workflowData = global.workflowData && global.workflowData[workflowId];
    let startMessage = 'Hello! Welcome to our service. How can I help you today?';

    // Extract simple start message from workflow if available
    if (workflowData && workflowData.nodes) {
      const startNode = workflowData.nodes.find(node =>
        node.type === 'startNode' || node.type === 'start'
      );
      if (startNode && startNode.data && startNode.data.prompt) {
        startMessage = startNode.data.prompt;
      } else if (workflowData.globalPrompt) {
        startMessage = workflowData.globalPrompt;
      }
    }

    console.log('Using start message:', startMessage);

    // Simple step-based conversation flow (much more reliable for Twilio)
    let twiml;

    if (step === 0 && !speechResult) {
      // Step 0: Initial greeting
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${startMessage}</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}&step=1" method="POST">
        <Say voice="alice">Please tell me what you need help with.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
    <Hangup/>
</Response>`;
    } else if (step === 1) {
      // Step 1: Acknowledge user input and ask follow-up
      const userInput = speechResult || 'your request';
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">I understand you need help with ${userInput}. Let me assist you with that.</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}&step=2" method="POST">
        <Say voice="alice">Is there anything specific about ${userInput} that you'd like me to explain or help you with?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;
    } else if (step === 2) {
      // Step 2: Provide helpful response and offer more help
      const userInput = speechResult || 'that topic';
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for clarifying about ${userInput}. I've noted your request and our team will follow up with you soon.</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}&step=3" method="POST">
        <Say voice="alice">Is there anything else I can help you with today?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! Have a great day!</Say>
    <Hangup/>
</Response>`;
    } else {
      // Step 3+: End conversation
      const userInput = speechResult || 'your feedback';
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for ${userInput}. We appreciate your call and will be in touch soon. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
    }

    console.log('Sending simple workflow TwiML response');
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN SIMPLE WORKFLOW ===');
    console.error('Error:', error.message);

    // Ultra-simple fallback that always works
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. We're experiencing a small technical issue, but we've received your call. Our team will contact you shortly. Have a great day!</Say>
    <Hangup/>
</Response>`;

    console.log('Sending ultra-simple fallback TwiML');
    res.status(200).send(fallbackTwiML);
  }
};
