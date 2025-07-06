# Setting Up Ngrok for Local Development with Twilio

To enable dynamic workflow-based calls in local development, you need to make your localhost accessible to Twilio's servers. This guide shows how to set up ngrok for this purpose.

## 🚀 Quick Setup

### 1. Install Ngrok

**Option A: Download from website**
1. Go to [ngrok.com](https://ngrok.com)
2. Sign up for a free account
3. Download ngrok for your platform
4. Extract and add to your PATH

**Option B: Using package managers**
```bash
# Windows (Chocolatey)
choco install ngrok

# macOS (Homebrew)
brew install ngrok/ngrok/ngrok

# npm (cross-platform)
npm install -g ngrok
```

### 2. Authenticate Ngrok
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```
(Get your authtoken from the ngrok dashboard)

### 3. Start Your Backend
```bash
cd call-flow-weaver/api
npm run dev
```
Your backend should be running on `http://localhost:3000`

### 4. Start Ngrok Tunnel
```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### 5. Update Your Code

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update your frontend:

**Option A: Environment Variable**
Create a `.env` file in your frontend:
```
VITE_API_BASE_URL=https://abc123.ngrok.io
```

**Option B: Update TwilioService directly**
In `src/services/twilioService.ts`, update the `getApiBaseUrl` method:
```typescript
private getApiBaseUrl(): string {
  // Use your ngrok URL for local development
  return 'https://abc123.ngrok.io';
}
```

## 🎯 Testing Workflow-Based Calls

Once ngrok is set up:

1. **Create a Workflow**: Add nodes to your flow canvas
2. **Open Playground**: Click the playground button
3. **Go to Call Tab**: Switch to the call interface
4. **Make a Call**: Enter a phone number and click "Call"
5. **Experience Dynamic Flow**: The call will now follow your workflow!

## 🔧 Advanced Configuration

### Custom Subdomain (Paid Plans)
```bash
ngrok http 3000 --subdomain=my-call-flow-api
```

### Configuration File
Create `~/.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_AUTHTOKEN
tunnels:
  call-flow-api:
    addr: 3000
    proto: http
    subdomain: my-call-flow-api
```

Then start with:
```bash
ngrok start call-flow-api
```

### Multiple Services
```yaml
tunnels:
  api:
    addr: 3000
    proto: http
  frontend:
    addr: 8081
    proto: http
```

## 🐛 Troubleshooting

### Common Issues

1. **"tunnel not found" error**
   - Check if ngrok is running
   - Verify the port number (3000)
   - Ensure backend is running

2. **Twilio can't reach webhook**
   - Verify ngrok URL is publicly accessible
   - Check firewall settings
   - Ensure HTTPS (ngrok provides this automatically)

3. **Call connects but no workflow**
   - Check backend logs for workflow data
   - Verify workflow is being sent with call request
   - Check TwiML endpoint is receiving requests

### Debug Steps

1. **Check Ngrok Status**
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/health
   ```

2. **View Ngrok Requests**
   Open `http://127.0.0.1:4040` to see all requests

3. **Check Backend Logs**
   Look for workflow storage and TwiML generation logs

## 🎉 Expected Behavior

With ngrok properly set up:

### Before (Static TwiML):
```
"Hello! This is a test call from your Call Flow Weaver workflow. 
Thank you for testing the system. This call will now end."
```

### After (Dynamic Workflow):
```
"Hello! Welcome to your workflow. [Your start node content]
I'm listening for your response..."

[User speaks]

[AI processes through workflow nodes]

[Dynamic response based on workflow logic]
```

## 🔄 Alternative Solutions

### 1. TwiML Bins
Create static TwiML content in Twilio Console for testing

### 2. Cloud Deployment
Deploy your backend to Vercel/Heroku for permanent public access

### 3. Local Network Tunnel
Use other tunneling services like localtunnel or serveo

## 📝 Production Notes

- **Security**: Never expose sensitive data through tunnels
- **Performance**: Ngrok adds latency - use direct deployment for production
- **Reliability**: Ngrok URLs change on restart - use paid plans for stable URLs
- **Monitoring**: Use ngrok's web interface to monitor requests

## 🎯 Next Steps

Once ngrok is working:
1. Test different workflow configurations
2. Add more complex node types
3. Implement AI integration for dynamic responses
4. Set up call recording and analysis
5. Deploy to production with proper TwiML endpoints

This setup enables full workflow-based call testing in your local development environment!
