const fetch = require('node-fetch');

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

module.exports = async function makeCallHandler(req, res) {
  try {
    console.log('=== MAKE CALL REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Environment check:', {
      hasEnvSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasEnvToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasEnvPhone: !!process.env.TWILIO_PHONE_NUMBER
    });
    const { to, from, twimlUrl, record, timeout, workflowId, nodes, edges, globalPrompt } = req.body;

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
        error: 'No Twilio phone number provided'
      });
    }

    // Check Twilio credentials from request body (provided by frontend)
    const twilioAccountSid = req.body.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = req.body.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;

    console.log('Checking Twilio credentials...');
    console.log('Account SID exists:', !!twilioAccountSid);
    console.log('Auth Token exists:', !!twilioAuthToken);
    console.log('Using request credentials:', !!req.body.twilioAccountSid);
    console.log('Using env credentials:', !!process.env.TWILIO_ACCOUNT_SID);

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Missing Twilio credentials:', {
        hasRequestSid: !!req.body.twilioAccountSid,
        hasRequestToken: !!req.body.twilioAuthToken,
        hasEnvSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasEnvToken: !!process.env.TWILIO_AUTH_TOKEN
      });
      return res.status(400).json({
        success: false,
        error: 'Twilio credentials not provided. Please check your configuration.'
      });
    }

    // Get host and protocol for URLs
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || 'https';

    // Default TwiML URL if not provided
    let defaultTwiML;
    if (twimlUrl) {
      defaultTwiML = twimlUrl;
    } else {
      // Use the workflow endpoint for dynamic conversations based on actual workflow
      if (workflowId && nodes && edges) {
        // Store workflow data in a simple way that can be retrieved by the TwiML endpoint
        global.workflowData = global.workflowData || {};
        global.workflowData[workflowId] = {
          nodes,
          edges,
          globalPrompt,
          config: req.body.config,
          timestamp: Date.now()
        };

        defaultTwiML = `${protocol}://${host}/api/twiml-minimal`;
        console.log(`Using minimal TwiML endpoint for debugging: ${defaultTwiML}`);

        // Log the workflow data for debugging
        console.log('Workflow data stored for processing:', {
          workflowId,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          hasGlobalPrompt: !!globalPrompt,
          firstNodeId: nodes[0]?.id,
          firstNodeType: nodes[0]?.type
        });
      } else {
        // No workflow data - use simple endpoint as fallback
        defaultTwiML = `${protocol}://${host}/api/twiml-simple`;
        console.log(`Using simple TwiML endpoint as fallback: ${defaultTwiML}`);
      }
    }

    // Make the call using Twilio REST API
    // Twilio timeout must be between 5 and 600 seconds
    const callTimeout = Math.min(Math.max(timeout || 30, 5), 600);

    // Prepare form data for Twilio API
    const formData = new URLSearchParams();
    formData.append('To', normalizedTo);
    formData.append('From', fromNumber);
    formData.append('Url', defaultTwiML);
    formData.append('Method', 'POST');
    formData.append('Record', record !== undefined ? record.toString() : 'true');
    formData.append('Timeout', callTimeout.toString());
    formData.append('StatusCallback', `${protocol}://${host}/api/call-status`);
    formData.append('StatusCallbackMethod', 'POST');

    console.log('Twilio API call parameters:', {
      To: normalizedTo,
      From: fromNumber,
      Url: defaultTwiML,
      Method: 'POST',
      Record: record !== undefined ? record.toString() : 'true',
      Timeout: callTimeout.toString(),
      StatusCallback: `${protocol}://${host}/api/call-status`
    });

    // Create Basic Auth header
    const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

    // Make the API call to Twilio
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio API error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Twilio API error: ${twilioResponse.status} - ${errorText}`);
    }

    const call = await twilioResponse.json();

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
