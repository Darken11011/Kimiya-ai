const express = require('express');
const twilio = require('twilio');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { callSid } = req.query;
    
    if (!callSid) {
      return res.status(400).json({
        success: false,
        error: 'Call SID is required'
      });
    }

    console.log('🛑 Ending call with SID:', callSid);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured properly'
      });
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // End the call by updating its status to 'completed'
    const call = await twilioClient.calls(callSid).update({
      status: 'completed'
    });

    console.log('✅ Call ended successfully:', {
      callSid: call.sid,
      status: call.status
    });

    res.json({
      success: true,
      message: 'Call ended successfully',
      callSid: call.sid,
      status: call.status
    });

  } catch (error) {
    console.error('❌ Error ending call:', error);
    
    if (error.code === 20404) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    if (error.code === 21220) {
      return res.status(400).json({
        success: false,
        error: 'Call cannot be modified in its current state'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end call'
    });
  }
});

module.exports = router;
