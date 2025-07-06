# Vercel Deployment Guide for Call Flow Weaver API

This guide will help you deploy the Twilio backend API to Vercel for production use.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Twilio Account**: Your Twilio credentials (already configured)
4. **Git Repository**: Your code should be in a Git repository

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
cd call-flow-weaver/api
npm install
```

### 2. Test Locally

```bash
# Start the development server
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/health
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# From the project root (call-flow-weaver/)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: call-flow-weaver-api
# - Directory: ./
# - Override settings? N
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project settings (see below)

### 4. Configure Environment Variables

In Vercel Dashboard or CLI, set these environment variables:

```bash
# Using Vercel CLI
vercel env add TWILIO_ACCOUNT_SID
# Enter: AC64208c7087a03b475ea7fa9337b692f8

vercel env add TWILIO_AUTH_TOKEN
# Enter: 587e27a4553570edb09656c15a03d0e8

vercel env add TWILIO_PHONE_NUMBER
# Enter: +17077433838

vercel env add NODE_ENV
# Enter: production
```

Or in Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production environment

### 5. Update CORS Origins

After deployment, update the CORS configuration in `api/index.js`:

```javascript
// Replace this line:
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-frontend-domain.vercel.app', 'https://your-custom-domain.com']
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],

// With your actual frontend URL:
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-actual-frontend.vercel.app']
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],
```

### 6. Redeploy

```bash
vercel --prod
```

## 🔗 API Endpoints

After deployment, your API will be available at:
- `https://your-project.vercel.app/api/health`
- `https://your-project.vercel.app/api/make-call`
- `https://your-project.vercel.app/api/call-status/:callSid`
- `https://your-project.vercel.app/api/end-call/:callSid`
- `https://your-project.vercel.app/api/twiml/default`

## 🔧 Frontend Integration

Update your frontend TwilioService to use the deployed API:

```typescript
// In src/services/twilioService.ts
private async makeRealCall(normalizedNumber: string, options: CallOptions): Promise<CallResponse> {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-project.vercel.app'
    : 'http://localhost:3000';

  const response = await fetch(`${API_BASE_URL}/api/make-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: normalizedNumber,
      from: options.from,
      record: options.record,
      timeout: options.timeout
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
```

## 🧪 Testing the Deployment

### 1. Health Check
```bash
curl https://your-project.vercel.app/api/health
```

### 2. Make a Test Call
```bash
curl -X POST https://your-project.vercel.app/api/make-call \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890"}'
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **CORS**: Update CORS origins to match your frontend domain
3. **Rate Limiting**: The API includes rate limiting (100 requests per 15 minutes)
4. **Helmet**: Security headers are automatically added
5. **Input Validation**: All inputs are validated before processing

## 📊 Monitoring

### Vercel Analytics
- View function logs in Vercel Dashboard
- Monitor function execution time and errors
- Track API usage and performance

### Twilio Console
- Monitor call logs and status
- View call recordings and transcriptions
- Track usage and billing

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure all required variables are set for Production

2. **CORS Errors**
   - Update the CORS origins in `api/index.js`
   - Redeploy after making changes

3. **Twilio Authentication Errors**
   - Verify Account SID and Auth Token in Vercel environment variables
   - Check Twilio Console for account status

4. **Function Timeout**
   - Vercel functions have a 30-second timeout (configured in vercel.json)
   - For longer calls, consider using webhooks for status updates

### Logs and Debugging

```bash
# View function logs
vercel logs your-project.vercel.app

# View real-time logs
vercel logs your-project.vercel.app --follow
```

## 🔄 Continuous Deployment

Connect your Git repository to Vercel for automatic deployments:

1. In Vercel Dashboard, go to your project
2. Navigate to "Git" settings
3. Connect your GitHub/GitLab repository
4. Enable automatic deployments on push

Now every push to your main branch will automatically deploy to production!

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Twilio Console for call status
3. Test API endpoints individually
4. Review environment variable configuration
