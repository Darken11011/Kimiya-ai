module.exports = function twilioConfigHandler(req, res) {
  try {
    // Return Twilio configuration
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '', // Include for frontend compatibility
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      recordCalls: true,
      callTimeout: 30,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN
    };

    res.json({
      success: true,
      config: config
    });

  } catch (error) {
    console.error('Error getting Twilio config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Twilio configuration'
    });
  }
};
