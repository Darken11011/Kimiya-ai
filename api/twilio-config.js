// Endpoint to get Twilio configuration from environment variables
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return the Twilio configuration from environment variables
  res.json({
    success: true,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      recordCalls: true,
      callTimeout: 30
    }
  });
}
