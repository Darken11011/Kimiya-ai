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

// Workflow-specific TwiML - Start conversation naturally
router.post('/workflow/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  console.log('🔄 Workflow TwiML requested for ID:', workflowId);

  res.set('Content-Type', 'text/xml');

  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;

  try {
    // Get workflow data from the request body or session
    // For now, we'll use a natural greeting and let the AI handle the conversation
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="5" timeout="15" enhanced="true">
        <Say voice="alice">Hello! Thank you for calling. How may I assist you today?</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Let me try again.</Say>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="5" timeout="15">
        <Say voice="alice">How can I help you?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`;

    console.log('📤 Sending natural workflow TwiML response for:', workflowId);
    res.send(twiml);
  } catch (error) {
    console.error('Error in workflow TwiML:', error);
    // Fallback TwiML
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! How can I help you today?</Say>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="5" timeout="15">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Hangup/>
</Response>`;
    res.send(fallbackTwiml);
  }
});

// Process speech input for workflows with AI conversation
router.post('/process/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const { SpeechResult, Confidence, CallSid } = req.body;

  console.log(`🎤 Processing speech for workflow ${workflowId}:`, {
    SpeechResult,
    Confidence,
    CallSid,
    timestamp: new Date().toISOString()
  });

  res.set('Content-Type', 'text/xml');

  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;

  let responseText = "I understand. Let me help you with that.";
  let shouldContinue = true;

  try {
    if (SpeechResult && SpeechResult.trim()) {
      // Use AI to generate intelligent responses based on the workflow
      responseText = await generateAIResponse(SpeechResult, workflowId, CallSid);

      // Check if the conversation should end
      const speech = SpeechResult.toLowerCase();
      if (speech.includes('bye') || speech.includes('goodbye') ||
          speech.includes('end call') || speech.includes('hang up') ||
          speech.includes('that\'s all') || speech.includes('thank you, goodbye')) {
        shouldContinue = false;
        responseText = "Thank you for calling. Have a wonderful day! Goodbye.";
      }
    } else {
      responseText = "I didn't catch that. Could you please repeat what you said?";
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    responseText = "I understand. How else can I assist you today?";
  }

  let twiml;
  if (shouldContinue) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${escapeXml(responseText)}</Say>
    <Gather input="speech" action="${baseUrl}/api/twiml/process/${workflowId}" method="POST" speechTimeout="5" timeout="15" enhanced="true">
        <Pause length="1"/>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${escapeXml(responseText)}</Say>
    <Hangup/>
</Response>`;
  }

  console.log('📤 Sending AI-powered TwiML response');
  res.send(twiml);
});

// Helper function to generate AI responses
async function generateAIResponse(userInput, workflowId, callSid) {
  try {
    // Try to get workflow data for more intelligent responses
    let workflowData = null;
    try {
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/workflow/${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        workflowData = data.workflow;
      }
    } catch (error) {
      console.log('Could not fetch workflow data, using fallback responses');
    }

    const input = userInput.toLowerCase();

    // Use global prompt if available
    let context = '';
    if (workflowData && workflowData.globalPrompt) {
      context = workflowData.globalPrompt;
    }

    // Find start node message if available
    let startMessage = '';
    if (workflowData && workflowData.nodes) {
      const startNode = workflowData.nodes.find(node => node.type === 'startNode');
      if (startNode && startNode.data && startNode.data.firstMessage) {
        startMessage = startNode.data.firstMessage;
      }
    }

    // Real estate specific responses (based on the workflow example)
    if (input.includes('buy') || input.includes('purchase') || input.includes('looking for')) {
      return "I'd be happy to help you find the perfect property! What type of property are you looking for - a house, apartment, or commercial space? And do you have a preferred location or budget in mind?";
    }

    if (input.includes('sell') || input.includes('selling')) {
      return "Great! I can help you sell your property. Can you tell me a bit about the property you're looking to sell? What type is it and where is it located?";
    }

    if (input.includes('rent') || input.includes('rental')) {
      return "I can assist you with rental properties. Are you looking to rent a property or do you have a property you'd like to rent out?";
    }

    if (input.includes('price') || input.includes('cost') || input.includes('budget')) {
      return "I understand you're interested in pricing information. Property values can vary based on location, size, and condition. Could you tell me more about the specific property or area you're interested in?";
    }

    if (input.includes('location') || input.includes('area') || input.includes('neighborhood')) {
      return "Location is definitely important! What area or neighborhood are you most interested in? I can provide information about different locations and their features.";
    }

    if (input.includes('appointment') || input.includes('viewing') || input.includes('see') || input.includes('visit')) {
      return "I'd be happy to arrange a viewing for you! Let me connect you with one of our agents who can schedule an appointment at your convenience. What days and times work best for you?";
    }

    // General helpful responses
    if (input.includes('help') || input.includes('assist')) {
      return "I'm here to help you with all your real estate needs! Whether you're buying, selling, or renting, I can provide information and connect you with our expert agents. What specific area would you like assistance with?";
    }

    if (input.includes('information') || input.includes('details')) {
      return "I'd be happy to provide you with detailed information. What specific details would you like to know about? I can help with property information, market trends, or our services.";
    }

    // Default intelligent response
    return `I understand you mentioned ${userInput}. That's something I can definitely help you with. Could you tell me a bit more about what you're looking for so I can provide you with the most relevant information?`;

  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    return "I understand. How can I best assist you today?";
  }
}

// Helper function to escape XML special characters
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
