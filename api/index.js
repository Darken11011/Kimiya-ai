const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://kimiya-ai.vercel.app',
        'https://kimiya-ai-darkens-projects-f907d385.vercel.app',
        'https://kimiya-ai-git-main-darkens-projects-f907d385.vercel.app',
        'https://kimiya-35a7vcw0g-darkens-projects-f907d385.vercel.app'
      ]
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory storage for call states and workflows (in production, use a database)
const callStates = new Map(); // CallSid -> { currentNodeId, conversationHistory, variables }
const workflows = new Map(); // WorkflowId -> { nodes, edges, config }

// Utility function to normalize phone numbers
function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's already in E.164 format, validate and return
  if (cleaned.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Remove any leading + if present
  cleaned = cleaned.replace(/^\+/, '');
  
  // If it's empty after cleaning, return null
  if (!cleaned) {
    return null;
  }
  
  // Handle different number formats
  if (cleaned.length === 10) {
    // Assume US number if 10 digits
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number with country code
    return `+${cleaned}`;
  } else if (cleaned.length >= 7 && cleaned.length <= 15) {
    // International number without country code
    return `+${cleaned}`;
  }
  
  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Call Flow Weaver API'
  });
});

// Upload workflow for call processing
app.post('/api/upload-workflow', (req, res) => {
  try {
    const { workflowId, nodes, edges, config, globalPrompt } = req.body;

    if (!workflowId || !nodes || !edges) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflowId, nodes, edges'
      });
    }

    // Store workflow data
    workflows.set(workflowId, {
      nodes,
      edges,
      config,
      globalPrompt,
      uploadedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Workflow ${workflowId} uploaded successfully`,
      nodeCount: nodes.length,
      edgeCount: edges.length
    });

  } catch (error) {
    console.error('Error uploading workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload workflow'
    });
  }
});

// Generate dynamic TwiML for a specific workflow
app.get('/api/twiml/workflow/:workflowId', (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = workflows.get(workflowId);

    if (!workflow) {
      // Fallback TwiML if workflow not found
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! I couldn't find your workflow configuration. Please check your setup and try again.</Say>
  <Hangup/>
</Response>`;
      res.type('text/xml');
      return res.send(twiml);
    }

    const { nodes, globalPrompt } = workflow;
    const startNode = nodes.find(node => node.type === 'startNode');
    const startMessage = startNode?.data?.prompt || startNode?.data?.description || globalPrompt ||
                       "Hello! Welcome to your Call Flow Weaver workflow. I'm ready to help you.";

    // Generate dynamic TwiML based on workflow
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${startMessage.replace(/[<>&"']/g, '').substring(0, 500)}</Say>
  <Gather input="speech" action="${req.protocol}://${req.get('host')}/api/twiml/process/${workflowId}" method="POST" speechTimeout="3" timeout="10">
    <Say voice="alice">I'm listening for your response...</Say>
  </Gather>
  <Say voice="alice">I didn't hear anything. Thank you for calling!</Say>
  <Hangup/>
</Response>`;

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('Error generating workflow TwiML:', error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, there was an error processing your call. Please try again later.</Say>
  <Hangup/>
</Response>`;
    res.type('text/xml');
    res.send(errorTwiml);
  }
});

// Make a call endpoint
app.post('/api/make-call', async (req, res) => {
  try {
    console.log('Received make-call request:', req.body);
    const { to, from, twimlUrl, record, timeout, workflowId, nodes, edges, config, globalPrompt } = req.body;

    // Validate required fields
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) is required'
      });
    }

    // Normalize phone number
    const normalizedTo = normalizePhoneNumber(to);
    if (!normalizedTo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Use provided from number or default
    const fromNumber = from || process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      return res.status(500).json({
        success: false,
        error: 'No Twilio phone number configured'
      });
    }

    // Default TwiML URL if not provided
    // For local development with workflow data, we need to use a public tunnel or ngrok

    let defaultTwiML;
    if (twimlUrl) {
      defaultTwiML = twimlUrl;
    } else {
      // Check if we're using ngrok or have a public URL
      const host = req.get('host');
      const isNgrok = host.includes('ngrok.io') || host.includes('ngrok-free.app');
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

      if (workflowId && nodes && edges) {
        if (isNgrok || !isLocalhost) {
          // Use our workflow-specific endpoint for ngrok or production
          defaultTwiML = `${req.protocol}://${host}/api/twiml/workflow/${workflowId}`;
          console.log(`Using workflow TwiML endpoint: ${defaultTwiML}`);
        } else {
          // Pure localhost - need ngrok or tunneling service
          console.log('⚠️  WARNING: Using localhost without ngrok. Calls will use demo TwiML.');
          console.log('📋 To enable workflow-based calls:');
          console.log('   1. Install ngrok: https://ngrok.com');
          console.log('   2. Run: ngrok http 3000');
          console.log('   3. Update your frontend to use the ngrok URL');
          console.log('   See NGROK_SETUP.md for detailed instructions');

          defaultTwiML = 'https://demo.twilio.com/docs/voice.xml';
        }
      } else {
        // No workflow data - use default
        if (isNgrok || !isLocalhost) {
          defaultTwiML = `${req.protocol}://${host}/api/twiml/default`;
        } else {
          defaultTwiML = 'https://demo.twilio.com/docs/voice.xml';
        }
      }
    }

    // Store workflow data if provided
    if (workflowId && nodes && edges) {
      workflows.set(workflowId, {
        nodes,
        edges,
        config,
        globalPrompt,
        uploadedAt: new Date().toISOString()
      });
      console.log(`Stored workflow ${workflowId} with ${nodes.length} nodes`);
    }

    // Make the call
    // Twilio timeout must be between 5 and 600 seconds
    const callTimeout = Math.min(Math.max(timeout || 30, 5), 600);

    const call = await twilioClient.calls.create({
      to: normalizedTo,
      from: fromNumber,
      url: defaultTwiML,
      method: 'POST',
      record: record !== undefined ? record : true,
      timeout: callTimeout,
      statusCallback: `${req.protocol}://${req.get('host')}/api/call-status`,
      statusCallbackMethod: 'POST'
    });

    // Initialize call state if workflow is provided
    if (workflowId && nodes && edges) {
      const startNode = nodes.find(node => node.type === 'startNode');
      callStates.set(call.sid, {
        workflowId,
        currentNodeId: startNode?.id || null,
        conversationHistory: [],
        variables: new Map(),
        startedAt: new Date().toISOString()
      });
      console.log(`Initialized call state for ${call.sid} with start node ${startNode?.id}`);
    }

    res.json({
      success: true,
      callSid: call.sid,
      message: `Call initiated successfully to ${normalizedTo}`,
      status: call.status
    });

  } catch (error) {
    console.error('Error making call:', error);

    // Handle specific Twilio errors
    if (error.code === 21208) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeout parameter. Timeout must be between 5 and 600 seconds.'
      });
    }

    if (error.code === 21211) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Please check the number and try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call'
    });
  }
});

// Get call status endpoint
app.get('/api/call-status/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;

    const call = await twilioClient.calls(callSid).fetch();

    res.json({
      success: true,
      call: {
        sid: call.sid,
        status: call.status,
        direction: call.direction,
        from: call.from,
        to: call.to,
        duration: call.duration,
        price: call.price,
        priceUnit: call.priceUnit,
        startTime: call.startTime,
        endTime: call.endTime
      }
    });

  } catch (error) {
    console.error('Error getting call status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get call status'
    });
  }
});

// End call endpoint
app.post('/api/end-call/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;

    const call = await twilioClient.calls(callSid).update({
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Call ended successfully',
      status: call.status
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end call'
    });
  }
});

// Dynamic TwiML endpoint for workflow-based calls
app.post('/api/twiml/workflow', (req, res) => {
  const { CallSid, From, To, SpeechResult, Digits } = req.body;

  console.log('TwiML Request:', { CallSid, From, To, SpeechResult, Digits });

  // For now, start with a simple workflow-aware response
  // In a full implementation, this would:
  // 1. Load the workflow configuration
  // 2. Determine current node based on call state
  // 3. Process user input through the workflow
  // 4. Generate appropriate TwiML response

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Welcome to your Call Flow Weaver workflow. I'm ready to help you. Please tell me what you need assistance with.</Say>
  <Gather input="speech" action="${req.protocol}://${req.get('host')}/api/twiml/process" method="POST" speechTimeout="3" timeout="10">
    <Say voice="alice">I'm listening...</Say>
  </Gather>
  <Say voice="alice">I didn't hear anything. Let me try again.</Say>
  <Redirect>${req.protocol}://${req.get('host')}/api/twiml/workflow</Redirect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// Process user input and continue workflow
app.post('/api/twiml/process', (req, res) => {
  const { CallSid, From, To, SpeechResult, Digits, Confidence } = req.body;

  console.log('Processing user input:', { CallSid, SpeechResult, Confidence });

  // Here we would:
  // 1. Get the current workflow state for this call
  // 2. Process the user input through the current node
  // 3. Determine the next node based on conditions
  // 4. Generate appropriate TwiML response

  let responseText = "I heard you say: " + (SpeechResult || "nothing clear");

  // Simple response logic (to be replaced with actual workflow processing)
  if (SpeechResult) {
    const input = SpeechResult.toLowerCase();
    if (input.includes('help') || input.includes('support')) {
      responseText = "I understand you need help. Let me connect you with our support team.";
    } else if (input.includes('information') || input.includes('info')) {
      responseText = "I can provide you with information. What specific details would you like to know?";
    } else if (input.includes('goodbye') || input.includes('bye') || input.includes('end')) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Have a great day! Goodbye.</Say>
  <Hangup/>
</Response>`;
      res.type('text/xml');
      res.send(twiml);
      return;
    } else {
      responseText = `You said: ${SpeechResult}. How can I help you with that?`;
    }
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${responseText}</Say>
  <Gather input="speech" action="${req.protocol}://${req.get('host')}/api/twiml/process" method="POST" speechTimeout="3" timeout="10">
    <Say voice="alice">What else can I help you with?</Say>
  </Gather>
  <Say voice="alice">Thank you for calling. Goodbye!</Say>
  <Hangup/>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// Default TwiML endpoint (fallback)
app.post('/api/twiml/default', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>${req.protocol}://${req.get('host')}/api/twiml/workflow</Redirect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// Call status webhook endpoint
app.post('/api/call-status', (req, res) => {
  const { CallSid, CallStatus, From, To, Duration } = req.body;
  
  console.log('Call Status Update:', {
    callSid: CallSid,
    status: CallStatus,
    from: From,
    to: To,
    duration: Duration
  });

  // Here you could store call status updates in a database
  // or send real-time updates to your frontend via WebSocket

  res.status(200).send('OK');
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server (for local development)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Call Flow Weaver API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}

// Export for Vercel
module.exports = app;
