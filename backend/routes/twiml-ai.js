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

    console.log('Processing AI call:', {
      workflowId,
      callSid,
      from,
      hasUserInput: !!speechResult
    });

    // Get workflow data for context
    const workflowData = global.workflowData && global.workflowData[workflowId];
    let systemPrompt = `You are an Universal assistant as per assigned by global prompt and workflow. You are designed to provide efficient customer support, assist with marketing efforts, and help generate quality leads. Keep your tone friendly, professional, and empathetic, tailoring your responses to the context of each conversation. Be concise and conversational.

                        Core Objectives:

                        Customer Support: 
                        - Address customer inquiries, troubleshoot issues, and provide clear solutions.
                        - Gather information to resolve problems, and offer follow-up support to ensure satisfaction.

                        Marketing: 
                        - Understand customer interests to suggest relevant products/services.
                        - Present offers and promotions in a non-intrusive, engaging way, while maintaining brand trust.

                        Lead Generation: 
                        - Identify potential leads, ask qualifying questions, and guide them toward becoming qualified prospects.
                        - Encourage further engagement, such as scheduling calls or signing up for newsletters.

                        General Guidelines:
                        - Use simple, clear language. Avoid jargon unless necessary.
                        - Respect the customer's time and privacy, asking for permission before gathering personal info or sending marketing materials.
                        - Respond empathetically to frustrations and inquiries, focusing on resolution.
                        - In marketing, add value without being pushy. In lead gen, maintain professionalism with a sense of urgency.

                        Tone and Language:
                        - Friendly, engaging, and supportive.
                        - Confident, but not aggressive.
                        - Show empathy, especially in handling concerns or complaints.`;

    
    if (workflowData) {
      if (workflowData.globalPrompt) {
        systemPrompt = workflowData.globalPrompt + ' Help and guide the conversation naturally based on the user\'s needs.';
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
    
    if (!speechResult) {
      // First interaction - use system prompt to generate greeting
      aiResponse = await callAzureOpenAI(systemPrompt, 'Hello, start the conversation.');
    } else {
      // User provided input - generate AI response
      const conversationPrompt = `${systemPrompt}\n\nUser said: "${speechResult}"\n\nRespond helpfully and ask a follow-up question as required according to the workflow.`;
      aiResponse = await callAzureOpenAI(conversationPrompt, speechResult);
    }

    // Clean the AI response for TwiML (remove quotes, special characters)
    const cleanResponse = aiResponse
      .replace(/['"]/g, '')
      .replace(/&/g, 'and')
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      .substring(0, 500); // Limit length for phone calls

    // Generate TwiML with AI response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${cleanResponse}</Say>
    <Gather input="speech" timeout="5" speechTimeout="1" action="/api/twiml-ai?id=${workflowId}" method="POST">
    </Gather>
    <Say voice="alice">Thank you for calling! Have a great day!</Say>
    <Hangup/>
</Response>`;

    console.log('Sending AI-powered TwiML response');
    console.log('AI Response:', cleanResponse);
    res.status(200).send(twiml);

  } catch (error) {
    console.error('=== ERROR IN AI TWIML ===');
    console.error('Error:', error.message);
    
    // Simple fallback that always works
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. I'm here to help you. How can I assist you today?</Say>
    <Gather input="speech" timeout="5" speechTimeout="1" action="/api/twiml-ai?id=${req.query.id || 'fallback'}" method="POST">
    </Gather>
    <Say voice="alice">Thank you for calling!</Say>
    <Hangup/>
</Response>`;
    
    console.log('Sending fallback TwiML due to AI error');
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
        max_tokens: 100, // Reduced for faster responses
        temperature: 0.5, // Lower for more consistent, faster responses
        top_p: 0.9, // Slightly reduced for faster processing
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
