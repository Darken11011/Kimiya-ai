module.exports = function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Test endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // Check environment variables
  const envCheck = {
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    nodeEnv: process.env.NODE_ENV,
    accountSidLength: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.length : 0,
    authTokenLength: process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.length : 0
  };

  console.log('Environment check:', envCheck);

  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: envCheck
  });
}
