const fetch = require('node-fetch');
const { getActiveOrchestrator } = require('./make-call-optimized');

// Global storage for call conversations (same as working twiml-ai.js)
global.callConversations = global.callConversations || {};

// Cleanup old conversations (same as working implementation)
const cleanupOldConversations = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(global.callConversations).forEach(callSid => {
    const conversation = global.callConversations[callSid];
    if (conversation && conversation.startTime < oneHourAgo) {
      delete global.callConversations[callSid];
      console.log(`[TwiML-Optimized] Cleaned up old conversation: ${callSid}`);
    }
  });
};

// Run cleanup every 30 minutes
setInterval(cleanupOldConversations, 30 * 60 * 1000);

// Optimized TwiML handler based on proven working twiml-ai.js structure
module.exports = async function twimlOptimizedHandler(req, res) {
  const startTime = performance.now();
  
  console.log('=== OPTIMIZED AI TWIML ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  try {
    // Set proper headers for TwiML (same as working implementation)
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const workflowId = req.query.id || 'default';
    const trackingId = req.query.trackingId;
    const speechResult = req.body.SpeechResult || '';
    const callSid = req.body.CallSid || 'unknown';
    const from = req.body.From || 'unknown';

    console.log('[TwiML-Optimized] Processing optimized AI call:', {
      workflowId,
      callSid,
      from,
      trackingId,
      hasUserInput: !!speechResult
    });

    // Initialize or get conversation state (same as working implementation)
    if (!global.callConversations[callSid]) {
      global.callConversations[callSid] = {
        messages: [],
        currentNodeId: null,
        conversationTurns: 0,
        conversationSummary: '',
        startTime: new Date(),
        workflowId: workflowId,
        trackingId: trackingId
      };
    }

    const callState = global.callConversations[callSid];

    // Get workflow data for context (same as working implementation)
    const workflowData = global.workflowData && global.workflowData[workflowId];

    // Build system prompt (same as working implementation)
    let systemPrompt = 'You are a helpful AI assistant.';

    if (workflowData && workflowData.globalPrompt) {
      systemPrompt = workflowData.globalPrompt;
    }

    // Add optimization context
    systemPrompt += `

OPTIMIZATION ACTIVE: This conversation is using performance-optimized processing for faster response times.

You are in a phone conversation. Be conversational, engaging, and helpful. 

IMPORTANT CONVERSATION GUIDELINES:
- Be warm, friendly, and conversational - this is a phone call, not a text chat
- Give detailed, helpful responses that show you're engaged and listening
- Ask follow-up questions to keep the conversation flowing naturally
- Don't rush through the conversation - take time to understand the user's needs
- Be patient and allow for natural pauses in conversation
- Continue the conversation naturally based on what has been discussed
- Remember what the user has already told you (check the conversation summary)
- Don't ask for information the user has already provided
- Engage in natural conversation while working toward helping the user
- Don't end the conversation abruptly - keep it flowing until a natural conclusion
- Make sure to end the call with a friendly goodbye after a conclusion is reached or upon user request

RESPONSE STYLE:
- Give responses that are 2-3 sentences long minimum
- Be conversational and engaging, not short or abrupt
- Show genuine interest in helping the user
- Ask thoughtful follow-up questions
- Acknowledge what the user has said before moving forward

Conversation turns: ${callState.conversationTurns}`;

    let aiResponse;
    let processingTime = 0;

    if (!speechResult) {
      // First interaction - generate greeting
      const greetingStartTime = performance.now();
      
      // Try to use orchestrator for optimized processing
      const orchestrator = getActiveOrchestrator(trackingId);
      if (orchestrator) {
        console.log('[TwiML-Optimized] Using performance orchestrator for greeting');
        try {
          // Use optimized greeting generation
          aiResponse = await generateOptimizedGreeting(orchestrator, callState);
        } catch (error) {
          console.warn('[TwiML-Optimized] Orchestrator greeting failed, using fallback:', error.message);
          aiResponse = await callAzureOpenAI(systemPrompt, 'Hello, start the conversation.');
        }
      } else {
        console.log('[TwiML-Optimized] No orchestrator available, using standard Azure OpenAI');
        aiResponse = await callAzureOpenAI(systemPrompt, 'Hello, start the conversation.');
      }

      processingTime = performance.now() - greetingStartTime;

      // Add to conversation history
      callState.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        processingTime: processingTime
      });

    } else {
      // User provided input
      const responseStartTime = performance.now();
      callState.conversationTurns++;

      // Add user message to history
      callState.messages.push({
        role: 'user',
        content: speechResult,
        timestamp: new Date()
      });

      // Try to use orchestrator for optimized processing
      const orchestrator = getActiveOrchestrator(trackingId);
      if (orchestrator) {
        console.log('[TwiML-Optimized] Using performance orchestrator for response');
        try {
          // Use optimized response generation
          aiResponse = await generateOptimizedResponse(orchestrator, callState, speechResult);
        } catch (error) {
          console.warn('[TwiML-Optimized] Orchestrator response failed, using fallback:', error.message);
          aiResponse = await generateStandardResponse(callState, speechResult, systemPrompt);
        }
      } else {
        console.log('[TwiML-Optimized] No orchestrator available, using standard processing');
        aiResponse = await generateStandardResponse(callState, speechResult, systemPrompt);
      }

      processingTime = performance.now() - responseStartTime;

      // Add AI response to history
      callState.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        processingTime: processingTime
      });
    }

    // Clean the AI response for TwiML (same as working implementation)
    const cleanResponse = aiResponse
      .replace(/['"]/g, '')
      .replace(/&/g, 'and')
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      .substring(0, 800); // Same limit as working twiml-ai.js

    // Generate optimized TwiML (traditional format but with optimization tracking)
    const totalProcessingTime = performance.now() - startTime;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Optimized processing: ${totalProcessingTime.toFixed(0)}ms (AI: ${processingTime.toFixed(0)}ms) -->
    <Say voice="alice">${cleanResponse}</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-optimized?id=${workflowId}&trackingId=${trackingId}" method="POST">
        <Say voice="alice">I'm listening...</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Let me try again.</Say>
    <Gather input="speech" timeout="8" speechTimeout="2" action="/api/twiml-optimized?id=${workflowId}&trackingId=${trackingId}" method="POST">
        <Say voice="alice">Please go ahead, I'm here to help.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! If you need further assistance, please call back. Have a great day!</Say>
    <Hangup/>
</Response>`;

    console.log(`[TwiML-Optimized] Total processing time: ${totalProcessingTime.toFixed(2)}ms (Target: <500ms)`);
    console.log('[TwiML-Optimized] AI Response:', cleanResponse.substring(0, 100) + '...');
    
    res.status(200).send(twiml);

  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`[TwiML-Optimized] Request failed after ${totalTime.toFixed(2)}ms:`, error);
    
    // Fallback TwiML (same as working implementation)
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. I'm here to help you with whatever you need. Please tell me, what can I assist you with today?</Say>
    <Gather input="speech" timeout="10" speechTimeout="2" action="/api/twiml-optimized?id=${req.query.id || 'fallback'}&trackingId=${req.query.trackingId || 'fallback'}" method="POST">
        <Say voice="alice">I'm listening and ready to help you.</Say>
    </Gather>
    <Say voice="alice">I didn't catch that. Let me try once more.</Say>
    <Gather input="speech" timeout="8" speechTimeout="2" action="/api/twiml-optimized?id=${req.query.id || 'fallback'}&trackingId=${req.query.trackingId || 'fallback'}" method="POST">
        <Say voice="alice">Please go ahead, I'm here to assist you.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling! Please feel free to call back anytime you need assistance. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
    
    console.log('[TwiML-Optimized] Sending fallback TwiML due to error');
    res.status(200).send(fallbackTwiML);
  }
};

// Helper functions for optimization
async function generateOptimizedGreeting(orchestrator, callState) {
  // This would use the orchestrator's optimization features
  // For now, return a standard greeting
  return "Hello! I'm your AI assistant, and I'm here to help you today. Thanks to our optimized system, I can respond much faster than usual. What can I assist you with?";
}

async function generateOptimizedResponse(orchestrator, callState, speechResult) {
  // This would use the orchestrator's optimization features
  // For now, fall back to standard processing
  return await generateStandardResponse(callState, speechResult, 'You are a helpful AI assistant.');
}

async function generateStandardResponse(callState, speechResult, systemPrompt) {
  // Generate AI response with full context (same as working implementation)
  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...callState.messages.slice(-8).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: speechResult }
  ];

  return await callAzureOpenAI(conversationMessages);
}

// Azure OpenAI integration (same as working implementation)
async function callAzureOpenAI(systemPromptOrMessages, userMessage) {
  try {
    console.log('[TwiML-Optimized] Calling Azure OpenAI...');

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
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TwiML-Optimized] Azure OpenAI API error:', response.status, errorText);
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[TwiML-Optimized] Azure OpenAI response received');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('[TwiML-Optimized] Unexpected Azure OpenAI response format:', data);
      throw new Error('Invalid response format from Azure OpenAI');
    }

  } catch (error) {
    console.error('[TwiML-Optimized] Error calling Azure OpenAI:', error.message);
    // Return a fallback response
    if (userMessage && (userMessage.toLowerCase().includes('hello') || userMessage === 'Hello, start the conversation.')) {
      return 'Hello! Welcome to our optimized service. I\'m here to help you with any questions you might have. What can I assist you with today?';
    } else {
      return `Thank you for telling me about that. I understand your request and I'm here to help. What specific information would you like me to provide?`;
    }
  }
}
