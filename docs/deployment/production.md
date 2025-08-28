# Production Deployment Guide

Complete guide for deploying Call Flow Weaver to production using Vercel (frontend) and Render (backend).

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │    Render       │    │   Twilio        │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Voice)       │
│                 │    │                 │    │                 │
│ • React SPA     │    │ • Node.js API   │    │ • Voice Calls   │
│ • Static Assets │    │ • WebSocket     │    │ • Webhooks      │
│ • CDN Delivery  │    │ • Environment   │    │ • TwiML        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Frontend Deployment (Vercel)

### 1. Prepare Frontend

```bash
cd call-flow-weaver
npm run build
```

### 2. Vercel Configuration

**vercel.json:**
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Environment Variables

Set in Vercel Dashboard with `VITE_` prefix:

```bash
VITE_AZURE_OPENAI_API_KEY=f6d564a83af3498c9beb46d7d3e3da96
VITE_AZURE_OPENAI_ENDPOINT=https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview
VITE_BACKEND_URL=https://kimiyi-ai.onrender.com
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Current Production URL:** `https://kimiya-ai.vercel.app`

## 🖥️ Backend Deployment (Render)

### 1. Prepare Backend

```bash
cd call-flow-weaver/backend
npm install
```

### 2. Render Configuration

**render.yaml** (reference only):
```yaml
services:
  - type: web
    name: call-flow-weaver-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
```

### 3. Environment Variables

Set in Render Dashboard:

```bash
NODE_ENV=production
PORT=10000
TWILIO_ACCOUNT_SID=AC64208c7087a03b475ea7fa9337b692f8
TWILIO_AUTH_TOKEN=your_actual_32_char_auth_token_here
TWILIO_PHONE_NUMBER=+17077433838
AZURE_OPENAI_API_KEY=f6d564a83af3498c9beb46d7d3e3da96
AZURE_OPENAI_ENDPOINT=https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview
```

### 4. Deploy to Render

1. Connect GitHub repository
2. Select `backend` directory as root
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables
6. Deploy

**Current Production URL:** `https://kimiyi-ai.onrender.com`

## 🔧 Configuration Management

### Environment Priority

1. **Production**: Platform environment variables
2. **Development**: `.env` files
3. **Fallback**: UI configuration inputs
4. **Default**: Hardcoded demo values

### Frontend Environment (Vite)

```bash
# Development (.env)
VITE_AZURE_OPENAI_API_KEY=your_key
VITE_BACKEND_URL=http://localhost:3000

# Production (Vercel Dashboard)
VITE_AZURE_OPENAI_API_KEY=your_key
VITE_BACKEND_URL=https://kimiyi-ai.onrender.com
```

### Backend Environment

```bash
# Development (.env)
AZURE_OPENAI_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid

# Production (Render Dashboard)
AZURE_OPENAI_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
```

## 🔒 Security Configuration

### CORS Setup

```javascript
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'https://kimiya-ai.vercel.app',
    'https://kimiyi-ai.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### API Security

- Rate limiting enabled
- CORS properly configured
- Environment variables secured
- No sensitive data in frontend

## 📞 Twilio Configuration

### Webhook URLs

Set in Twilio Console:

```bash
# Voice webhook
https://kimiyi-ai.onrender.com/api/twiml

# Status callback
https://kimiyi-ai.onrender.com/api/status

# ConversationRelay WebSocket
wss://kimiyi-ai.onrender.com/conversationrelay
```

### Phone Number Configuration

```bash
# Voice URL
https://kimiyi-ai.onrender.com/api/twiml

# HTTP Method: POST
# Status Callback: https://kimiyi-ai.onrender.com/api/status
```

## 🔍 Health Monitoring

### Health Check Endpoints

```bash
# Backend health
GET https://kimiyi-ai.onrender.com/health

# Frontend health
GET https://kimiya-ai.vercel.app/

# WebSocket health
WSS wss://kimiyi-ai.onrender.com/conversationrelay
```

### Monitoring Setup

1. **Render Monitoring**: Built-in service monitoring
2. **Vercel Analytics**: Performance and usage metrics
3. **Twilio Console**: Call logs and webhook monitoring
4. **Custom Health Checks**: Application-specific monitoring

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] All environment variables configured
- [ ] CORS settings updated for production domains
- [ ] Twilio webhooks pointing to production URLs
- [ ] SSL certificates valid
- [ ] Database connections tested (if applicable)

### Frontend Deployment

- [ ] Build successful (`npm run build`)
- [ ] Environment variables set in Vercel
- [ ] Domain configured
- [ ] CDN caching configured
- [ ] Analytics enabled

### Backend Deployment

- [ ] Dependencies installed
- [ ] Environment variables set in Render
- [ ] Health endpoint responding
- [ ] WebSocket connections working
- [ ] Twilio integration tested

### Post-deployment

- [ ] End-to-end testing completed
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Backup procedures in place
- [ ] Documentation updated

## 🔧 Troubleshooting Deployment

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Review build logs for errors

2. **Environment Variable Issues**
   - Verify variable names and values
   - Check for typos or extra spaces
   - Ensure proper prefixes (VITE_ for frontend)

3. **CORS Errors**
   - Update allowed origins
   - Check domain spelling
   - Verify protocol (http vs https)

4. **Webhook Failures**
   - Ensure URLs are publicly accessible
   - Check SSL certificate validity
   - Verify HTTP methods match Twilio requirements

### Debug Commands

```bash
# Test production backend
curl https://kimiyi-ai.onrender.com/health

# Test WebSocket connection
wscat -c wss://kimiyi-ai.onrender.com/conversationrelay

# Test Twilio webhook
curl -X POST https://kimiyi-ai.onrender.com/api/twiml
```

## 📊 Performance Optimization

### Frontend Optimization

- Static asset optimization
- CDN configuration
- Bundle size optimization
- Lazy loading implementation

### Backend Optimization

- Connection pooling
- Response caching
- Compression enabled
- Performance monitoring

### Network Optimization

- HTTP/2 enabled
- Gzip compression
- Keep-alive connections
- DNS prefetching

This deployment setup provides a robust, scalable foundation for running Call Flow Weaver in production with high availability and performance.
