// Test endpoint to verify workflow processing
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Test workflow endpoint called:', {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers
    });

    // Test environment variables
    const envTest = {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      twilioSidLength: process.env.TWILIO_ACCOUNT_SID?.length || 0,
      twilioTokenLength: process.env.TWILIO_AUTH_TOKEN?.length || 0,
      twilioPhone: process.env.TWILIO_PHONE_NUMBER || 'not set'
    };

    // Test workflow data parsing
    let workflowTest = null;
    const workflowData = req.query.wd || req.body.wd;
    if (workflowData) {
      try {
        const compact = JSON.parse(decodeURIComponent(workflowData));
        workflowTest = {
          hasId: !!compact.id,
          hasNodes: !!compact.ns && compact.ns.length > 0,
          hasEdges: !!compact.es && compact.es.length > 0,
          hasGlobalPrompt: !!compact.gp,
          nodeCount: compact.ns?.length || 0,
          edgeCount: compact.es?.length || 0
        };
      } catch (e) {
        workflowTest = { error: e.message };
      }
    }

    // Test Azure OpenAI config
    const azureTest = {
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hardcodedApiKey: 'f6d564a83af3498c9beb46d7d3e3da96',
      hardcodedEndpoint: 'https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview'
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envTest,
      workflow: workflowTest,
      azure: azureTest,
      requestInfo: {
        method: req.method,
        hasQuery: Object.keys(req.query).length > 0,
        hasBody: Object.keys(req.body || {}).length > 0,
        queryKeys: Object.keys(req.query),
        bodyKeys: Object.keys(req.body || {})
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
