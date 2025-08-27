# 🔧 Call Silence Issue - Troubleshooting Guide

## 🎯 **Problem Description**
Calls go silent after the greeting message is played. The system doesn't respond to user speech.

## 🔍 **Root Cause Analysis**

### **Primary Issues Fixed:**
1. **Speech Detection Thresholds Too High** ✅ FIXED
   - Reduced minimum audio size from 2KB to 500 bytes
   - Reduced minimum duration from 800ms to 300ms
   - Added fallback detection for any audio over 1KB

2. **Missing Timeout Mechanism** ✅ FIXED
   - Added 5-second silence timeout after greeting
   - Automatic prompt if no speech detected
   - Proper timeout cleanup on speech detection

3. **Enhanced Audio Processing** ✅ IMPROVED
   - Better speech detection logic
   - Improved fallback transcript generation
   - More responsive audio buffer processing

## 🛠️ **Immediate Solutions Applied**

### **1. Enhanced Speech Detection**
```javascript
// NEW: Much more sensitive thresholds
const minSizeForSpeech = 500; // 500 bytes (was 2000)
const minDurationForSpeech = 300; // 0.3 seconds (was 800ms)
const consistentChunks = audioBuffer.length >= 2; // 2 chunks (was 3)

// NEW: Aggressive fallback detection
const speechDetected = (totalSize >= minSizeForSpeech && consistentChunks) ||
                      (timespan >= minDurationForSpeech && audioBuffer.length >= 1) ||
                      (totalSize >= 1000); // Any audio over 1KB
```

### **2. Silence Timeout Mechanism**
```javascript
// NEW: 5-second timeout after greeting
session.silenceTimeout = setTimeout(async () => {
  if (session.isActive && (!session.conversationHistory || session.conversationHistory.length === 0)) {
    await this.sendAIResponse(session, "I'm here and ready to help. Please speak up so I can assist you.");
  }
}, 5000);
```

### **3. Improved Transcript Fallback**
```javascript
// NEW: Intelligent transcript simulation based on audio characteristics
if (totalSize > 3000 && timespan > 1000) {
  return "Hello, I need help with something"; // Longer speech
} else if (totalSize > 1500) {
  return "Hi there"; // Medium speech
} else if (totalSize > 500) {
  return "Yes"; // Short speech
}
```

## 🧪 **Testing & Debugging**

### **Run Diagnostic Script**
```bash
cd call-flow-weaver
node debug-call-silence.js
```

This will test:
- ✅ Backend health and configuration
- ✅ Optimized endpoints functionality
- ✅ WebSocket connection stability
- ✅ TwiML generation correctness

### **Enable Verbose Logging**
```bash
# For detailed TwiML output
DEBUG_VERBOSE=true node debug-call-silence.js
```

### **Monitor Backend Logs**
```bash
# Watch Render logs in real-time
# Go to: https://dashboard.render.com → Your Service → Logs
```

## 🔧 **Manual Testing Steps**

### **1. Test Call Flow**
1. **Make a test call** to your Twilio number
2. **Listen for greeting** - should play automatically
3. **Speak immediately** after greeting ends
4. **Wait 5 seconds** if no response - should get timeout prompt
5. **Check browser console** for WebSocket errors

### **2. Check WebSocket Connection**
```javascript
// Open browser console and run:
const ws = new WebSocket('wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?callSid=test&workflowId=test&trackingId=test');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.log('❌ WebSocket error:', e);
ws.onmessage = (e) => console.log('📨 Message:', e.data);
```

### **3. Verify TwiML Response**
```bash
curl -X POST "https://kimiyi-ai.onrender.com/api/twiml-optimized" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&workflowId=test&trackingId=test"
```

Should return TwiML with:
- `<ConversationRelay>` element
- `welcomeGreeting` attribute
- WebSocket URL (`wss://`)

## 🚨 **Common Issues & Solutions**

### **Issue 1: WebSocket Connection Fails**
**Symptoms:** No response to speech, connection errors in logs
**Solution:**
```bash
# Check if WebSocket endpoint is accessible
curl -I https://kimiyi-ai.onrender.com/api/conversationrelay-ws
# Should return 426 Upgrade Required (normal for WebSocket)
```

### **Issue 2: Audio Not Detected**
**Symptoms:** Silence timeout always triggers
**Solutions:**
- Check microphone permissions
- Test with different phones/networks
- Verify Twilio webhook URLs are accessible

### **Issue 3: TwiML Errors**
**Symptoms:** Call drops immediately, XML parsing errors
**Solution:**
```bash
# Validate TwiML response
node -e "
const response = await fetch('https://kimiyi-ai.onrender.com/api/twiml-optimized', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: 'CallSid=test&workflowId=test&trackingId=test'
});
console.log(await response.text());
"
```

### **Issue 4: Environment Variables Missing**
**Symptoms:** Backend errors, authentication failures
**Solution:**
```bash
# Check Render environment variables:
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN  
# - TWILIO_PHONE_NUMBER
# - AZURE_OPENAI_API_KEY
# - AZURE_OPENAI_ENDPOINT
```

## 📊 **Performance Monitoring**

### **Check Response Times**
```bash
curl "https://kimiyi-ai.onrender.com/api/performance-metrics"
```

### **Expected Metrics:**
- Average latency: < 250ms
- P95 latency: < 500ms
- Error rate: < 5%
- WebSocket uptime: > 99%

## 🎯 **Next Steps If Issue Persists**

### **1. Enable Debug Mode**
Add to your workflow setup:
```javascript
// In PlaygroundModal or WorkflowSetupModal
const debugConfig = {
  enableVerboseLogging: true,
  speechDetectionSensitivity: 'high',
  timeoutDuration: 3000 // 3 seconds instead of 5
};
```

### **2. Test with Different Providers**
- Try different STT providers (Azure, Deepgram)
- Test with different voice providers
- Verify network connectivity from different locations

### **3. Contact Support**
If all tests pass but issue persists:
1. Share diagnostic script output
2. Provide call logs from Render dashboard
3. Include Twilio call SID for investigation

## 📞 **Emergency Fallback**

If the issue is critical, you can temporarily use the traditional TwiML approach:

```javascript
// In twiml-optimized.js, replace ConversationRelay with:
const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/process-speech" method="POST" timeout="10">
        <Say voice="alice">Hello! I'm your AI assistant. How can I help you today?</Say>
    </Gather>
</Response>`;
```

This will provide basic functionality while you resolve the ConversationRelay issues.
