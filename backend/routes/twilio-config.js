module.exports = function twilioConfigHandler(req, res) {
  try {
    // Return Twilio configuration
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      // Don't expose auth token for security
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
