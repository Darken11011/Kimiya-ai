
# Kimiyi Call Flow Builder

A powerful visual workflow builder for creating voice agent conversation flows, specifically designed for real-time call conversations via Twilio. Build sophisticated voice agents with conditional logic, AI-powered conversations, and seamless service integrations.

## ✨ Features

### 🎨 **Visual Flow Builder**
- Drag-and-drop interface for creating conversation flows
- Real-time visual feedback and validation
- Conditional edge routing with AI-based and logical conditions
- Variable extraction and management system

### 📞 **Real-time Call Integration**
- Built specifically for Twilio voice calls
- Comprehensive service configuration on workflow creation
- Support for call recording, timeouts, and webhooks

### 🤖 **AI-Powered Conversations**
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- Configurable system prompts and model parameters

### 🔊 **Voice & Speech Services**
- **Voice Synthesis**: ElevenLabs, Azure Speech, Google Cloud TTS
- **Speech Recognition**: Deepgram, AssemblyAI, OpenAI Whisper
- Popular voice selections and quality settings

### 🧠 **Smart Conditional Logic**
- AI-based conditions (natural language)
- Logical conditions (variable comparisons)
- Combined conditions (mixed logic)
- Variable extraction from conversations

### 💾 **Workflow Management**
- Complete import/export functionality
- Secure API key storage and management
- Workflow templates and sharing
- Version control and backup support

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repository-url>
cd call-flow-weaver
npm install
```

### 2. Development
```bash
npm run dev
```
Navigate to `http://localhost:5173`

### 3. Production Build
```bash
npm run build
```

## 📋 Creating Your First Workflow

### Step 1: Initialize Workflow
1. Click **"New Workflow"** in the toolbar
2. Enter workflow name and description

### Step 2: Configure Services
**Twilio Configuration:**
- Account SID (ACxxxxxxxx...)
- Auth Token
- Phone Number (+1234567890)
- Optional webhook URL

**AI Model Setup:**
- Choose provider (OpenAI/Anthropic)
- Enter API key
- Select model and parameters

**Voice & Speech:**
- Voice provider and API key
- Voice selection from popular options
- Transcription provider and settings

**Global Settings:**
- Call duration limits
- Silence timeouts
- Feature toggles

### Step 3: Build Your Flow
1. **Drag components** from sidebar to canvas
2. **Connect nodes** to create conversation paths
3. **Add conditions** to edges for smart routing
4. **Extract variables** from conversation nodes
5. **Test and validate** your workflow

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **React Flow** for visual flow building
- **Zustand** for state management
- **Tailwind CSS** + **shadcn/ui** for styling
- **Vite** for development and building

### Core Systems
- **Flow Builder**: Visual workflow editor with drag-and-drop
- **Node System**: Modular conversation components
- **Conditional Edges**: Smart routing with multiple condition types
- **Configuration Management**: Comprehensive service setup
- **Variable System**: Extract and use data throughout flows
- **Validation Engine**: Real-time flow and configuration validation

## 📁 Project Structure

```
src/
├── components/
│   ├── FlowBuilder/           # Main flow builder interface
│   │   ├── components/        # Flow-specific components
│   │   │   ├── nodes/         # Node type definitions and components
│   │   │   ├── BaseNode.tsx   # Base node wrapper component
│   │   │   ├── DynamicNode.tsx # Dynamic node renderer
│   │   │   ├── ConditionalEdge.tsx
│   │   │   ├── EdgeConditionModal.tsx
│   │   │   ├── PlaygroundModal.tsx # Workflow testing interface
│   │   │   ├── WorkflowSetupModal.tsx
│   │   │   └── VariableExtractor.tsx
│   │   ├── hooks/             # Custom hooks for flow management
│   │   ├── NewFlowCanvas.tsx  # Main canvas component
│   │   ├── NewFlowEditor.tsx  # Editor container
│   │   ├── NewSidebar.tsx     # Component sidebar
│   │   ├── FlowToolbar.tsx    # Toolbar with actions
│   │   └── ConfigPanel.tsx    # Node configuration
│   └── ui/                    # Reusable UI components
├── stores/
│   └── flowStore.ts           # Zustand state management
├── types/
│   ├── flowTypes.ts           # Flow and condition types
│   ├── workflowConfig.ts      # Service configuration types
│   └── componentTypes.ts      # Component definitions
├── utils/
│   ├── flowValidation.ts      # Flow validation logic
│   └── configValidation.ts    # Configuration validation
└── lib/
    └── componentRegistry.ts   # Component registration system
```

## 🔧 Supported Services

### AI Models
| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | Temperature, max tokens, system prompts |
| **Anthropic** | Claude 3 Opus, Sonnet, Haiku | Advanced reasoning, large context |

### Voice Synthesis
| Provider | Features | Quality |
|----------|----------|---------|
| **ElevenLabs** | AI voices, emotion control | Premium |
| **Azure Speech** | Neural voices, SSML | High |
| **Google Cloud** | WaveNet, multiple languages | High |

### Speech Recognition
| Provider | Features | Use Case |
|----------|----------|----------|
| **Deepgram** | Real-time, low latency | Live calls |
| **AssemblyAI** | Advanced features, sentiment | Analysis |
| **Whisper** | High accuracy, multilingual | Quality |

## 📚 Documentation

- **[Conditional Edges](./CONDITIONAL_EDGES.md)** - Complete guide to conditional logic
- **[Workflow Setup](./WORKFLOW_SETUP.md)** - Service configuration and API keys
- **[Import/Export](./IMPORT_EXPORT.md)** - Backup, sharing, and migration

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Technologies
- **React Flow**: Visual programming interface
- **Zustand**: Lightweight state management
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern component library

### Component Development
1. Create component in `src/components/FlowBuilder/components/nodes/`
2. Define TypeScript interfaces
3. Register in component registry
4. Add to node types in canvas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components when possible
- Add proper error handling and validation
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Documentation**: Check the docs folder for detailed guides
- **Community**: Join our discussions for help and ideas

---

**Built with ❤️ for creating amazing voice agent experiences**

## License

MIT
