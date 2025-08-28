# System Architecture Overview

Call Flow Weaver is a sophisticated voice agent workflow builder with real-time Twilio integration, built on a modern React/Node.js stack.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  External APIs  │
│   (Vercel)      │◄──►│   (Render)      │◄──►│                 │
│                 │    │                 │    │  • Twilio       │
│  • React 18     │    │  • Node.js      │    │  • Azure OpenAI │
│  • TypeScript   │    │  • Express      │    │  • ElevenLabs   │
│  • React Flow   │    │  • WebSocket    │    │  • Deepgram     │
│  • Zustand      │    │  • TwiML        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Core Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **React Flow** for visual workflow building
- **Zustand** for lightweight state management
- **Tailwind CSS + shadcn/ui** for modern UI
- **Vite** for fast development and building

### Backend Architecture
- **Node.js + Express** for REST API
- **WebSocket** for real-time call handling
- **ConversationRelay** service for dynamic call processing
- **Performance Orchestrator** for latency optimization
- **TwiML generation** for Twilio call control

### External Integrations
- **Twilio** for voice calls and telephony
- **Azure OpenAI** for AI conversations
- **ElevenLabs** for voice synthesis (optional)
- **Deepgram** for speech recognition (optional)

## 🔄 Data Flow

### 1. Workflow Creation
```
User → Flow Builder → Zustand Store → Local Storage
                                   → Backend API (save)
```

### 2. Call Execution
```
Twilio Webhook → Backend → ConversationRelay → Azure OpenAI
                      ↓
              Performance Monitor → Response → TwiML → Twilio
```

### 3. Playground Testing
```
Frontend → Chat Mode → Azure OpenAI → Response
        → Call Mode → Backend → Twilio → Voice Call
```

## 🏛️ Service Architecture

### Frontend Services
- **Flow Store**: Workflow state management
- **API Service**: Backend communication
- **Twilio Service**: Call management
- **Performance Monitor**: Client-side metrics

### Backend Services
- **Conversation Relay**: Core call processing
- **Performance Orchestrator**: Latency optimization
- **Language Optimizer**: Multi-language support
- **Predictive Cache**: Response caching
- **Streaming Audio Processor**: Real-time audio

## 🔌 API Architecture

### REST Endpoints
```
GET  /health                    - Health check
POST /api/make-call            - Initiate calls
POST /api/chat                 - Chat conversations
GET  /api/twilio-config        - Configuration
POST /api/twiml                - TwiML generation
```

### WebSocket Endpoints
```
/conversationrelay             - Real-time call handling
/performance-monitor           - Performance metrics
```

## 🗄️ Data Architecture

### Frontend State (Zustand)
```typescript
interface FlowStore {
  nodes: Node[]
  edges: ConditionalEdge[]
  selectedNode: string | null
  workflowConfig: WorkflowConfig | null
}
```

### Backend Data Flow
```typescript
interface CallSession {
  callSid: string
  workflowData: WorkflowData
  currentNode: string
  variables: Map<string, any>
  performance: PerformanceMetrics
}
```

## 🚀 Deployment Architecture

### Production Setup
```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │    Render       │
│                 │    │                 │
│  Frontend SPA   │◄──►│  Backend API    │
│  Static Assets  │    │  WebSocket      │
│  CDN Delivery   │    │  Environment    │
└─────────────────┘    └─────────────────┘
```

### Environment Configuration
- **Development**: Local `.env` files
- **Production**: Platform environment variables
- **Fallback**: UI configuration inputs

## 🔄 Real-time Communication

### WebSocket Architecture
```
Frontend ◄──► Backend ◄──► Twilio
    │             │
    └─── Chat ────┘
    └─── Call Status ──┘
    └─── Performance ──┘
```

### Call Flow Processing
1. **Incoming Call** → Twilio webhook
2. **Workflow Lookup** → Backend processes
3. **Node Execution** → AI/API calls
4. **Response Generation** → TwiML creation
5. **Call Control** → Twilio execution

## ⚡ Performance Architecture

### Optimization Layers
1. **Frontend**: Component memoization, lazy loading
2. **Backend**: Caching, connection pooling
3. **Network**: CDN, compression, HTTP/2
4. **AI Services**: Predictive caching, failover

### Monitoring & Analytics
- **Performance Orchestrator**: Latency tracking
- **Call Analytics**: Success rates, duration
- **Error Tracking**: Comprehensive logging
- **Health Checks**: Service availability

## 🔒 Security Architecture

### Authentication & Authorization
- API key management
- Environment variable security
- CORS configuration
- Rate limiting

### Data Protection
- No sensitive data in frontend
- Encrypted API communications
- Secure webhook endpoints
- Token rotation support

## 🧩 Extensibility

### Plugin Architecture
- **Node Types**: Extensible component system
- **AI Models**: Multiple provider support
- **Voice Services**: Pluggable TTS/STT
- **Integrations**: Webhook-based extensions

### Configuration System
- **Environment-based**: Development/production
- **Runtime**: UI-based configuration
- **Validation**: Built-in config validation
- **Fallbacks**: Graceful degradation

This architecture provides a scalable, maintainable foundation for building sophisticated voice agent workflows with real-time performance optimization.
