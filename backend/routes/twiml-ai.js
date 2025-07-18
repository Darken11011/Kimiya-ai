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

    // Helper functions for workflow management (defined first to avoid hoisting issues)
    const getCurrentNode = () => {
      if (!workflowData || !workflowData.nodes) return null;
      return workflowData.nodes.find(node => node.id === callState.currentNodeId);
    };

    const isEndNode = (node) => {
      if (!node) return false;
      return node.type === 'endNode' ||
             node.type === 'end' ||
             node.data?.isEndNode === true ||
             (node.data?.label && node.data.label.toLowerCase().includes('end'));
    };

    // Function to detect if user wants to end the call
    const detectTerminationIntent = async (userMessage) => {
      if (!userMessage) return false;

      // Quick keyword detection for common termination phrases
      const terminationKeywords = [
        'bye', 'goodbye', 'good bye', 'see you', 'talk later', 'call later',
        'call back', 'that\'s all', 'thanks bye', 'thank you bye', 'gotta go',
        'have to go', 'need to go', 'end call', 'hang up', 'disconnect',
        'that\'s it', 'i\'m done', 'we\'re done', 'all set', 'thank you that\'s all'
      ];

      const messageLower = userMessage.toLowerCase().trim();

      // Check for direct keyword matches
      const hasTerminationKeyword = terminationKeywords.some(keyword =>
        messageLower.includes(keyword)
      );

      if (hasTerminationKeyword) {
        console.log(`✅ Termination keyword detected in: "${userMessage}"`);
        return true;
      }

      console.log(`🔍 No termination keywords found in: "${userMessage}"`);
      console.log(`Checking with AI evaluation...`);

      // Use AI to detect more subtle termination intents
      const terminationPrompt = `You are detecting if a user wants to end a phone call based on their message.

User message: "${userMessage}"

Look for signs that the user wants to:
- End the conversation
- Hang up the call
- Say goodbye
- Indicate they're done/finished
- Thank you and leave
- Call back later
- Not continue the conversation

Common termination phrases include: bye, goodbye, thanks that's all, I'll call back, gotta go, that's it, we're done, etc.

Respond with only "YES" if the user wants to end the call, or "NO" if they want to continue.`;

      try {
        const evaluation = await callAzureOpenAI([
          { role: 'system', content: terminationPrompt }
        ]);
        const result = evaluation.trim().toUpperCase().includes('YES');
        console.log(`AI termination intent detection for "${userMessage}": ${result}`);
        return result;
      } catch (error) {
        console.error('Failed to evaluate termination intent:', error);
        return hasTerminationKeyword; // Fall back to keyword detection
      }
    };

    const generateEndCallTwiML = (endNode) => {
      const endingMessage = endNode?.data?.message ||
                           endNode?.data?.prompt ||
                           endNode?.data?.greeting ||
                           "Thank you for calling! Your request has been completed. Have a wonderful day!";

      const cleanEndingMessage = endingMessage
        .replace(/['"]/g, '')
        .replace(/&/g, 'and')
        .replace(/</g, 'less than')
        .replace(/>/g, 'greater than')
        .substring(0, 800);

      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${cleanEndingMessage}</Say>
    <Pause length="1"/>
    <Say voice="alice">Goodbye!</Say>
    <Hangup/>
</Response>`;
    };

    // Initialize current node if not set
    if (!callState.currentNodeId && workflowData && workflowData.nodes) {
      const startNode = workflowData.nodes.find(node =>
        node.type === 'startNode' || node.type === 'start'
      );
      if (startNode) {
        callState.currentNodeId = startNode.id;
      }
    }

    // Get current node for processing
    let currentNode = getCurrentNode();

    // Check if we're at an end node and should terminate the call
    if (currentNode && isEndNode(currentNode)) {
      console.log(`Reached end node: ${currentNode.data?.label || currentNode.type}. Ending call.`);

      // Clean up conversation state
      delete global.callConversations[callSid];

      // Return end call TwiML
      const endTwiML = generateEndCallTwiML(currentNode);
      console.log('Sending end call TwiML response');
      return res.status(200).send(endTwiML);
    }

    const getNextNode = async (userMessage = '') => {
      if (!workflowData || !workflowData.edges || !callState.currentNodeId) return null;
      const outgoingEdges = workflowData.edges.filter(edge => edge.source === callState.currentNodeId);
      if (outgoingEdges.length === 0) return null;

      // If only one edge, use it directly
      if (outgoingEdges.length === 1) {
        const nextEdge = outgoingEdges[0];
        return workflowData.nodes.find(node => node.id === nextEdge.target);
      }

      // Multiple edges - evaluate conditions
      // First, try to find edges with conditions that are met
      for (const edge of outgoingEdges) {
        // Skip default/fallback edges in first pass
        if (edge.data?.isDefault || edge.data?.isFallback) continue;

        const conditionMet = await evaluateEdgeCondition(edge, userMessage);
        if (conditionMet) {
          console.log(`Taking edge with condition: ${edge.data?.condition || edge.condition}`);
          return workflowData.nodes.find(node => node.id === edge.target);
        }
      }

      // If no conditional edges matched, look for default/fallback edge
      const defaultEdge = outgoingEdges.find(edge => edge.data?.isDefault || edge.data?.isFallback);
      if (defaultEdge) {
        console.log('Taking default/fallback edge');
        return workflowData.nodes.find(node => node.id === defaultEdge.target);
      }

      // If no default edge, take first edge as final fallback
      console.log('Taking first edge as final fallback');
      const fallbackEdge = outgoingEdges[0];
      return workflowData.nodes.find(node => node.id === fallbackEdge.target);
    };

    // Function to evaluate edge conditions
    const evaluateEdgeCondition = async (edge, userMessage) => {
      // If no condition specified, edge is always valid
      if (!edge.data?.condition && !edge.condition) {
        return true;
      }

      const condition = edge.data?.condition || edge.condition || '';
      const conditionType = edge.data?.conditionType || 'ai_evaluation';

      // If condition is empty, edge is valid
      if (!condition.trim()) {
        return true;
      }

      // Handle different condition types
      if (conditionType === 'keyword') {
        // Simple keyword matching
        const keywords = condition.toLowerCase().split(',').map(k => k.trim());
        const userMessageLower = userMessage.toLowerCase();
        return keywords.some(keyword => userMessageLower.includes(keyword));
      }

      if (conditionType === 'exact_match') {
        // Exact phrase matching
        return userMessage.toLowerCase().includes(condition.toLowerCase());
      }

      // Default: AI evaluation for complex conditions
      const evaluationPrompt = `You are evaluating whether a workflow edge condition is met based on the user's response and conversation context.

Edge Condition: "${condition}"
User's Latest Message: "${userMessage}"
Conversation History: ${callState.messages.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Based on the user's response and conversation context, does this condition evaluate to true?

Examples of conditions:
- "user wants to buy" - true if user expressed buying intent
- "user wants to sell" - true if user expressed selling intent
- "user provided contact info" - true if user gave phone/email
- "user is satisfied" - true if user seems satisfied with service
- "user needs more help" - true if user needs additional assistance

Respond with only "YES" if the condition is met, or "NO" if it is not met.`;

      try {
        const evaluation = await callAzureOpenAI([
          { role: 'system', content: evaluationPrompt }
        ]);
        const result = evaluation.trim().toUpperCase().includes('YES');
        console.log(`Edge condition "${condition}" evaluated to: ${result}`);
        return result;
      } catch (error) {
        console.error('Failed to evaluate edge condition:', error);
        return true; // Default to true if evaluation fails
      }
    };

    const moveToNextNode = async (userMessage = '') => {
      const nextNode = await getNextNode(userMessage);
      if (nextNode) {
        console.log(`Moving from ${currentNode?.data?.label || currentNode?.type} to ${nextNode.data?.label || nextNode.type}`);
        callState.currentNodeId = nextNode.id;
        callState.conversationTurns = 0; // Reset turns for new node

        // Update currentNode reference for end node check
        currentNode = nextNode;

        return true;
      }
      return false;
    };

    const shouldMoveToNextNode = async (currentNode, conversationHistory, userMessage) => {
      // For non-conversation nodes, move immediately (unless it's an end node)
      if (currentNode.type !== 'conversationNode' && currentNode.type !== 'startNode' && !isEndNode(currentNode)) {
        return true;
      }

      // Never move from end nodes
      if (isEndNode(currentNode)) {
        return false;
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
    // Build context-aware system prompt (reuse currentNode from above)
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
- Don't rush through the conversation - take time to understand the user's needs but dont make if long and frustrating
- Be patient and allow for natural pauses in conversation
- Continue the conversation naturally based on what has been discussed
- Remember what the user has already told you (check the conversation summary)
- Don't ask for information the user has already provided
- Focus on the current node's specific objective, but don't be robotic about it
- Engage in natural conversation while working toward the node's goal
- Don't end the conversation abruptly - keep it flowing until the objective is met
- And make sure to end the call with a friendly goodbye after a conclusion is reached or upon user request

RESPONSE STYLE:
- Give responses that are 2-3 sentences long minimum
- Be conversational and engaging, not short or abrupt and not long enough to be frustrating
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

      // Check for termination intent BEFORE generating AI response
      const wantsToEndCall = await detectTerminationIntent(speechResult);

      if (wantsToEndCall) {
        console.log(`User wants to end call. Message: "${speechResult}"`);

        // Try to find an end node in the workflow first
        const endNode = workflowData?.nodes?.find(node => isEndNode(node));

        if (endNode) {
          console.log(`Found end node: ${endNode.data?.label || endNode.type}. Using it for termination.`);

          // Clean up conversation state
          delete global.callConversations[callSid];

          // Use the end node's message
          const endTwiML = generateEndCallTwiML(endNode);
          console.log('Sending end node TwiML response due to termination intent');
          return res.status(200).send(endTwiML);
        } else {
          // No end node found, use generic goodbye
          console.log('No end node found, using generic goodbye');

          // Clean up conversation state
          delete global.callConversations[callSid];

          // Generate a polite goodbye TwiML
          const goodbyeTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you so much for calling! It was great talking with you. Have a wonderful day!</Say>
    <Pause length="1"/>
    <Say voice="alice">Goodbye!</Say>
    <Hangup/>
</Response>`;

          console.log('Sending goodbye TwiML response due to termination intent');
          return res.status(200).send(goodbyeTwiML);
        }
      }

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
          const moved = await moveToNextNode(speechResult);

          // If we moved to an end node, end the call immediately
          if (moved && currentNode && isEndNode(currentNode)) {
            console.log(`Moved to end node: ${currentNode.data?.label || currentNode.type}. Ending call.`);

            // Clean up conversation state
            delete global.callConversations[callSid];

            // Return end call TwiML
            const endTwiML = generateEndCallTwiML(currentNode);
            console.log('Sending end call TwiML response after node transition');
            return res.status(200).send(endTwiML);
          }

          // If we couldn't move to next node (workflow completed), end the call
          if (!moved) {
            console.log('No more nodes in workflow. Ending call.');

            // Clean up conversation state
            delete global.callConversations[callSid];

            // Generate completion message
            const completionTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling! We have completed your request. If you need any further assistance, please don't hesitate to call back.</Say>
    <Pause length="1"/>
    <Say voice="alice">Have a wonderful day! Goodbye!</Say>
    <Hangup/>
</Response>`;
            console.log('Sending workflow completion TwiML response');
            return res.status(200).send(completionTwiML);
          }
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
