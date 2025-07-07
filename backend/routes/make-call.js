const express = require('express');
const twilio = require('twilio');
const router = express.Router();

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

  // Handle US numbers (10 digits)
  if (cleaned.length === 10 && /^[2-9]\d{9}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  // Handle US numbers with country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1') && /^1[2-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // For international numbers, add + if not present and validate basic format
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  return null;
}

router.post('/', async (req, res) => {
  try {
    console.log('🔥 Make call request received:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { to, from, twimlUrl, record, timeout, workflowId, nodes, edges, config, globalPrompt } = req.body;

    // Validate required fields
    if (!to) {
      console.log('❌ Missing phone number');
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) is required'
      });
    }

    // Normalize phone number
    const normalizedTo = normalizePhoneNumber(to);
    if (!normalizedTo) {
      console.log('❌ Invalid phone number format:', to);
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    console.log('📞 Normalized phone number:', normalizedTo);

    // Use provided from number or default
    const fromNumber = from || process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      console.log('❌ No Twilio phone number configured');
      return res.status(500).json({
        success: false,
        error: 'No Twilio phone number configured'
      });
    }

    console.log('📱 Using from number:', fromNumber);

    // Validate Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('❌ Missing Twilio credentials');
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured properly'
      });
    }

    // Initialize Twilio client
    console.log('🔧 Initializing Twilio client...');
    let twilioClient;
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('✅ Twilio client initialized successfully');
    } catch (twilioError) {
      console.error('❌ Error initializing Twilio client:', twilioError);
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Twilio client: ' + twilioError.message
      });
    }

    // Get host and protocol for URLs
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;

    console.log('🌐 Base URL:', baseUrl);

    // Default TwiML URL if not provided
    let defaultTwiML;
    if (twimlUrl) {
      defaultTwiML = twimlUrl;
    } else {
      if (workflowId && nodes && edges) {
        // Use our workflow-specific endpoint
        defaultTwiML = `${baseUrl}/api/twiml/workflow/${workflowId}`;
        console.log('🔄 Using workflow TwiML endpoint:', defaultTwiML);
      } else {
        // No workflow data - use default
        defaultTwiML = `${baseUrl}/api/twiml/default`;
        console.log('📋 Using default TwiML endpoint:', defaultTwiML);
      }
    }

    // Make the call
    const callTimeout = Math.min(Math.max(timeout || 30, 5), 600);
    
    console.log('📞 Making Twilio call with params:', {
      to: normalizedTo,
      from: fromNumber,
      url: defaultTwiML,
      timeout: callTimeout,
      record: record !== undefined ? record : true
    });

    const call = await twilioClient.calls.create({
      to: normalizedTo,
      from: fromNumber,
      url: defaultTwiML,
      method: 'POST',
      record: record !== undefined ? record : true,
      timeout: callTimeout,
      statusCallback: `${baseUrl}/api/call-status`,
      statusCallbackMethod: 'POST'
    });

    console.log('✅ Call created successfully:', {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from
    });

    res.json({
      success: true,
      callSid: call.sid,
      message: `Call initiated successfully to ${normalizedTo}`,
      status: call.status,
      twimlUrl: defaultTwiML
    });

  } catch (error) {
    console.error('❌ Error making call:', error);

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

    if (error.code === 21614) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TwiML URL. Please check the URL and try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

module.exports = router;
