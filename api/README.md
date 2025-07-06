# Call Flow Weaver API

Backend API for Call Flow Weaver with Twilio integration. This API enables real phone calls from the browser-based flow builder.

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Twilio credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Test the API**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   # From project root (call-flow-weaver/)
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add TWILIO_ACCOUNT_SID
   vercel env add TWILIO_AUTH_TOKEN
   vercel env add TWILIO_PHONE_NUMBER
   vercel env add NODE_ENV
   ```

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
- Returns API status and timestamp

### Make Call
- **POST** `/api/make-call`
- Body: `{ "to": "+1234567890", "from": "+1987654321", "record": true, "timeout": 30 }`
- Initiates a phone call using Twilio

### Get Call Status
- **GET** `/api/call-status/:callSid`
- Returns current status of a call

### End Call
- **POST** `/api/end-call/:callSid`
- Terminates an active call

### TwiML Endpoint
- **POST** `/api/twiml/default`
- Returns default TwiML for call handling

### Status Webhook
- **POST** `/api/call-status`
- Receives call status updates from Twilio

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | `AC64208c7087a03b475ea7fa9337b692f8` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | `587e27a4553570edb09656c15a03d0e8` |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | `+17077433838` |
| `NODE_ENV` | Environment (development/production) | `production` |
| `PORT` | Server port (local development) | `3000` |

### CORS Configuration

Update the CORS origins in `index.js` to match your frontend domain:

```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-frontend.vercel.app']
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081']
```

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for specific origins
- **Input Validation**: Phone number normalization and validation
- **Error Handling**: Comprehensive error responses

## 📊 Monitoring

### Vercel Dashboard
- View function logs and performance
- Monitor API usage and errors
- Track deployment status

### Twilio Console
- Monitor call logs and recordings
- View usage and billing
- Check account status

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are configured

2. **CORS Errors**
   - Update CORS origins in `index.js`
   - Redeploy after making changes

3. **Twilio Authentication Errors**
   - Verify credentials in environment variables
   - Check Twilio Console for account status

4. **Function Timeout**
   - Vercel functions timeout after 30 seconds
   - Use webhooks for long-running operations

### Debugging

```bash
# View Vercel function logs
vercel logs your-project.vercel.app

# View real-time logs
vercel logs your-project.vercel.app --follow
```

## 🔄 Integration with Frontend

The frontend automatically detects when the backend API is available:

- **Local Development**: Uses `http://localhost:3000`
- **Production**: Uses your Vercel deployment URL
- **Demo Mode**: Falls back to simulated calls if backend unavailable

Update the frontend API URL in `src/services/twilioService.ts`:

```typescript
// Replace 'your-project.vercel.app' with your actual Vercel URL
return 'https://your-project.vercel.app';
```

## 📞 Making Real Calls

Once deployed, the frontend will automatically switch from demo mode to real calls when:

1. Backend API is deployed and accessible
2. Environment variables are properly configured
3. Twilio account has sufficient balance
4. Phone numbers are valid and reachable

The UI will show "Real Calls: Connected to backend API" when everything is working correctly.

## 🎯 Next Steps

1. Deploy the API to Vercel
2. Update frontend with your Vercel URL
3. Test with real phone numbers
4. Monitor usage in Twilio Console
5. Customize TwiML for your workflow needs
