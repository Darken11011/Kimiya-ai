# Environment Setup Guide

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

### 3. Required Environment Variables

```bash
# Azure OpenAI Configuration (Required)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Test Your Configuration
```bash
npm run demo:performance
```

## 🔧 Configuration Details

### Azure OpenAI Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Create an Azure OpenAI resource
3. Deploy the `gpt-4o-mini` model
4. Get your API key and endpoint from the resource

### Twilio Setup
1. Sign up at [Twilio Console](https://console.twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Configure webhooks (optional)

### Performance Settings
```bash
# Optional: Performance Optimization Settings
PERFORMANCE_TARGET_LATENCY=300        # Target response time in ms
PERFORMANCE_MAX_LATENCY=500          # Maximum acceptable latency
PERFORMANCE_CACHE_ENABLED=true       # Enable predictive caching
PERFORMANCE_LANGUAGE_OPTIMIZATION=true  # Enable language optimizations
PERFORMANCE_FAILOVER_ENABLED=true    # Enable provider failover
```

## 🎯 Model Configuration

The system is configured to use **gpt-4o-mini** by default:
- **Model**: gpt-4o-mini
- **Provider**: Azure OpenAI
- **API Version**: 2024-02-15-preview
- **Deployment**: gpt-4o-mini

## 🔍 Validation

The system will automatically validate your configuration:
- ✅ Required environment variables are set
- ✅ API keys are valid format
- ✅ Phone numbers are in E.164 format
- ✅ Performance settings are within valid ranges

## 🚨 Troubleshooting

### Common Issues

1. **"Cannot find module '../utils/envConfig'"**
   - Make sure you're in the correct directory
   - Run `npm install` to ensure dependencies are installed

2. **"AZURE_OPENAI_API_KEY is required"**
   - Check your .env file exists
   - Verify the API key is set correctly
   - Ensure no extra spaces or quotes

3. **"TWILIO_PHONE_NUMBER must be in E.164 format"**
   - Format: +1234567890 (include country code)
   - No spaces, dashes, or parentheses

4. **Performance demo fails**
   - Check all required environment variables are set
   - Verify API keys are valid
   - Check network connectivity

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your .env file matches the .env.example format
3. Test individual API connections
4. Check the validation output from the setup script

## 📊 Performance Targets

With proper configuration, you should achieve:
- **Target Latency**: 300ms average response time
- **Cache Hit Rate**: 40%+ for repeated queries
- **Error Rate**: <5% under normal conditions
- **Language Support**: 50+ languages with Cantonese optimization

## 🎉 Next Steps

Once your environment is configured:
1. Run the performance demo: `npm run demo:performance`
2. Start the development server: `npm run dev`
3. Test the Flow Builder interface
4. Configure your first workflow
5. Test voice calls with Twilio integration

## 🔐 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- Use environment-specific configurations for different deployments
- Monitor API usage and set up billing alerts
