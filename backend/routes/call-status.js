const fetch = require('node-fetch');

module.exports = async function callStatusHandler(req, res) {
  try {
    if (req.method === 'GET') {
      // Handle GET request to check call status
      const { callSid } = req.query;
      
      if (!callSid) {
        return res.status(400).json({
          success: false,
          error: 'Call SID is required'
        });
      }

      // Use environment variables for Twilio credentials
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        return res.status(500).json({
          success: false,
          error: 'Twilio credentials not configured'
        });
      }

      // Create Basic Auth header
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      // Fetch call details from Twilio
      const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      });

      if (!twilioResponse.ok) {
        throw new Error(`Twilio API error: ${twilioResponse.status}`);
      }

      const call = await twilioResponse.json();
      
      res.json({
        success: true,
        call: {
          sid: call.sid,
          status: call.status,
          direction: call.direction,
          from: call.from,
          to: call.to,
          duration: call.duration,
          price: call.price,
          priceUnit: call.priceUnit
        }
      });

    } else if (req.method === 'POST') {
      // Handle Twilio status callback
      console.log('Received call status callback:', req.body);
      
      const { CallSid, CallStatus, From, To, Duration } = req.body;
      
      // Log the status update
      console.log(`Call ${CallSid} status updated to: ${CallStatus}`);
      
      // You can add database logging here if needed
      
      res.status(200).send('OK');
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in call status handler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get call status'
    });
  }
};
