const fetch = require('node-fetch');

// Workflow-based TwiML endpoint for dynamic call conversations
module.exports = async function handler(req, res) {
  // IMPORTANT: Log immediately to ensure we can see if this endpoint is called
  console.log('=== TWIML WORKFLOW ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Allow both GET and POST requests from Twilio
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).send('Method not allowed');
  }

  // Set proper headers for TwiML
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  console.log('Workflow TwiML endpoint called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  try {
    // Get workflow ID from query parameters
    const workflowId = req.query.id;

    console.log('TwiML Workflow Request Details:', {
      method: req.method,
      query: req.query,
      body: req.body,
      workflowId,
      hasWorkflowData: !!(req.query.wd || req.body.wd),
      workflowDataLength: (req.query.wd || req.body.wd || '').length
    });

    // Get call state from Twilio parameters
    const callSid = req.body.CallSid || req.query.CallSid;
    const from = req.body.From || req.query.From;
    const to = req.body.To || req.query.To;
    const speechResult = req.body.SpeechResult;
    const digits = req.body.Digits;
    const callStatus = req.body.CallStatus;

    // Get current node from session or start with first node
    let currentNodeId = req.body.currentNodeId || req.query.currentNodeId;
    let conversationHistory = [];

    try {
      const historyParam = req.body.conversationHistory || req.query.conversationHistory;
      if (historyParam) {
        conversationHistory = JSON.parse(decodeURIComponent(historyParam));
      }
    } catch (e) {
      console.log('No conversation history found, starting fresh:', e.message);
    }

    console.log('Call state:', {
      workflowId,
      callSid,
      currentNodeId,
      speechResult,
      digits,
      conversationHistoryLength: conversationHistory.length
    });

    // Load workflow configuration
    console.log('Loading workflow configuration...');
    const workflow = await loadWorkflowConfig(workflowId, req);
    if (!workflow) {
      console.error('Failed to load workflow configuration');
      const errorTwiML = generateErrorTwiML('Workflow configuration not found');
      return res.status(200).send(errorTwiML);
    }

    console.log('Workflow loaded:', {
      id: workflow.id,
      nodeCount: workflow.nodes?.length || 0,
      edgeCount: workflow.edges?.length || 0,
      hasGlobalPrompt: !!workflow.globalPrompt
    });

    // If no current node, start with the first node
    if (!currentNodeId) {
      currentNodeId = findStartNode(workflow.nodes);
      console.log('Starting with node:', currentNodeId);
    }

    // Find current node
    const currentNode = workflow.nodes.find(node => node.id === currentNodeId);
    if (!currentNode) {
      console.error('Current node not found:', currentNodeId, 'Available nodes:', workflow.nodes.map(n => n.id));
      const errorTwiML = generateErrorTwiML('Invalid workflow state - node not found');
      return res.status(200).send(errorTwiML);
    }

    console.log('Processing current node:', {
      id: currentNode.id,
      type: currentNode.type,
      label: currentNode.data?.label
    });

    // Process the current node and generate TwiML
    const twimlResponse = await processWorkflowNode(
      currentNode,
      workflow,
      {
        speechResult,
        digits,
        conversationHistory,
        callSid,
        from,
        to
      }
    );

    console.log('Generated TwiML response:', twimlResponse);
    res.status(200).send(twimlResponse);

  } catch (error) {
    console.error('=== ERROR IN TWIML WORKFLOW ===');
    console.error('Error processing workflow TwiML:', {
      message: error.message,
      stack: error.stack,
      workflowId: req.query.id,
      method: req.method,
      query: req.query,
      body: req.body
    });

    // Return a simple working TwiML response for debugging
    const simpleTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test from the workflow endpoint. I can hear you and the system is working. Let me know how I can help you today.</Say>
    <Pause length="2"/>
    <Say voice="alice">If you can hear this message, the TwiML endpoint is working correctly.</Say>
</Response>`;

    console.log('Sending simple TwiML response due to error');
    res.status(200).send(simpleTwiML);
  }
}

// Load workflow configuration
async function loadWorkflowConfig(workflowId, req) {
  try {
    console.log(`Loading workflow configuration for ${workflowId}`);

    // For now, always use a simple default workflow to test basic functionality
    // This eliminates URL length and data parsing issues

    // Use a simple working workflow for testing
    console.log(`Creating simple test workflow for ${workflowId}`);
    const testWorkflow = {
      id: workflowId || 'test',
      globalPrompt: 'You are a helpful and friendly AI assistant. Keep responses short and conversational for phone calls.',
      nodes: [
        {
          id: 'start',
          type: 'startNode',
          data: {
            label: 'Start',
            prompt: 'Greet the caller warmly and ask how you can help.',
            instructions: 'Be friendly and brief.'
          }
        }
      ],
      edges: [],
      config: {
        llm: {
          provider: 'azure_openai',
          azure: {
            apiKey: 'f6d564a83af3498c9beb46d7d3e3da96',
            endpoint: 'https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 150
          }
        }
      }
    };

    return testWorkflow;
  } catch (error) {
    console.error('Error loading workflow config:', error);
    return null;
  }
}

// Find the start node in the workflow
function findStartNode(nodes) {
  console.log('Finding start node from nodes:', nodes.map(n => ({ id: n.id, type: n.type })));
  const startNode = nodes.find(node => node.type === 'startNode');
  const startNodeId = startNode ? startNode.id : nodes[0]?.id;
  console.log('Selected start node:', startNodeId);
  return startNodeId;
}

// Process a workflow node and generate appropriate TwiML
async function processWorkflowNode(node, workflow, context) {
  const { speechResult, conversationHistory, callSid } = context;
  
  console.log(`Processing node: ${node.type} - ${node.data?.label}`);

  switch (node.type) {
    case 'startNode':
      return await processConversationNode(node, workflow, context, true);
    
    case 'conversationNode':
      return await processConversationNode(node, workflow, context);
    
    case 'endNode':
      return await processEndNode(node, workflow, context);
    
    default:
      return await processConversationNode(node, workflow, context);
  }
}

// Process conversation nodes (including start nodes)
async function processConversationNode(node, workflow, context, isStart = false) {
  const { speechResult, conversationHistory, callSid } = context;

  // Build conversation context
  const messages = [...conversationHistory];

  // Add user speech if available
  if (speechResult && speechResult.trim()) {
    messages.push({
      role: 'user',
      content: speechResult.trim()
    });
  }

  // Generate AI response
  const aiResponse = await generateAIResponse(node, workflow, messages, isStart);

  // Update conversation history
  const updatedHistory = [...messages];
  if (aiResponse) {
    updatedHistory.push({
      role: 'assistant',
      content: aiResponse
    });
  }

  // Determine if we should move to next node based on conversation context
  let nextNode = null;
  let shouldContinueInNode = true;

  // Only consider moving to next node if we have user input and sufficient conversation
  if (speechResult && updatedHistory.length >= 4) { // At least 2 exchanges
    const shouldMove = await shouldMoveToNextNode(node, workflow, updatedHistory, speechResult);
    if (shouldMove) {
      nextNode = getNextNode(node, workflow, speechResult);
      shouldContinueInNode = false;
    }
  }

  // If no next node determined, stay in current node for more conversation
  if (shouldContinueInNode) {
    nextNode = node; // Stay in current node
  }

  // Generate TwiML with speech recognition
  return generateConversationTwiML(
    aiResponse,
    nextNode,
    updatedHistory,
    callSid,
    workflow.id,
    shouldContinueInNode
  );
}

// Process end nodes
async function processEndNode(node, workflow, context) {
  const { conversationHistory } = context;
  
  // Generate final message
  const messages = [...conversationHistory];
  const finalMessage = await generateAIResponse(node, workflow, messages, false, true);
  
  // Generate TwiML that ends the call
  return generateEndTwiML(finalMessage);
}

// Generate AI response using Azure OpenAI
async function generateAIResponse(node, workflow, messages, isStart = false, isEnd = false) {
  try {
    console.log('Generating AI response for node:', node.id, 'isStart:', isStart, 'isEnd:', isEnd);

    const config = workflow.config?.llm?.azure;
    if (!config) {
      console.error('Azure OpenAI configuration not found in workflow config');
      throw new Error('Azure OpenAI configuration not found');
    }

    console.log('Azure config found:', {
      hasApiKey: !!config.apiKey,
      hasEndpoint: !!config.endpoint,
      model: config.model
    });

    // Build system prompt
    let systemPrompt = workflow.globalPrompt || 'You are a helpful AI assistant.';

    if (node.data?.prompt) {
      systemPrompt += `\n\nCurrent context: ${node.data.prompt}`;
    }

    if (node.data?.instructions) {
      systemPrompt += `\n\nInstructions: ${node.data.instructions}`;
    }

    // Add call-specific instructions
    systemPrompt += `\n\nYou are in a phone conversation. Be natural, conversational, and human-like. Keep responses concise but engaging. Don't mention technical details about workflows or nodes.`;

    if (isStart) {
      systemPrompt += ' This is the beginning of the call - greet the caller warmly.';
    }

    if (isEnd) {
      systemPrompt += ' This is the end of the call - provide a warm closing.';
    }

    // Prepare messages for API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10) // Keep last 10 messages for context
    ];

    // If no user messages yet (start of call), add a greeting prompt
    if (isStart && messages.length === 0) {
      apiMessages.push({ role: 'user', content: 'Hello' });
    }

    console.log('Calling Azure OpenAI with:', {
      messageCount: apiMessages.length,
      endpoint: config.endpoint,
      systemPromptLength: systemPrompt.length
    });

    const requestBody = {
      messages: apiMessages,
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Azure OpenAI response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error response:', errorText);
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Azure OpenAI response data:', JSON.stringify(data, null, 2));

    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I\'m having trouble responding right now.';

    console.log('AI Response generated successfully:', aiResponse.substring(0, 100) + '...');
    return aiResponse;

  } catch (error) {
    console.error('Error generating AI response:', error.message, error.stack);
    return 'Hello! I\'m here to help you today. How can I assist you?';
  }
}

// Determine if conversation should move to next node
async function shouldMoveToNextNode(currentNode, workflow, conversationHistory, userInput) {
  try {
    const config = workflow.config?.llm?.azure;
    if (!config) {
      return false; // Stay in node if no AI config
    }

    // Create evaluation prompt
    const evaluationPrompt = `Based on this conversation, determine if the current conversation topic/goal has been sufficiently addressed and we should move to the next step in the workflow.

Current node purpose: ${currentNode.data?.prompt || 'General conversation'}
Current node instructions: ${currentNode.data?.instructions || 'Continue conversation'}

Recent conversation:
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Latest user input: ${userInput}

Consider:
- Has the main purpose of this conversation step been fulfilled?
- Is the user ready to move forward?
- Would it be natural to transition to the next topic?

Respond with only "YES" if we should move to the next node, or "NO" if we should continue the conversation in this node.`;

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'system', content: evaluationPrompt }],
        max_tokens: 10,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return false; // Stay in node if evaluation fails
    }

    const data = await response.json();
    const evaluation = data.choices[0]?.message?.content || 'NO';

    console.log('Node transition evaluation:', evaluation);
    return evaluation.trim().toUpperCase().includes('YES');

  } catch (error) {
    console.error('Error evaluating node transition:', error);
    return false; // Stay in node if evaluation fails
  }
}

// Get the next node in the workflow
function getNextNode(currentNode, workflow, userInput) {
  // Find outgoing edges from current node
  const outgoingEdges = workflow.edges.filter(edge => edge.source === currentNode.id);

  if (outgoingEdges.length === 0) {
    return null; // End of workflow
  }

  // For now, just take the first edge (can be enhanced with conditional logic)
  const nextEdge = outgoingEdges[0];
  return workflow.nodes.find(node => node.id === nextEdge.target);
}

// Generate TwiML for conversation nodes
function generateConversationTwiML(message, nextNode, conversationHistory, callSid, workflowId, shouldContinueInNode = false) {
  const encodedHistory = encodeURIComponent(JSON.stringify(conversationHistory));
  const nextNodeId = nextNode ? nextNode.id : null;

  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${escapeXml(message)}</Say>`;

  if (nextNode) {
    // Continue conversation with speech recognition
    const gatherTimeout = shouldContinueInNode ? "8" : "5"; // Longer timeout for ongoing conversations
    const speechTimeout = shouldContinueInNode ? "3" : "2";

    twiml += `
    <Gather input="speech" timeout="${gatherTimeout}" speechTimeout="${speechTimeout}" action="/api/twiml-workflow?id=${workflowId}&currentNodeId=${nextNodeId}&conversationHistory=${encodedHistory}" method="POST">
    </Gather>
    <Redirect>/api/twiml-workflow?id=${workflowId}&currentNodeId=${nextNodeId}&conversationHistory=${encodedHistory}</Redirect>`;
  } else {
    // End the call
    twiml += `
    <Pause length="1"/>
    <Hangup/>`;
  }

  twiml += `
</Response>`;

  return twiml;
}

// Generate TwiML for end nodes
function generateEndTwiML(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${escapeXml(message)}</Say>
    <Pause length="1"/>
    <Hangup/>
</Response>`;
}

// Generate error TwiML
function generateErrorTwiML(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${escapeXml(message)}</Say>
    <Hangup/>
</Response>`;
}

// Escape XML special characters
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
