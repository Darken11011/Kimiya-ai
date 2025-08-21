# 🚨 Backend Troubleshooting Guide

## **Issue: 500 Internal Server Error on /api/make-call**

Your Render backend at `https://kimiyi-ai.onrender.com/api/make-call` is returning a 500 error. Here's how to fix it:

## 🔍 **Step 1: Run Diagnostics**

```bash
cd call-flow-weaver
node debug-backend.js
```

This will test your backend and show you exactly what's wrong.

## 🛠️ **Step 2: Most Likely Fixes**

### **Fix A: Missing Environment Variables (Most Common)**

1. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Find your "kimiyi-ai" service
   - Click on it

2. **Go to Environment Tab**:
   - Click "Environment" in the left sidebar
   - Add these environment variables:

```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here  
TWILIO_PHONE_NUMBER=+1234567890
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
NODE_ENV=production
```

3. **Save and Redeploy**:
   - Click "Save Changes"
   - Your service will automatically redeploy

### **Fix B: Check Render Logs**

1. **View Logs**:
   - In your Render dashboard → Your service → "Logs" tab
   - Look for error messages around the time you made the call

2. **Common Error Messages**:
   - `Missing environment variables` → Use Fix A above
   - `Authentication failed` → Check your Twilio credentials
   - `Invalid phone number` → Verify phone number format
   - `Insufficient funds` → Add credits to your Twilio account

### **Fix C: Restart Service**

1. **Manual Deploy**:
   - Go to your Render service
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

## 🧪 **Step 3: Test the Fix**

### **Test 1: Check Health**
```bash
curl https://kimiyi-ai.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "environment": {
    "hasTwilioSid": true,
    "hasTwilioToken": true,
    "hasTwilioPhone": true
  }
}
```

### **Test 2: Test Call Endpoint**
```bash
curl -X POST https://kimiyi-ai.onrender.com/api/make-call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "twilioAccountSid": "your_sid",
    "twilioAuthToken": "your_token"
  }'
```

## 🎯 **Step 4: Update Frontend (If Needed)**

If your backend URL changed, update it in the frontend:

```typescript
// In call-flow-weaver/src/services/twilioService.ts
private getApiBaseUrl(): string {
  return 'https://kimiyi-ai.onrender.com'; // Make sure this matches your Render URL
}
```

## 🔧 **Common Issues & Solutions**

### **Issue: "Authentication failed"**
- **Cause**: Wrong Twilio credentials
- **Fix**: Double-check your Account SID and Auth Token in Twilio Console

### **Issue: "Invalid phone number"**
- **Cause**: Phone number format is wrong
- **Fix**: Use E.164 format: `+1234567890`

### **Issue: "Insufficient funds"**
- **Cause**: No credits in Twilio account
- **Fix**: Add credits to your Twilio account

### **Issue: "Service unavailable"**
- **Cause**: Render service is sleeping (free tier)
- **Fix**: The service will wake up automatically, or upgrade to paid tier

### **Issue: "CORS errors"**
- **Cause**: Frontend can't connect to backend
- **Fix**: Check that CORS is enabled in your backend

## 🚀 **Step 5: Verify Everything Works**

1. **Open your app**: http://localhost:8080
2. **Create a new workflow**
3. **Try making a call**
4. **Check that you get a success message instead of 500 error**

## 📊 **Monitoring Your Backend**

### **Health Check URLs**:
- **Health**: https://kimiyi-ai.onrender.com/health
- **Ping**: https://kimiyi-ai.onrender.com/ping
- **Root**: https://kimiyi-ai.onrender.com/

### **Render Dashboard**:
- **Logs**: Monitor real-time logs
- **Metrics**: Check CPU/Memory usage
- **Events**: See deployment history

## 🆘 **If Nothing Works**

### **Option 1: Redeploy from Scratch**
1. Go to Render dashboard
2. Delete your current service
3. Create a new service from your GitHub repo
4. Add all environment variables
5. Deploy

### **Option 2: Use Local Backend**
```bash
# In call-flow-weaver/backend directory
npm install
npm start
```

Then update frontend to use `http://localhost:3000` instead of Render URL.

### **Option 3: Check GitHub Repository**
Make sure your latest backend code is pushed to GitHub:
```bash
git add .
git commit -m "Fix backend issues"
git push origin main
```

## ✅ **Success Indicators**

You'll know it's fixed when:
- ✅ Health check returns `"status": "healthy"`
- ✅ No warnings about missing environment variables
- ✅ Call endpoint returns success instead of 500 error
- ✅ You can make actual phone calls from the frontend

## 📞 **Need More Help?**

1. **Run the diagnostic**: `node debug-backend.js`
2. **Check Render logs** for specific error messages
3. **Verify Twilio credentials** in Twilio Console
4. **Test with a simple curl command** first

The most common cause is missing environment variables on Render. Fix that first! 🎯
