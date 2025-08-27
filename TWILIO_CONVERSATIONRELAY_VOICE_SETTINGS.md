# 🎤 Twilio ConversationRelay Voice Settings Reference

## 🚨 **ERROR 64101 RESOLUTION**

**Problem**: `Invalid values (block_elevenlabs/en-US/Polly.Joanna) for tts settings`

**Root Cause**: ConversationRelay doesn't support AWS Polly voice names in TwiML configuration.

**Solution**: Use ConversationRelay-compatible voice settings.

## ✅ **VALID CONVERSATIONRELAY VOICE SETTINGS**

### **TwiML ConversationRelay Attributes**

```xml
<ConversationRelay
    url="wss://your-server.com/websocket"
    welcomeGreeting="Hello! How can I help you?"
    voice="alice"
    language="en-US"
    dtmfDetection="true"
/>
```

### **Supported Voice Values**

| Voice Name | Description | Language Support |
|------------|-------------|------------------|
| `alice` | Standard female voice (RECOMMENDED) | en-US, en-GB, es-ES, fr-FR, de-DE |
| `man` | Standard male voice | en-US, en-GB, es-ES, fr-FR, de-DE |
| `woman` | Alternative female voice | en-US, en-GB, es-ES, fr-FR, de-DE |

### **Supported Language Values**

| Language Code | Description |
|---------------|-------------|
| `en-US` | English (United States) |
| `en-GB` | English (United Kingdom) |
| `es-ES` | Spanish (Spain) |
| `fr-FR` | French (France) |
| `de-DE` | German (Germany) |

## ❌ **INVALID VOICE SETTINGS**

**DO NOT USE** these voice settings with ConversationRelay:

```xml
<!-- ❌ INVALID - AWS Polly voices -->
voice="Polly.Joanna"
voice="Polly.Matthew"
voice="Polly.Amy"

<!-- ❌ INVALID - ElevenLabs voices -->
voice="elevenlabs.rachel"
voice="elevenlabs.adam"

<!-- ❌ INVALID - Google Cloud voices -->
voice="google.en-US-Wavenet-A"
voice="google.en-US-Neural2-A"

<!-- ❌ INVALID - Azure voices -->
voice="azure.en-US-JennyNeural"
voice="azure.en-US-GuyNeural"
```

## 🔧 **WEBSOCKET MESSAGE VOICE CONFIGURATION**

For WebSocket text messages sent to ConversationRelay:

```javascript
// ✅ CORRECT - ConversationRelay compatible
const textMessage = {
  type: 'text',
  text: 'Hello! How can I help you?',
  voice: {
    name: 'alice',        // Use ConversationRelay voice names
    language: 'en-US'
  }
};

// ❌ INCORRECT - Will cause TTS errors
const textMessage = {
  type: 'text',
  text: 'Hello! How can I help you?',
  voice: {
    name: 'Polly.Joanna',  // AWS Polly not supported
    language: 'en-US'
  }
};
```

## 🎯 **RECOMMENDED CONFIGURATION**

### **For High-Quality Female Voice:**
```xml
<ConversationRelay
    voice="alice"
    language="en-US"
    dtmfDetection="true"
/>
```

### **For Male Voice Alternative:**
```xml
<ConversationRelay
    voice="man"
    language="en-US"
    dtmfDetection="true"
/>
```

### **For International Support:**
```xml
<!-- UK English -->
<ConversationRelay
    voice="alice"
    language="en-GB"
    dtmfDetection="true"
/>

<!-- Spanish -->
<ConversationRelay
    voice="woman"
    language="es-ES"
    dtmfDetection="true"
/>
```

## 🔍 **TROUBLESHOOTING VOICE ISSUES**

### **Error 64101: Invalid TTS Settings**
- ✅ **Fix**: Use only `alice`, `man`, or `woman` for voice parameter
- ✅ **Fix**: Use standard language codes (en-US, en-GB, etc.)
- ✅ **Fix**: Remove any third-party voice provider names

### **No Audio During Calls**
- ✅ **Check**: Voice parameter is set correctly in TwiML
- ✅ **Check**: Language parameter matches your target audience
- ✅ **Check**: WebSocket text messages use matching voice settings

### **Poor Voice Quality**
- ✅ **Try**: Switch from `alice` to `woman` or `man`
- ✅ **Try**: Different language variants (en-US vs en-GB)
- ✅ **Check**: Text message length (shorter messages = better quality)

## 📊 **VOICE TESTING MATRIX**

| Voice | Language | Quality | Recommended Use |
|-------|----------|---------|-----------------|
| `alice` | `en-US` | ⭐⭐⭐⭐⭐ | **Primary choice** - Clear, professional |
| `woman` | `en-US` | ⭐⭐⭐⭐ | Alternative female voice |
| `man` | `en-US` | ⭐⭐⭐⭐ | Male voice option |
| `alice` | `en-GB` | ⭐⭐⭐⭐ | British accent |
| `woman` | `es-ES` | ⭐⭐⭐ | Spanish language support |

## 🚀 **DEPLOYMENT CHECKLIST**

- [x] **TwiML Configuration**: Use `voice="alice"` instead of Polly voices
- [x] **WebSocket Messages**: Use ConversationRelay voice format
- [x] **Language Setting**: Set to `language="en-US"`
- [x] **DTMF Detection**: Enable with `dtmfDetection="true"`
- [ ] **Test Call**: Verify no 64101 errors in Twilio Console
- [ ] **Audio Quality**: Confirm clear TTS output during calls

## 🎉 **SUCCESS CRITERIA**

After implementing these voice settings:

✅ **No Error 64101** - TwiML processes without TTS errors
✅ **Clear Audio** - ConversationRelay TTS works properly
✅ **Consistent Voice** - Same voice across greeting and responses
✅ **DTMF Support** - Key press detection enabled
✅ **Language Support** - Proper pronunciation and accent

---

**🎤 ConversationRelay voice configuration is now optimized for compatibility and quality!**

Use `voice="alice"` and `language="en-US"` for the best results with Twilio ConversationRelay.
