const fetch = require('node-fetch');

module.exports = async function endCallHandler(req, res) {
  try {
    const { callSid, twilioAccountSid, twilioAuthToken } = req.body;

    if (!callSid) {
      return res.status(400).json({
        success: false,
        error: 'Call SID is required'
      });
    }

    // Use provided credentials or environment variables
    const accountSid = twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not provided'
      });
    }

    console.log('Ending call:', callSid);

    // Create Basic Auth header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // End the call using Twilio REST API
    const formData = new URLSearchParams();
    formData.append('Status', 'completed');

    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`, {
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
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end call'
    });
  }
};
