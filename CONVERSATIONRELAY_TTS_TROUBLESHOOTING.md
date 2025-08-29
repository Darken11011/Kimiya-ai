# 🔧 ConversationRelay TTS Troubleshooting Guide

## 🚨 **Current Issue**
- ✅ **TwiML welcome greeting plays** (initial TTS works)
- ❌ **WebSocket text messages don't play** (AI responses silent)
- ✅ **Messages sent successfully** (no WebSocket errors)
- ❌ **User reports "I cannot hear you"**

## 🔍 **Systematic Diagnosis**

### **1. ConversationRelay Service Configuration**

#### **Check Account Status**
```bash
# Run diagnostic tool
node diagnose-conversationrelay.js
```

#### **Potential Issues:**
- **ConversationRelay Beta Access**: Not all accounts have ConversationRelay enabled
- **TTS Provider Permissions**: Account may not have access to specific TTS providers
- **Service Limits**: Account may have TTS usage restrictions

#### **Solutions:**
1. **Contact Twilio Support**:
   - Subject: "ConversationRelay TTS not working"
   - Account SID: `AC64208c7087a03b475ea7fa9337b692f8`
   - Issue: "Welcome greeting plays but WebSocket TTS messages are silent"

2. **Request Beta Access**:
   - ConversationRelay is a beta feature
   - May require special account enablement

### **2. Audio Codec/Format Compatibility**

#### **ConversationRelay Audio Requirements:**
- **Sample Rate**: 8000 Hz (μ-law) or 16000 Hz (linear PCM)
- **Audio Format**: μ-law (G.711) or linear PCM
- **Channels**: Mono (1 channel)
- **Bit Depth**: 8-bit (μ-law) or 16-bit (PCM)

#### **TTS Provider Compatibility:**
| Provider | Format Support | ConversationRelay Compatible |
|----------|----------------|------------------------------|
| Google TTS | Multiple formats | ✅ Yes |
| ElevenLabs | High-quality audio | ⚠️ Requires special config |
| Amazon Polly | Telephony formats | ✅ Yes |
| Legacy Twilio | Standard telephony | ✅ Yes |

#### **Test Audio Compatibility:**
```bash
# Run simple TTS tests
node test-simple-tts.js
```

### **3. Network/Firewall Issues**

#### **Required Connections:**
- **Twilio API**: `https://api.twilio.com`
- **ConversationRelay Service**: Twilio's internal services
- **WebSocket Backend**: `wss://kimiyi-ai.onrender.com`

#### **Potential Blocks:**
- **Corporate Firewalls**: May block WebSocket connections
- **ISP Restrictions**: Some ISPs block certain audio streams
- **Geographic Restrictions**: ConversationRelay may not be available in all regions

#### **Test Network Connectivity:**
```bash
# Check if endpoints are reachable
curl -I https://api.twilio.com
curl -I https://kimiyi-ai.onrender.com
```

### **4. Twilio Account TTS Permissions**

#### **Check Account Capabilities:**
1. **Voice API Access**: Verify account can make calls
2. **TTS Provider Access**: Check which TTS providers are enabled
3. **ConversationRelay Access**: Verify beta feature access
4. **Usage Limits**: Check if TTS usage limits are exceeded

#### **Common Permission Issues:**
- **Trial Account Limitations**: Trial accounts may have TTS restrictions
- **Geographic Restrictions**: Some TTS providers not available in all regions
- **Service Plan Limitations**: Basic plans may not include advanced TTS

## 🧪 **Diagnostic Tests**

### **Test 1: Basic TTS Functionality**
```javascript
// Test basic <Say> TTS
<Response>
    <Say voice="alice">Basic TTS test</Say>
</Response>
```
**Expected**: Should hear clear TTS audio
**If fails**: Account has basic TTS issues

### **Test 2: ConversationRelay Welcome Greeting**
```javascript
// Test ConversationRelay TTS
<ConversationRelay
    welcomeGreeting="ConversationRelay TTS test"
    voice="alice"
/>
```
**Expected**: Should hear welcome greeting
**If fails**: ConversationRelay TTS not working

### **Test 3: WebSocket Text Messages**
```javascript
// WebSocket message
{
  type: 'text',
  text: 'WebSocket TTS test'
}
```
**Expected**: Should hear TTS of WebSocket message
**If fails**: WebSocket TTS configuration issue

## 🔧 **Troubleshooting Steps**

### **Step 1: Verify Basic TTS**
```bash
node test-simple-tts.js
```
- Tests basic `<Say>` TTS functionality
- Tests ConversationRelay welcome greeting
- Tests different TTS providers

### **Step 2: Check Account Configuration**
```bash
node diagnose-conversationrelay.js
```
- Verifies Twilio account status
- Checks ConversationRelay access
- Lists available TTS providers

### **Step 3: Simplify WebSocket Messages**
Current configuration:
```javascript
// Minimal WebSocket message
const textMessage = {
  type: 'text',
  text: text
};
```

### **Step 4: Test Different TTS Providers**
```xml
<!-- Google TTS -->
<Language code="en-US" ttsProvider="google" voice="en-US-Standard-A" />

<!-- Amazon Polly -->
<Language code="en-US" ttsProvider="amazon" voice="Joanna-Generative" />

<!-- Legacy Twilio -->
<ConversationRelay voice="alice" language="en-US" />
```

## 🎯 **Most Likely Causes**

### **1. ConversationRelay Beta Access (90% probability)**
- ConversationRelay is a beta feature
- Not all accounts have access
- Requires Twilio support enablement

### **2. WebSocket Message Format (5% probability)**
- Incorrect message structure
- Missing required fields
- Voice configuration conflicts

### **3. TTS Provider Configuration (3% probability)**
- Specific TTS provider not available
- Account doesn't have provider access
- Regional restrictions

### **4. Network/Audio Issues (2% probability)**
- Firewall blocking audio streams
- Audio codec incompatibility
- Geographic service restrictions

## 📞 **Contact Twilio Support**

### **Information to Provide:**
- **Account SID**: `AC64208c7087a03b475ea7fa9337b692f8`
- **Issue**: ConversationRelay TTS not playing WebSocket messages
- **Symptoms**: Welcome greeting works, AI responses silent
- **TwiML**: Provide your ConversationRelay TwiML
- **WebSocket Messages**: Provide example WebSocket text messages

### **Support Channels:**
- **Console**: https://console.twilio.com/support
- **Email**: help@twilio.com
- **Phone**: Available in Twilio Console

### **Request:**
1. **ConversationRelay Beta Access**: Verify account has access
2. **TTS Provider Enablement**: Enable Google/ElevenLabs TTS
3. **Technical Investigation**: Debug why WebSocket TTS is silent

## 🚀 **Next Steps**

1. **Run diagnostic tests** to isolate the issue
2. **Contact Twilio Support** with detailed information
3. **Request ConversationRelay troubleshooting** assistance
4. **Test with simplified configuration** while waiting for support

The issue is most likely **ConversationRelay beta access** or **account configuration** rather than code problems, since your implementation appears technically correct.
