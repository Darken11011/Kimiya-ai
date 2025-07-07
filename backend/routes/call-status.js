const express = require('express');
const twilio = require('twilio');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { callSid } = req.query;
    
    if (!callSid) {
      return res.status(400).json({
        success: false,
        error: 'Call SID is required'
      });
    }

    console.log('📊 Getting call status for SID:', callSid);

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

    const call = await twilioClient.calls(callSid).fetch();
    
    console.log('✅ Call status retrieved:', {
      sid: call.sid,
      status: call.status,
      duration: call.duration
    });

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
        priceUnit: call.priceUnit,
        startTime: call.startTime,
        endTime: call.endTime
      }
    });

  } catch (error) {
    console.error('❌ Error getting call status:', error);
    
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
});

// Handle Twilio status callbacks
router.post('/', (req, res) => {
  try {
    console.log('📞 Received call status callback:', req.body);
    
    const { CallSid, CallStatus, From, To, Duration, CallDuration } = req.body;
    
    console.log(`📊 Call ${CallSid} status updated to: ${CallStatus}`);
    
    if (Duration || CallDuration) {
      console.log(`⏱️ Call duration: ${Duration || CallDuration} seconds`);
    }
    
    // Here you could add database logging, webhooks, etc.
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error handling call status callback:', error);
    res.status(500).send('Error processing callback');
  }
});

module.exports = router;
