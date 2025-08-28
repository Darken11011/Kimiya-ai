# 🚀 Quick Start Guide

Get Call Flow Weaver up and running in just a few minutes!

## Prerequisites

- Node.js 16+ installed
- Git installed
- Twilio account (for voice calls)
- Azure OpenAI account (for AI conversations)

## 🏃‍♂️ Quick Setup (3 Steps)

### 1. Clone and Install

```bash
git clone <repository-url>
cd call-flow-weaver
npm install
```

### 2. Environment Setup (Optional)

The app works with demo values, but for real functionality:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual API keys
# nano .env  # or use your preferred editor
```

**Required for production:**
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Start Development Server

```bash
npm run dev
```

**🎉 That's it! Open http://localhost:8080 in your browser**

## 🎯 First Steps

### 1. Access the Dashboard
- Navigate to `http://localhost:8080`
- You'll see the main dashboard with workflow management

### 2. Create Your First Flow
- Click "Create New Workflow" or go to `/builder`
- Drag nodes from the sidebar to the canvas
- Connect nodes to create conversation paths

### 3. Test in Playground
- Click the "Playground" button in the top-right corner
- Test your flow with chat mode (no setup required)
- Test with call mode (requires Twilio configuration)

## 🔧 Backend Setup (For Real Calls)

### Local Backend
```bash
cd backend
npm install
npm start
```

### Production Backend
The backend is deployed on Render at: `https://kimiyi-ai.onrender.com`

## 🎨 Basic Flow Building

### Available Node Types
- **Start Node**: Entry point for calls
- **Conversation Node**: AI-powered conversations
- **API Request Node**: External API calls
- **Transfer Call Node**: Transfer to another number
- **Tool Node**: Execute custom tools
- **End Call Node**: Terminate the call

### Connecting Nodes
1. Click and drag from a node's output handle
2. Connect to another node's input handle
3. Add conditions to edges for smart routing

## 🎮 Playground Features

### Chat Mode
- Test workflows with text-based conversations
- Uses Azure OpenAI for responses
- No additional setup required

### Call Mode
- Make real voice calls through Twilio
- Requires Twilio configuration
- Follows your workflow dynamically

## 🚀 Next Steps

1. **[Environment Setup](./environment-setup.md)** - Complete configuration guide
2. **[Flow Builder Tutorial](./flow-builder.md)** - Detailed flow building guide
3. **[Node Types Reference](./node-types.md)** - Complete node documentation
4. **[Deployment Guide](../deployment/production.md)** - Deploy to production

## 🆘 Common Issues

### "Process is not defined" Error
✅ **Fixed!** The app now uses browser-compatible environment variable access.

### Backend Connection Issues
- Check if backend is running on correct port
- Verify CORS settings allow your frontend domain
- Check network connectivity

### Twilio Call Issues
- Verify Twilio credentials are correct
- Check phone number format (+1234567890)
- Ensure webhook URLs are accessible

## 📞 Support

Need help? Check the [Troubleshooting Guide](../troubleshooting/common-issues.md) or review the [Common Issues](../troubleshooting/common-issues.md) section.
