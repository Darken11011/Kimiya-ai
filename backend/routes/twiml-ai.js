const fetch = require('node-fetch');

// Global storage for call conversations (in production, use Redis or database)
global.callConversations = global.callConversations || {};

// Cleanup old conversations (older than 1 hour) to prevent memory leaks
const cleanupOldConversations = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(global.callConversations).forEach(callSid => {
    const conversation = global.callConversations[callSid];
    if (conversation.startTime < oneHourAgo) {
      delete global.callConversations[callSid];
      console.log(`Cleaned up old conversation: ${callSid}`);
    }
  });
};

// Run cleanup every 30 minutes
setInterval(cleanupOldConversations, 30 * 60 * 1000);

// AI-powered TwiML endpoint using Azure OpenAI with workflow support
module.exports = async function handler(req, res) {
  console.log('=== AI TWIML ENDPOINT CALLED ===');
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
    const callSid = req.body.CallSid || 'unknown';
    const from = req.body.From || 'unknown';

    console.log('Processing AI call:', {
      workflowId,
      callSid,
      from,
      hasUserInput: !!speechResult
    });

    // Initialize or get conversation state for this call
    if (!global.callConversations[callSid]) {
      global.callConversations[callSid] = {
        messages: [],
        currentNodeId: null,
        conversationTurns: 0,
        conversationSummary: '',
        startTime: new Date(),
        workflowId: workflowId
      };
    }

    const callState = global.callConversations[callSid];

    // Get workflow data for context
    const workflowData = global.workflowData && global.workflowData[workflowId];

    // Initialize current node if not set
    if (!callState.currentNodeId && workflowData && workflowData.nodes) {
      const startNode = workflowData.nodes.find(node =>
        node.type === 'startNode' || node.type === 'start'
      );
      if (startNode) {
        callState.currentNodeId = startNode.id;
      }
    }

    // Helper functions for workflow management
    const getCurrentNode = () => {
      if (!workflowData || !workflowData.nodes) return null;
      return workflowData.nodes.find(node => node.id === callState.currentNodeId);
    };

    const getNextNode = () => {
      if (!workflowData || !workflowData.edges || !callState.currentNodeId) return null;
      const outgoingEdges = workflowData.edges.filter(edge => edge.source === callState.currentNodeId);
      if (outgoingEdges.length === 0) return null;
      const nextEdge = outgoingEdges[0]; // Take first edge for now
      return workflowData.nodes.find(node => node.id === nextEdge.target);
    };

    const moveToNextNode = () => {
      const nextNode = getNextNode();
      if (nextNode) {
        callState.currentNodeId = nextNode.id;
        callState.conversationTurns = 0; // Reset turns for new node
        console.log(`Moved to next node: ${nextNode.data?.label || nextNode.type}`);
        return true;
      }
      return false;
    };

    const shouldMoveToNextNode = async (currentNode, conversationHistory, userMessage) => {
      // For non-conversation nodes, move immediately
      if (currentNode.type !== 'conversationNode' && currentNode.type !== 'startNode') {
        return true;
      }

      const nodeObjective = currentNode.data?.prompt || currentNode.data?.objective || '';
      const nodeInstructions = currentNode.data?.instructions || '';

      const evaluationPrompt = `You are evaluating whether a conversation has completed its objective for the current node.

Current Node: ${currentNode.data?.label || currentNode.type}
Node Objective: ${nodeObjective}
${nodeInstructions ? `Instructions: ${nodeInstructions}` : ''}

Recent conversation:
${conversationHistory.slice(-8).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Latest user message: ${userMessage}

IMPORTANT CRITERIA FOR MOVING TO NEXT NODE (Be more patient for phone calls):
- Has this node's objective been THOROUGHLY fulfilled with good conversation depth?
- Has the user had enough time to express their needs and feel heard?
- Has sufficient information been gathered for this node's purpose?
- For "Welcome & Greeting": Has the user been welcomed, rapport built, and basic intent clearly understood?
- For "Inquiry Type Classification": Has the inquiry type been clearly identified with context?
- For "Requirements Gathering": Has detailed requirement information been collected?
- Each node should provide VALUE and build relationship, not just collect data

MOVE TO NEXT NODE only if:
- The current node's objective is COMPLETELY fulfilled
- The user seems satisfied with this phase of the conversation
- You have gathered sufficient detail for this node's purpose
- The conversation has naturally reached a good transition point
- The user appears ready to move to the next logical step

STAY IN CURRENT NODE if:
- The user is still providing relevant information
- More clarification or details would be helpful
- The conversation feels rushed or incomplete
- You haven't built sufficient rapport or understanding
- The user seems to have more to say about this topic

Respond with only "YES" if we should move to the next node, or "NO" if we should continue the conversation in this node.`;

      try {
        const evaluation = await callAzureOpenAI([
          { role: 'system', content: evaluationPrompt }
        ]);
        return evaluation.trim().toUpperCase().includes('YES');
      } catch (error) {
        console.error('Failed to evaluate node completion:', error);
        return false; // Default to staying in node if evaluation fails
      }
    };
    // Build context-aware system prompt
    const currentNode = getCurrentNode();
    let systemPrompt = 'You are a helpful AI assistant.';

    if (workflowData && workflowData.globalPrompt) {
      systemPrompt = workflowData.globalPrompt;
    }

    // Add current node context
    if (currentNode) {
      const nodePrompt = currentNode.data?.prompt || currentNode.data?.greeting || '';
      const nodeInstructions = currentNode.data?.instructions || '';

      systemPrompt += `

Current Node: ${currentNode.data?.label || currentNode.type}
Node Context: ${nodePrompt}
${nodeInstructions ? `Instructions: ${nodeInstructions}` : ''}
${callState.conversationSummary ? `\nConversation Summary So Far: ${callState.conversationSummary}` : ''}

You are in a phone conversation. Be conversational, engaging, and helpful. Focus on achieving the specific objective of THIS node while maintaining a natural dialogue.

IMPORTANT CONVERSATION GUIDELINES:
- Be warm, friendly, and conversational - this is a phone call, not a text chat
- Give detailed, helpful responses that show you're engaged and listening
- Ask follow-up questions to keep the conversation flowing naturally
- Don't rush through the conversation - take time to understand the user's needs
- Be patient and allow for natural pauses in conversation
- Continue the conversation naturally based on what has been discussed
- Remember what the user has already told you (check the conversation summary)
- Don't ask for information the user has already provided
- Focus on the current node's specific objective, but don't be robotic about it
- Engage in natural conversation while working toward the node's goal
- Don't end the conversation abruptly - keep it flowing until the objective is met

RESPONSE STYLE:
- Give responses that are 2-3 sentences long minimum
- Be conversational and engaging, not short or abrupt
- Show genuine interest in helping the user
- Ask thoughtful follow-up questions
- Acknowledge what the user has said before moving forward

Conversation turns in this node: ${callState.conversationTurns}`;
    }

    let aiResponse;

    if (!speechResult) {
      // First interaction - use system prompt to generate greeting
      aiResponse = await callAzureOpenAI(systemPrompt, 'Hello, start the conversation.');

      // Add to conversation history
      callState.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        nodeId: callState.currentNodeId
      });
    } else {
      // User provided input - increment conversation turns and add to history
      callState.conversationTurns++;

      // Add user message to history
      callState.messages.push({
        role: 'user',
        content: speechResult,
        timestamp: new Date(),
        nodeId: callState.currentNodeId
      });

      // Generate AI response with full context
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...callState.messages.slice(-8).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: speechResult }
      ];

      aiResponse = await callAzureOpenAI(conversationMessages);

      // Add AI response to history
      callState.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        nodeId: callState.currentNodeId
      });

      // Check if we should move to next node (after 4+ turns for more natural conversation)
      if (callState.conversationTurns >= 4 && currentNode) {
        const shouldMove = await shouldMoveToNextNode(currentNode, callState.messages, speechResult);
        if (shouldMove) {
          console.log(`Moving from ${currentNode.data?.label || currentNode.type} to next node`);
          moveToNextNode();
        }
      }
    }

    // Clean the AI response for TwiML (remove quotes, special characters)
    const cleanResponse = aiResponse
      .replace(/['"]/g, '')
      .replace(/&/g, 'and')
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      .substring(0, 800); // Increased limit for more natural conversations

    // Generate TwiML with AI response - more patient conversation flow
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${cleanResponse}</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-ai?id=${workflowId}" method="POST">
        <Say voice="alice">I'm listening...</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Let me try again.</Say>
    <Gather input="speech" timeout="8" speechTimeout="2" action="/api/twiml-ai?id=${workflowId}" method="POST">
        <Say voice="alice">Please go ahead, I'm here to help.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! If you need further assistance, please call back. Have a great day!</Say>
    <Hangup/>
</Response>`;

    console.log('Sending AI-powered TwiML response');
    console.log('AI Response:', cleanResponse);
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN AI TWIML ===');
    console.error('Error:', error.message);
    
    // Conversational fallback that encourages engagement
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. I'm here to help you with whatever you need. Please tell me, what can I assist you with today?</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-ai?id=${req.query.id || 'fallback'}" method="POST">
        <Say voice="alice">I'm listening and ready to help you.</Say>
    </Gather>
    <Say voice="alice">I didn't catch that. Let me try once more.</Say>
    <Gather input="speech" timeout="8" speechTimeout="2" action="/api/twiml-ai?id=${req.query.id || 'fallback'}" method="POST">
        <Say voice="alice">Please go ahead, I'm here to assist you.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! Please feel free to call back anytime you need assistance. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
    
    console.log('Sending fallback TwiML due to AI error');
    res.status(200).send(fallbackTwiML);
  }
};

// Call Azure OpenAI API - supports both old format (systemPrompt, userMessage) and new format (messages array)
async function callAzureOpenAI(systemPromptOrMessages, userMessage) {
  try {
    console.log('Calling Azure OpenAI...');

    let messages;

    // Handle both old format and new format
    if (Array.isArray(systemPromptOrMessages)) {
      // New format: array of messages
      messages = systemPromptOrMessages;
    } else {
      // Old format: systemPrompt and userMessage
      messages = [
        {
          role: 'system',
          content: systemPromptOrMessages
        },
        {
          role: 'user',
          content: userMessage
        }
      ];
    }

    const response = await fetch(process.env.AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 200, // Increased for more detailed responses
        temperature: 0.7, // Higher for more natural, conversational responses
        top_p: 0.95, // Higher for more varied, engaging responses
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', response.status, errorText);
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Azure OpenAI response received');
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('Unexpected Azure OpenAI response format:', data);
      throw new Error('Invalid response format from Azure OpenAI');
    }

  } catch (error) {
    console.error('Error calling Azure OpenAI:', error.message);
    // Return a fallback response
    if (userMessage.toLowerCase().includes('hello') || userMessage === 'Hello, start the conversation.') {
      return 'Hello! Welcome to our service. I\'m here to help you with any questions you might have. What can I assist you with today?';
    } else {
      return `Thank you for telling me about ${userMessage}. I understand your request and I'm here to help. What specific information would you like me to provide?`;
    }
  }
}
