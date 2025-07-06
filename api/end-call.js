import twilio from 'twilio';

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

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // End the call by updating its status to 'completed'
    const call = await twilioClient.calls(callSid).update({
      status: 'completed'
    });

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
