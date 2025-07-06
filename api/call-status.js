import twilio from 'twilio';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    if (req.method === 'GET') {
      // Get call status by SID from URL path
      const { callSid } = req.query;
      
      if (!callSid) {
        return res.status(400).json({
          success: false,
          error: 'Call SID is required'
        });
      }

      const call = await twilioClient.calls(callSid).fetch();
      
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
    console.error('Error handling call status:', error);
    
    if (error.code === 20404) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get call status'
    });
  }
}
