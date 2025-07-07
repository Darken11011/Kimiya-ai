const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Call Flow Weaver Backend Simple',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  const envCheck = {
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    nodeEnv: process.env.NODE_ENV,
    port: port
  };

  res.json({
    success: true,
    message: 'Simple backend test endpoint working',
    timestamp: new Date().toISOString(),
    environment: envCheck
  });
});

// Make call endpoint
app.post('/api/make-call', async (req, res) => {
  try {
    console.log('📞 Make call endpoint hit');
    console.log('Request body:', req.body);
    
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) is required'
      });
    }
    
    // Check credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured'
      });
    }
    
    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // For now, just return success without making actual call
    res.json({
      success: true,
      message: 'Make-call endpoint working (simple version)',
      to: to,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in make-call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Twilio config endpoint
app.get('/api/twilio-config', (req, res) => {
  res.json({
    success: true,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      recordCalls: true,
      callTimeout: 30,
      hasCredentials: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    }
  });
});

// Default TwiML
app.post('/api/twiml/default', (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a test call from your Call Flow Weaver application.</Say>
    <Pause length="1"/>
    <Say voice="alice">This call will now end. Goodbye!</Say>
</Response>`);
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
  console.log(`🚀 Simple Call Flow Weaver Backend running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📞 Make call: http://localhost:${port}/api/make-call`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
