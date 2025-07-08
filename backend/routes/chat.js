const fetch = require('node-fetch');

// Backend chat endpoint for playground conversations
module.exports = async function chatHandler(req, res) {
  console.log('=== CHAT API ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', req.body);

  try {
    const { messages, workflowId, globalPrompt, currentNodeId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    console.log('Processing chat request:', {
      workflowId,
      messageCount: messages.length,
      hasGlobalPrompt: !!globalPrompt,
      currentNodeId
    });

    // Get workflow data for context if available
    const workflowData = global.workflowData && global.workflowData[workflowId];
    let systemPrompt = globalPrompt || 'You are a helpful AI assistant in a chat conversation.';
    
    if (workflowData) {
      console.log('Found workflow data for chat context');
      
      if (workflowData.globalPrompt) {
        systemPrompt = workflowData.globalPrompt;
      }
      
      // Add current node context if available
      if (currentNodeId) {
        const currentNode = workflowData.nodes.find(node => node.id === currentNodeId);
        if (currentNode && currentNode.data) {
          if (currentNode.data.prompt) {
            systemPrompt += `\n\nCurrent node context: ${currentNode.data.prompt}`;
          }
          if (currentNode.data.instructions) {
            systemPrompt += `\nInstructions: ${currentNode.data.instructions}`;
          }
        }
      }
    }

    // Prepare messages for Azure OpenAI
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log('Calling Azure OpenAI for chat...');
    const aiResponse = await callAzureOpenAI(apiMessages);

    console.log('Chat AI response generated successfully');
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== ERROR IN CHAT API ===');
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response',
      details: error.message
    });
  }
};

// Call Azure OpenAI API (same as twiml-ai.js but for chat)
async function callAzureOpenAI(messages) {
  try {
    console.log('Calling Azure OpenAI for chat...');
    
    const response = await fetch(process.env.AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
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
    console.log('Azure OpenAI chat response received');
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('Unexpected Azure OpenAI response format:', data);
      throw new Error('Invalid response format from Azure OpenAI');
    }

  } catch (error) {
    console.error('Error calling Azure OpenAI for chat:', error.message);
    throw error;
  }
}
