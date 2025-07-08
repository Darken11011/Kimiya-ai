const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Call Flow Weaver Backend'
  });
});

// Import route handlers
const makeCallHandler = require('./routes/make-call');
const twimlWorkflowHandler = require('./routes/twiml-workflow');
const twimlDefaultHandler = require('./routes/twiml-default');
const callStatusHandler = require('./routes/call-status');
const endCallHandler = require('./routes/end-call');
const twilioConfigHandler = require('./routes/twilio-config');

// API Routes
app.post('/api/make-call', makeCallHandler);
app.all('/api/twiml-workflow', twimlWorkflowHandler);
app.all('/api/twiml-default', twimlDefaultHandler);
app.all('/api/call-status', callStatusHandler);
app.post('/api/end-call', endCallHandler);
app.get('/api/twilio-config', twilioConfigHandler);

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
      'GET /api/twilio-config'
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
