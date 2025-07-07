# Deploying Call Flow Weaver Backend to Render

This guide will help you deploy the Express.js backend to Render for reliable Twilio integration.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

Make sure your backend code is committed to your Git repository:

```bash
git add .
git commit -m "Add Express backend for Render deployment"
git push origin main
```

### 2. Create Render Web Service

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   | Setting | Value |
   |---------|-------|
   | **Name** | `call-flow-weaver-backend` |
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` (or paid for production) |

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

```bash
TWILIO_ACCOUNT_SID=AC64208c7087a03b475ea7fa9337b692f8
TWILIO_AUTH_TOKEN=587e27a4553570edb09656c15a03d0e8
TWILIO_PHONE_NUMBER=+17077433838
NODE_ENV=production
```

### 4. Deploy and Test

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-3 minutes)
3. **Your backend will be available at:** `https://call-flow-weaver-backend.onrender.com`

### 5. Test Your Deployment

Test these endpoints:

```bash
# Health check
curl https://call-flow-weaver-backend.onrender.com/health

# Environment test
curl https://call-flow-weaver-backend.onrender.com/api/test

# Twilio config
curl https://call-flow-weaver-backend.onrender.com/api/twilio-config
```

### 6. Update Frontend Configuration

The frontend is already configured to use the Render backend URL:
- **Production:** `https://call-flow-weaver-backend.onrender.com`
- **Local Development:** `http://localhost:3001`

## 🔧 Local Development

To run the backend locally:

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

Your deployed backend will have these endpoints:

### Core
- `GET /health` - Health check
- `GET /api/test` - Debug info

### Twilio
- `POST /api/make-call` - Make calls
- `GET /api/call-status?callSid=<sid>` - Get call status
- `POST /api/end-call?callSid=<sid>` - End calls
- `GET /api/twilio-config` - Get config

### TwiML
- `POST /api/twiml/default` - Default response
- `POST /api/twiml/workflow/:id` - Workflow response
- `POST /api/twiml/process/:id` - Process speech

## 🔍 Troubleshooting

### Check Deployment Logs
1. Go to your Render service dashboard
2. Click on "Logs" tab
3. Look for any error messages

### Common Issues

**Environment Variables Missing:**
```bash
curl https://call-flow-weaver-backend.onrender.com/api/test
# Should show hasAccountSid: true, hasAuthToken: true
```

**CORS Issues:**
- Make sure your frontend domain is in the CORS configuration
- Check browser console for CORS errors

**Twilio Errors:**
- Verify credentials in Render environment variables
- Check Twilio console for call logs

## 🎯 Next Steps

1. **Deploy the backend to Render** ✅
2. **Test all endpoints** ✅
3. **Deploy frontend to Vercel** (already done)
4. **Test end-to-end call flow**

Your architecture will be:
- **Frontend:** Vercel (`https://kimiya-ai.vercel.app`)
- **Backend:** Render (`https://call-flow-weaver-backend.onrender.com`)
- **Twilio:** Handles voice calls and TwiML

This separation gives you:
- ✅ Reliable Twilio integration
- ✅ Better error handling and logging
- ✅ Scalable backend infrastructure
- ✅ Easy debugging and monitoring
