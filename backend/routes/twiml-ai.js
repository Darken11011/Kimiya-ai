const fetch = require('node-fetch');

// AI-powered TwiML endpoint using Azure OpenAI
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
    const confidence = req.body.Confidence || 0;
    const retryCount = parseInt(req.query.retry || '0');

    console.log('Processing AI call:', {
      workflowId,
      callSid,
      from,
      hasUserInput: !!speechResult,
      speechLength: speechResult.length,
      confidence: confidence,
      retryCount: retryCount
    });

    // Get workflow data for context
    const workflowData = global.workflowData && global.workflowData[workflowId];
    let systemPrompt = 'You are a helpful AI assistant on a phone call. Keep responses brief and conversational for phone calls. Always end with a question to keep the conversation going.';
    
    if (workflowData) {
      if (workflowData.globalPrompt) {
        systemPrompt = workflowData.globalPrompt + ' Keep responses brief for phone calls.';
      }
      
      // Add workflow context
      const startNode = workflowData.nodes.find(node => 
        node.type === 'startNode' || node.type === 'start'
      );
      if (startNode && startNode.data && startNode.data.prompt) {
        systemPrompt += ` Start the conversation with: "${startNode.data.prompt}"`;
      }
    }

    let aiResponse;

    // Check if we need to handle speech recognition issues
    if (!speechResult || speechResult.trim().length < 2) {
      if (retryCount === 0) {
        // First interaction or first retry - use system prompt to generate greeting
        aiResponse = await callAzureOpenAI(systemPrompt, 'Hello, start the conversation.');
      } else if (retryCount < 3) {
        // Retry with encouragement
        aiResponse = "I'm having a bit of trouble hearing you clearly. This might be due to background noise or connection issues. Could you please speak a bit louder and more clearly? I'm here to help you.";
      } else {
        // Too many retries - offer alternative
        aiResponse = "I'm having persistent difficulty hearing you clearly. This might be due to a poor connection. Would you like to try calling back, or I can provide you with our main number for better assistance?";
      }
    } else if (confidence && parseFloat(confidence) < 0.5) {
      // Low confidence in speech recognition
      aiResponse = `I think I heard you say "${speechResult}" but I'm not completely sure. Could you please repeat that or rephrase it? I want to make sure I understand you correctly.`;
    } else {
      // Clear speech detected - generate AI response
      try {
        aiResponse = await callAzureOpenAI(systemPrompt, speechResult);
      } catch (aiError) {
        console.error('Azure OpenAI error:', aiError.message);
        // Fallback to simple response if AI fails
        aiResponse = `Thank you for telling me about ${speechResult}. I understand your request and I'm here to help you with that. What specific information would you like me to provide?`;
      }
    }

    // Clean the AI response for TwiML (remove quotes, special characters)
    const cleanResponse = aiResponse
      .replace(/['"]/g, '')
      .replace(/&/g, 'and')
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      .substring(0, 500); // Limit length for phone calls

    // Generate TwiML with AI response and reliable speech recognition
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${cleanResponse}</Say>
    <Gather input="speech" timeout="8" speechTimeout="3" action="/api/twiml-ai?id=${workflowId}&retry=${retryCount + 1}" method="POST">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
    <Hangup/>
</Response>`;

    console.log('Sending AI-powered TwiML response');
    console.log('AI Response:', cleanResponse);
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN AI TWIML ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request details:', {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers
    });

    // Ultra-simple fallback TwiML that should always work
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! I'm your assistant. How can I help you today?</Say>
    <Gather input="speech" timeout="5" action="/api/twiml-ai?id=fallback" method="POST">
        <Say voice="alice">Please tell me what you need.</Say>
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;

    console.log('Sending ultra-simple fallback TwiML due to error');
    res.status(200).send(fallbackTwiML);
  }
};

// Call Azure OpenAI API
async function callAzureOpenAI(systemPrompt, userMessage) {
  try {
    console.log('Calling Azure OpenAI...');
    
    const response = await fetch(process.env.AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
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
