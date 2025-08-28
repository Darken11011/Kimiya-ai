# Common Issues & Troubleshooting

This guide covers the most common issues you might encounter with Call Flow Weaver and their solutions.

## 🔐 Authentication Issues

### Twilio Authentication Error (Error 20003)

**Symptoms:**
- Calls fail with "Authenticate" error
- Backend logs show authentication failures
- Unable to make outbound calls

**Solutions:**

1. **Verify Credentials Format**
   ```bash
   # Account SID should start with 'AC' and be 34 characters
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   # Auth Token should be 32 characters
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   # Phone number in E.164 format
   TWILIO_PHONE_NUMBER=+17077433838
   ```

2. **Test Credentials Locally**
   ```bash
   cd call-flow-weaver
   node test-twilio-auth.js
   ```

3. **Check Render Environment Variables**
   - Go to Render Dashboard
   - Verify all variables are set correctly
   - No extra spaces or quotes

### Azure OpenAI Authentication

**Symptoms:**
- Chat mode not working
- AI responses failing
- API key errors

**Solutions:**

1. **Verify API Key Format**
   ```bash
   AZURE_OPENAI_API_KEY=f6d564a83af3498c9beb46d7d3e3da96
   AZURE_OPENAI_ENDPOINT=https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview
   ```

2. **Test Connection**
   ```bash
   curl -H "api-key: YOUR_KEY" YOUR_ENDPOINT
   ```

## 🔌 Connection Issues

### WebSocket Connection Problems

**Symptoms:**
- Calls go silent after greeting
- No real-time conversation
- ConversationRelay not connecting

**Solutions:**

1. **Check WebSocket Server Status**
   ```bash
   # Test WebSocket connection
   node backend/test-websocket-connection.js
   ```

2. **Verify SSL/TLS Configuration**
   - Ensure production uses WSS (not WS)
   - Check certificate validity
   - Verify Render SSL configuration

3. **Protocol Support**
   - ConversationRelay requires specific subprotocols
   - Check `twilio-conversation-relay` protocol support
   - Verify message format handling

### CORS Issues

**Symptoms:**
- Frontend can't connect to backend
- Cross-origin request blocked
- 503 Service Unavailable

**Solutions:**

1. **Update CORS Configuration**
   ```javascript
   const corsOptions = {
     origin: [
       'http://localhost:8080',
       'https://kimiya-ai.vercel.app',
       'https://kimiyi-ai.onrender.com'
     ],
     credentials: true
   };
   ```

2. **Check Domain Configuration**
   - Verify frontend domain is in CORS whitelist
   - Update production URLs
   - Check for typos in domain names

## 📞 Call Issues

### Calls Not Connecting

**Symptoms:**
- Phone doesn't ring
- Call fails immediately
- No audio on connection

**Solutions:**

1. **Phone Number Validation**
   ```bash
   # Must be in E.164 format
   +1234567890  # ✅ Correct
   1234567890   # ❌ Wrong
   (123)456-7890 # ❌ Wrong
   ```

2. **Twilio Account Status**
   - Check account balance
   - Verify phone number ownership
   - Check geographic permissions

3. **Webhook Configuration**
   ```bash
   # Webhook URL must be accessible
   https://kimiyi-ai.onrender.com/api/twiml
   ```

### Audio Quality Issues

**Symptoms:**
- Poor audio quality
- Speech recognition failures
- Delayed responses

**Solutions:**

1. **Performance Optimization**
   ```bash
   PERFORMANCE_TARGET_LATENCY=300
   PERFORMANCE_MAX_LATENCY=500
   PERFORMANCE_CACHE_ENABLED=true
   ```

2. **Audio Processing Settings**
   - Enable streaming audio processor
   - Configure proper codec settings
   - Optimize network connectivity

## 🖥️ Frontend Issues

### "Process is not defined" Error

**Status:** ✅ **FIXED**

**Solution:**
The app now uses browser-compatible environment variable access via `import.meta.env`.

### Flow Builder Not Loading

**Symptoms:**
- Blank canvas
- Nodes not draggable
- Connection errors

**Solutions:**

1. **Clear Browser Cache**
   ```bash
   # Hard refresh
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Check Console Errors**
   - Open browser dev tools
   - Look for JavaScript errors
   - Check network requests

3. **Verify Dependencies**
   ```bash
   npm install
   npm run dev
   ```

## 🚀 Performance Issues

### Slow Response Times

**Symptoms:**
- Calls have long delays
- AI responses take too long
- Poor user experience

**Solutions:**

1. **Enable Performance Optimization**
   ```bash
   PERFORMANCE_CACHE_ENABLED=true
   PERFORMANCE_LANGUAGE_OPTIMIZATION=true
   PERFORMANCE_FAILOVER_ENABLED=true
   ```

2. **Monitor Performance**
   ```bash
   # Check health endpoint
   curl https://kimiyi-ai.onrender.com/health
   ```

3. **Optimize Configuration**
   - Reduce target latency
   - Enable predictive caching
   - Use performance orchestrator

### Memory Issues

**Symptoms:**
- Application crashes
- Slow performance over time
- High memory usage

**Solutions:**

1. **Monitor Resource Usage**
   ```bash
   # Check backend health
   GET /health
   ```

2. **Optimize State Management**
   - Clear unused workflow data
   - Limit conversation history
   - Implement proper cleanup

## 🔧 Development Issues

### Environment Variables Not Loading

**Symptoms:**
- Configuration not found
- Default values being used
- API connections failing

**Solutions:**

1. **Check File Location**
   ```bash
   # .env should be in project root
   call-flow-weaver/.env
   ```

2. **Verify Variable Names**
   ```bash
   # Frontend variables need VITE_ prefix
   VITE_AZURE_OPENAI_API_KEY=your_key
   
   # Backend variables use standard names
   AZURE_OPENAI_API_KEY=your_key
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## 🆘 Getting Help

### Debug Commands

```bash
# Test Twilio authentication
node test-twilio-auth.js

# Test WebSocket connection
node backend/test-websocket-connection.js

# Check environment configuration
npm run setup-env

# Monitor backend health
curl https://kimiyi-ai.onrender.com/health
```

### Log Analysis

1. **Frontend Logs**: Browser console
2. **Backend Logs**: Render dashboard logs
3. **Twilio Logs**: Twilio Console call logs
4. **Performance Logs**: Health endpoint metrics

### Support Resources

- [Environment Setup Guide](../guides/environment-setup.md)
- [Deployment Guide](../deployment/production.md)
- [Performance Optimization](../performance/optimization.md)
- [API Reference](../fixes/api-reference.md)
