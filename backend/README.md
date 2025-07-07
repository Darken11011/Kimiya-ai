# Call Flow Weaver Backend

Express.js backend for Call Flow Weaver with Twilio integration, designed for deployment on Render.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the server:**
   - Health check: http://localhost:3001/health
   - Test endpoint: http://localhost:3001/api/test

### Production Deployment on Render

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Set the root directory to `backend`
   - Build command: `npm install`
   - Start command: `npm start`

2. **Set environment variables in Render dashboard:**
   ```
   TWILIO_ACCOUNT_SID=AC64208c7087a03b475ea7fa9337b692f8
   TWILIO_AUTH_TOKEN=587e27a4553570edb09656c15a03d0e8
   TWILIO_PHONE_NUMBER=+17077433838
   NODE_ENV=production
   PORT=10000
   ```

3. **Deploy and test:**
   - Your backend will be available at: `https://your-app-name.onrender.com`
   - Test endpoints:
     - `https://your-app-name.onrender.com/health`
     - `https://your-app-name.onrender.com/api/test`

## 📡 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/test` - Debug endpoint with environment info

### Twilio Integration
- `POST /api/make-call` - Initiate a Twilio call
- `GET /api/call-status?callSid=<sid>` - Get call status
- `POST /api/call-status` - Twilio status callback handler
- `POST /api/end-call?callSid=<sid>` - End an active call
- `GET /api/twilio-config` - Get Twilio configuration

### TwiML Responses
- `POST /api/twiml/default` - Default TwiML response
- `POST /api/twiml/workflow/:workflowId` - Workflow-specific TwiML
- `POST /api/twiml/process/:workflowId` - Process speech input

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `...` |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | `+1234567890` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |

### CORS Configuration

The server is configured to accept requests from:
- `https://kimiya-ai.vercel.app` (production frontend)
- `http://localhost:3000`, `http://localhost:5173` (development)

## 🧪 Testing

### Make a Test Call

```bash
curl -X POST https://your-app-name.onrender.com/api/make-call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "workflowId": "test-workflow"
  }'
```

### Check Call Status

```bash
curl "https://your-app-name.onrender.com/api/call-status?callSid=CA..."
```

## 🔍 Troubleshooting

1. **Check environment variables:**
   ```bash
   curl https://your-app-name.onrender.com/api/test
   ```

2. **Check Twilio credentials:**
   ```bash
   curl https://your-app-name.onrender.com/api/twilio-config
   ```

3. **Monitor logs:**
   - Check Render dashboard logs
   - All requests are logged with detailed information

## 🏗️ Architecture

```
backend/
├── server.js              # Main Express server
├── routes/
│   ├── make-call.js       # Call initiation
│   ├── call-status.js     # Call status management
│   ├── end-call.js        # Call termination
│   ├── twilio-config.js   # Configuration endpoint
│   └── twiml.js           # TwiML response handlers
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔐 Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Request logging
- Error handling middleware
