import twilio from 'twilio';

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

  // For other international numbers, add + if it looks valid
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  return null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Initialize Twilio client
    console.log('Initializing Twilio client...');
    console.log('Account SID exists:', !!process.env.TWILIO_ACCOUNT_SID);
    console.log('Auth Token exists:', !!process.env.TWILIO_AUTH_TOKEN);
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured properly'
      });
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Get host and protocol for URLs
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.headers['x-forwarded-protocol'] || 'https';

    // Default TwiML URL if not provided
    let defaultTwiML;
    if (twimlUrl) {
      defaultTwiML = twimlUrl;
    } else {
      if (workflowId && nodes && edges) {
        // Use our workflow-specific endpoint for production
        defaultTwiML = `${protocol}://${host}/api/twiml/workflow/${workflowId}`;
        console.log(`Using workflow TwiML endpoint: ${defaultTwiML}`);
      } else {
        // No workflow data - use default
        defaultTwiML = `${protocol}://${host}/api/twiml/default`;
      }
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
      statusCallback: `${protocol}://${host}/api/call-status`,
      statusCallbackMethod: 'POST'
    });

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
};
