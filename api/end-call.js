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
    const { callSid } = req.query;

    if (!callSid) {
      return res.status(400).json({
        success: false,
        error: 'Call SID is required'
      });
    }

    // Check Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured properly'
      });
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

    // Prepare form data for Twilio API
    const formData = new URLSearchParams();
    formData.append('Status', 'completed');

    // End the call by updating its status to 'completed'
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`, {
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
      message: 'Call ended successfully',
      callSid: call.sid,
      status: call.status
    });

  } catch (error) {
    console.error('Error ending call:', error);
    
    if (error.code === 20404) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end call'
    });
  }
}
