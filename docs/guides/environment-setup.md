# Environment Setup Guide

Complete guide for configuring your Call Flow Weaver development and production environment.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

#### Option A: Interactive Setup (Recommended)
```bash
npm run setup-env
```

#### Option B: Manual Setup
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

## 🔑 Environment Variables

### Required Variables

#### Azure OpenAI Configuration
```bash
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview
```

#### Twilio Configuration
```bash
TWILIO_ACCOUNT_SID=AC64208c7087a03b475ea7fa9337b692f8
TWILIO_AUTH_TOKEN=your_actual_32_char_auth_token_here
TWILIO_PHONE_NUMBER=+17077433838
```

### Optional Variables

#### Performance Optimization
```bash
PERFORMANCE_TARGET_LATENCY=300
PERFORMANCE_MAX_LATENCY=500
PERFORMANCE_CACHE_ENABLED=true
PERFORMANCE_LANGUAGE_OPTIMIZATION=true
PERFORMANCE_FAILOVER_ENABLED=true
```

#### Additional AI Services
```bash
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

#### Speech Services
```bash
AZURE_SPEECH_API_KEY=your_azure_speech_api_key_here
AZURE_SPEECH_REGION=eastus
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
```

## 🏗️ Environment Priority

The application follows this priority order for configuration:

1. **Production (Render)**: Environment variables from Render dashboard
2. **Development**: `.env` file variables
3. **Fallback**: UI input fields in the application
4. **Default**: Hardcoded demo values

## 🔧 Frontend Environment (Vite)

For frontend environment variables, prefix with `VITE_`:

```bash
VITE_AZURE_OPENAI_API_KEY=your_key_here
VITE_TWILIO_ACCOUNT_SID=your_sid_here
```

## 🖥️ Backend Environment

Backend uses standard environment variables:

```bash
NODE_ENV=production
PORT=3000
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+17077433838
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
```

## 🧪 Testing Your Configuration

### 1. Environment Validation
```bash
npm run dev
```
Check the console for configuration status messages.

### 2. Backend Health Check
```bash
curl http://localhost:3000/health
```

### 3. Twilio Connection Test
```bash
node test-twilio-auth.js
```

## 🚀 Production Deployment

### Vercel (Frontend)
Set environment variables in Vercel dashboard with `VITE_` prefix.

### Render (Backend)
Set environment variables in Render dashboard:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`

## 🔒 Security Best Practices

### 1. API Key Management
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate keys regularly

### 2. Environment Files
- Add `.env` to `.gitignore`
- Keep `.env.example` updated with required variables
- Use different keys for development and production

### 3. Access Control
- Limit API key permissions to minimum required
- Use separate Twilio accounts for dev/prod
- Monitor API usage and set up alerts

## 🛠️ Development vs Production

### Development
- Uses `.env` file for configuration
- Allows demo/placeholder values
- Includes debug logging
- CORS allows localhost origins

### Production
- Uses platform environment variables
- Requires all production API keys
- Minimal logging
- CORS restricted to production domains

## 🆘 Troubleshooting

### Common Issues

#### "Environment variables not found"
- Check `.env` file exists and has correct format
- Verify variable names match exactly
- Ensure no extra spaces or quotes

#### "Twilio authentication failed"
- Verify Account SID and Auth Token are correct
- Check phone number format (+1234567890)
- Ensure tokens haven't expired

#### "Azure OpenAI connection failed"
- Verify API key is valid and active
- Check endpoint URL format
- Ensure deployment name matches

### Debug Commands
```bash
# Check environment loading
node -e "console.log(process.env)"

# Test Twilio credentials
node backend/test-twilio-auth.js

# Validate configuration
npm run setup-env
```

## 📝 Configuration Validation

The application includes built-in validation:

- ✅ Required variables present
- ✅ Correct format validation
- ✅ API connectivity tests
- ✅ Performance settings validation

Check the console output for validation results and recommendations.
