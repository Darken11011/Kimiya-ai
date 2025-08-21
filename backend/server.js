const express = require('express');
const cors = require('cors');

// Only load .env file in development mode
// In production (Render), use environment variables directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  console.log('🔧 Development mode: Loading .env file');
} else {
  console.log('🚀 Production mode: Using Render environment variables');
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration to allow Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://kimiya-ai.vercel.app',
    'https://kimiyi-ai.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Call Flow Weaver Backend',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      port: process.env.PORT || 'not set',
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasAzureKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasAzureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasTwilioConfig: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      hasAzureConfig: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  // Check if critical environment variables are missing
  const missingVars = [];
  if (!process.env.TWILIO_ACCOUNT_SID) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!process.env.TWILIO_AUTH_TOKEN) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!process.env.TWILIO_PHONE_NUMBER) missingVars.push('TWILIO_PHONE_NUMBER');

  if (missingVars.length > 0) {
    healthStatus.status = 'degraded';
    healthStatus.warnings = [`Missing environment variables: ${missingVars.join(', ')}`];
  }

  res.json(healthStatus);
});

// Quick ping endpoint for fast wake-up
app.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: Date.now() });
});

// Import route handlers
const makeCallHandler = require('./routes/make-call');
const twimlDefaultHandler = require('./routes/twiml-default');
const callStatusHandler = require('./routes/call-status');
const endCallHandler = require('./routes/end-call');
const twilioConfigHandler = require('./routes/twilio-config');
const testWorkflowHandler = require('./routes/test-workflow');
const twimlAiHandler = require('./routes/twiml-ai');
const chatHandler = require('./routes/chat');

// API Routes
app.post('/api/make-call', makeCallHandler);
app.all('/api/twiml-default', twimlDefaultHandler);
app.all('/api/call-status', callStatusHandler);
app.post('/api/end-call', endCallHandler);
app.get('/api/twilio-config', twilioConfigHandler);
app.all('/api/test-workflow', testWorkflowHandler);
app.all('/api/twiml-ai', twimlAiHandler);
app.post('/api/chat', chatHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Call Flow Weaver Backend API',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /api/make-call',
      'GET|POST /api/twiml-workflow',
      'GET|POST /api/twiml-default',
      'GET|POST /api/call-status',
      'POST /api/end-call',
      'GET /api/twilio-config',
      'GET|POST /api/test-workflow'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Call Flow Weaver Backend running on port ${PORT}`);
  console.log(`📞 TwiML endpoints ready for Twilio webhooks`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
