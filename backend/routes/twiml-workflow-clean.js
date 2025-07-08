// Clean workflow-based TwiML endpoint for dynamic call conversations
module.exports = async function handler(req, res) {
  console.log('=== WORKFLOW TWIML ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    // Set proper headers for TwiML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.id;
    const callSid = req.body.CallSid || req.query.CallSid;
    const speechResult = req.body.SpeechResult;
    const digits = req.body.Digits;
    let currentNodeId = req.body.currentNodeId || req.query.currentNodeId;

    console.log('Processing workflow call:', {
      workflowId,
      callSid,
      currentNodeId,
      hasUserInput: !!(speechResult || digits)
    });

    // Get workflow data from global storage
    const workflowData = global.workflowData && global.workflowData[workflowId];
    
    if (!workflowData) {
      console.log('No workflow data found for ID:', workflowId);
      const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your AI assistant. How can I help you today?</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}" method="POST">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;
      return res.status(200).send(fallbackTwiML);
    }

    console.log('Found workflow data:', {
      nodeCount: workflowData.nodes.length,
      edgeCount: workflowData.edges.length,
      hasGlobalPrompt: !!workflowData.globalPrompt
    });

    // Find start node if no current node
    if (!currentNodeId) {
      const startNode = workflowData.nodes.find(node => 
        node.type === 'startNode' || 
        node.type === 'start' || 
        node.data?.label?.toLowerCase().includes('start')
      );
      
      currentNodeId = startNode ? startNode.id : workflowData.nodes[0]?.id;
      console.log('Starting with node:', currentNodeId);
    }

    // Find the current node
    const currentNode = workflowData.nodes.find(node => node.id === currentNodeId);
    
    if (!currentNode) {
      console.log('Current node not found:', currentNodeId);
      const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">I'm sorry, there was an issue with the workflow. Please try again later.</Say>
    <Hangup/>
</Response>`;
      return res.status(200).send(errorTwiML);
    }

    console.log('Processing node:', {
      id: currentNode.id,
      type: currentNode.type,
      label: currentNode.data?.label
    });

    // Generate TwiML based on the current node and user input
    let twiml;
    const userInput = speechResult || digits;
    
    if (!userInput) {
      // First interaction - use node's prompt
      const nodePrompt = currentNode.data?.prompt || 
                        currentNode.data?.message || 
                        currentNode.data?.label || 
                        workflowData.globalPrompt ||
                        'Hello! How can I help you?';
      
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${nodePrompt}</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}&currentNodeId=${currentNodeId}" method="POST">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
    <Hangup/>
</Response>`;
    } else {
      // User provided input - find next node
      console.log('User input received:', userInput);
      
      const outgoingEdges = workflowData.edges.filter(edge => edge.source === currentNodeId);
      let nextNode = null;
      
      if (outgoingEdges.length > 0) {
        const nextNodeId = outgoingEdges[0].target;
        nextNode = workflowData.nodes.find(node => node.id === nextNodeId);
      }
      
      if (nextNode) {
        const nextPrompt = nextNode.data?.prompt || 
                          nextNode.data?.message || 
                          nextNode.data?.label || 
                          'Thank you for that information.';
        
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">I understand you said: ${userInput}. ${nextPrompt}</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${workflowId}&currentNodeId=${nextNode.id}" method="POST">
        <Say voice="alice">What would you like to do next?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;
      } else {
        // No next node - end conversation
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for telling me: ${userInput}. I've noted that information. Have a great day!</Say>
    <Hangup/>
</Response>`;
      }
    }

    console.log('Sending workflow-based TwiML response');
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN WORKFLOW TWIML ===');
    console.error('Error:', error.message);
    
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your AI assistant. There was a small technical issue, but I'm here to help you. How can I assist you today?</Say>
    <Gather input="speech" timeout="5" speechTimeout="2" action="/api/twiml-workflow?id=${req.query.id || 'fallback'}" method="POST">
        <Say voice="alice">Please tell me what you need help with.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling, goodbye!</Say>
    <Hangup/>
</Response>`;
    
    console.log('Sending fallback TwiML response due to error');
    res.status(200).send(fallbackTwiML);
  }
};
