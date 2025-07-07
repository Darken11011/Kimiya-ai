// Using fetch instead of Twilio SDK to avoid serverless function size limits

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

    if (!twilioAccountSid || !twilioAuthToken) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not provided'
      });
    }

    // Get host and protocol for URLs
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.headers['x-forwarded-protocol'] || 'https';

    // Default TwiML URL if not provided
    let defaultTwiML;
    if (twimlUrl) {
      defaultTwiML = twimlUrl;
    } else {
      if (workflowId && nodes && edges) {
        // Create a compact representation of essential workflow data
        const compactWorkflow = {
          id: workflowId,
          gp: globalPrompt || '', // global prompt
          ns: nodes.map(n => ({ // nodes simplified
            id: n.id,
            type: n.type,
            label: n.data?.label || '',
            prompt: n.data?.prompt || '',
            instructions: n.data?.instructions || ''
          })),
          es: edges.map(e => ({ // edges simplified
            id: e.id,
            source: e.source,
            target: e.target
          })),
          cfg: config || {} // config
        };

        // Encode the compact workflow data
        const encodedData = encodeURIComponent(JSON.stringify(compactWorkflow));

        // Check if URL would be too long
        const baseUrl = `${protocol}://${host}/api/twiml-workflow?id=${workflowId}&wd=`;
        const fullUrl = baseUrl + encodedData;

        console.log('TwiML URL length check:', {
          baseUrlLength: baseUrl.length,
          encodedDataLength: encodedData.length,
          totalLength: fullUrl.length,
          isOverLimit: fullUrl.length > 3500
        });

        if (fullUrl.length > 3500) { // Leave some buffer
          console.log('Workflow data too large, using default workflow');
          defaultTwiML = `${protocol}://${host}/api/twiml-workflow?id=${workflowId}`;
        } else {
          defaultTwiML = fullUrl;
        }

        console.log(`Using workflow TwiML endpoint (${defaultTwiML.length} chars):`, defaultTwiML);
      } else {
        // No workflow data - use default
        defaultTwiML = `${protocol}://${host}/api/twiml-default`;
        console.log(`Using default TwiML endpoint: ${defaultTwiML}`);
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
      const errorData = await twilioResponse.json();
      throw new Error(errorData.message || `Twilio API error: ${twilioResponse.status}`);
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
