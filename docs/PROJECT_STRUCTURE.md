# Project Structure

Clean, organized structure of the Call Flow Weaver project after comprehensive cleanup.

## 📁 Current Project Structure

```
Kimiyi/
├── call-flow-weaver/           # Main application directory
│   ├── README.md              # Project overview with documentation links
│   ├── package.json           # Frontend dependencies and scripts
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vercel.json            # Vercel deployment configuration
│   ├── .gitignore             # Git ignore patterns (cleaned up)
│   │
│   ├── src/                   # Frontend source code
│   │   ├── components/        # React components
│   │   │   ├── FlowBuilder/   # Flow builder components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── pages/             # Route components
│   │   ├── services/          # API and service layers
│   │   ├── stores/            # Zustand state management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── hooks/             # Custom React hooks
│   │
│   ├── backend/               # Backend API server
│   │   ├── server.js          # Main Express server
│   │   ├── package.json       # Backend dependencies
│   │   ├── render.yaml        # Render deployment config (reference)
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Backend services
│   │   └── utils/             # Backend test and debug utilities
│   │
│   ├── docs/                  # Comprehensive documentation
│   │   ├── README.md          # Documentation index
│   │   ├── guides/            # User guides and tutorials
│   │   ├── architecture/      # Technical architecture docs
│   │   ├── deployment/        # Deployment guides
│   │   ├── performance/       # Performance optimization
│   │   ├── troubleshooting/   # Common issues and solutions
│   │   └── CLEANUP_SUMMARY.md # This cleanup summary
│   │
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (gitignored)
│   ├── node_modules/          # Dependencies (gitignored)
│   ├── samples/               # Sample workflow files
│   │   ├── ai_specialist_teacher.json
│   │   └── real_estate_property_dealer.json
│   ├── scripts/               # Setup and utility scripts
│   └── utils/                 # Development utilities
│       ├── test-twilio-auth.js
│       └── debug-backend.js
│
├── archive/                   # Archived legacy files
│   ├── src/                   # Old source code
│   ├── twilio/                # Legacy Twilio utilities
│   ├── analysis.txt           # Old analysis files
│   ├── doc.txt                # Legacy documentation
│   ├── kimiya-ai-mssql-schema.sql # Database schema
│   └── conversationRelayNode.7z  # Archived service
│
├── scripts/                   # Global utility scripts
│   └── setup-env.js           # Environment setup utility
│
└── conversationRelayNode/     # Legacy service (to be archived)
    ├── main.js                # Standalone service
    ├── package.json           # Service dependencies
    └── node_modules/          # Service dependencies
```

## 🎯 Key Directories Explained

### `/call-flow-weaver/` - Main Application
- **Primary development directory**
- Contains all active code and configuration
- Clean, organized structure for development

### `/call-flow-weaver/src/` - Frontend Source
- **React 18 + TypeScript application**
- Component-based architecture
- Modern development practices

### `/call-flow-weaver/backend/` - Backend API
- **Node.js + Express server**
- Twilio integration and WebSocket handling
- Deployed on Render

### `/call-flow-weaver/docs/` - Documentation
- **Comprehensive, organized documentation**
- Replaces 50+ scattered .md files
- Professional documentation structure

### `/archive/` - Legacy Files
- **Historical files and unused code**
- Safe storage for reference
- Keeps main project clean

## 🧹 Cleanup Results

### ✅ What Was Cleaned Up

1. **Documentation**: 50+ scattered .md files → 8 organized guides
2. **Sample Files**: Moved to dedicated `samples/` directory
3. **Legacy Files**: Archived old analysis, docs, and schema files
4. **Test Files**: Organized in `utils/` directories
5. **Git Ignore**: Cleaned up duplicates and added comprehensive patterns
6. **Project Structure**: Clear separation of concerns

### ✅ What Was Organized

1. **Frontend**: Clean React application structure
2. **Backend**: Organized API with proper service separation
3. **Documentation**: Professional docs with clear navigation
4. **Utilities**: Test and debug files in dedicated locations
5. **Samples**: Example workflows in organized directory

### 🔄 Remaining Manual Tasks

1. **Archive conversationRelayNode**: Move to archive when not in use
   ```bash
   mv conversationRelayNode archive/
   ```

2. **Environment Setup**: Create .env.example if needed
   ```bash
   cp .env .env.example  # Remove sensitive values
   ```

## 🚀 Development Workflow

### Getting Started
```bash
cd call-flow-weaver
npm install
npm run dev
```

### Backend Development
```bash
cd call-flow-weaver/backend
npm install
npm start
```

### Documentation
- All docs in `docs/` directory
- Start with `docs/README.md`
- Quick start: `docs/guides/quick-start.md`

### Testing
- Utilities in `utils/` directories
- Test Twilio: `node utils/test-twilio-auth.js`
- Debug backend: `node utils/debug-backend.js`

## 📊 Project Health

### ✅ Clean Structure
- No duplicate directories
- Organized file hierarchy
- Clear separation of concerns
- Professional documentation

### ✅ Developer Experience
- 5-minute quick start
- Comprehensive guides
- Clear troubleshooting
- Organized utilities

### ✅ Maintainability
- Single source of truth
- Consistent organization
- Easy navigation
- Future-proof structure

This clean, organized structure provides a solid foundation for continued development and easy onboarding of new team members.
