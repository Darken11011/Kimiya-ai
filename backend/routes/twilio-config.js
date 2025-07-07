const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('⚙️ Twilio config requested');
  
  // Return the Twilio configuration from environment variables
  // Note: We don't return sensitive data like auth tokens
  res.json({
    success: true,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      recordCalls: true,
      callTimeout: 30,
      hasCredentials: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    }
  });
});

module.exports = router;
