const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Call Flow Weaver Backend',
    version: '1.0.0'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  
  const envCheck = {
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    nodeEnv: process.env.NODE_ENV,
    port: port,
    accountSidLength: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.length : 0,
    authTokenLength: process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.length : 0
  };

  console.log('Environment check:', envCheck);

  res.json({
    success: true,
    message: 'Backend test endpoint working',
    timestamp: new Date().toISOString(),
    environment: envCheck
  });
});

// Import route handlers
console.log('📁 Loading route handlers...');
let makeCallRoute, callStatusRoute, endCallRoute, twilioConfigRoute, twimlRoutes;

try {
  makeCallRoute = require('./routes/make-call');
  console.log('✅ make-call route loaded');
  callStatusRoute = require('./routes/call-status');
  console.log('✅ call-status route loaded');
  endCallRoute = require('./routes/end-call');
  console.log('✅ end-call route loaded');
  twilioConfigRoute = require('./routes/twilio-config');
  console.log('✅ twilio-config route loaded');
  twimlRoutes = require('./routes/twiml');
  console.log('✅ twiml routes loaded');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

// API routes
console.log('🛣️ Registering API routes...');
app.use('/api/make-call', makeCallRoute);
console.log('✅ Registered: POST /api/make-call');
app.use('/api/call-status', callStatusRoute);
console.log('✅ Registered: GET /api/call-status');
app.use('/api/end-call', endCallRoute);
console.log('✅ Registered: POST /api/end-call');
app.use('/api/twilio-config', twilioConfigRoute);
console.log('✅ Registered: GET /api/twilio-config');
app.use('/api/twiml', twimlRoutes);
console.log('✅ Registered: POST /api/twiml/*');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Call Flow Weaver Backend running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
  console.log(`📞 Make call endpoint: http://localhost:${port}/api/make-call`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Log Twilio configuration status
  console.log('📞 Twilio Configuration:');
  console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}`);

  // Log loaded routes
  console.log('🛣️ Loaded routes:');
  console.log('   POST /api/make-call');
  console.log('   GET /api/call-status');
  console.log('   POST /api/end-call');
  console.log('   GET /api/twilio-config');
  console.log('   POST /api/twiml/*');
});

module.exports = app;
