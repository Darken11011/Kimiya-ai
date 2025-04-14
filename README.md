
# AI Call Flow Builder

A drag-and-drop workflow builder for AI calling agents, similar to Vapi AI. This project allows users to create, edit, and execute call workflows with AI-powered interactions.

## Features

- **Drag-and-Drop Interface**: Create call flows visually using React Flow
- **Custom Node Types**: Start Call, Play Audio, AI Node (Langflow integration), End Call
- **Real-time Updates**: WebSocket support for live node execution status
- **Voice Integrations**: Placeholder endpoints for Twilio, Deepgram, and ElevenLabs
- **Backend API**: FastAPI for workflow storage and execution
- **Database Integration**: MongoDB for workflow storage, Redis for caching

## Architecture

### Frontend
- React with TypeScript
- React Flow for drag-and-drop interface
- Tailwind CSS for styling
- WebSocket client for real-time updates

### Backend
- Python FastAPI
- MongoDB for workflow storage
- Redis for session caching
- WebSockets for real-time updates
- Integration with Langflow for AI-driven workflow logic

## Prerequisites

- Node.js 16+
- Python 3.9+
- MongoDB
- Redis
- Docker and Docker Compose (for containerized deployment)
- Langflow instance (running locally or remotely)

## Installation and Setup

### Running with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/call-flow-builder.git
cd call-flow-builder

# Start all services
docker-compose up -d
```

### Manual Setup

#### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

#### Required Services

- Start MongoDB: `mongod --dbpath /path/to/data/db`
- Start Redis: `redis-server`
- Start Langflow: Follow the [Langflow documentation](https://docs.langflow.org/getting-started/installation)

## Usage

1. Access the web interface at http://localhost:3000
2. Create a new workflow or edit an existing one
3. Drag nodes from the sidebar onto the canvas
4. Connect nodes to create a workflow
5. Configure node parameters (messages, Langflow flow IDs)
6. Save the workflow
7. Execute the workflow via the API or UI

## API Documentation

After starting the backend, access the API documentation at:
http://localhost:8000/docs

## Development

### Adding New Node Types

1. Create a new node component in `src/components/FlowBuilder/nodes/`
2. Register the node type in `src/components/FlowBuilder/FlowEditor.tsx`
3. Add the node to the sidebar in `src/components/FlowBuilder/Sidebar.tsx`

### WebSocket Events

The system uses the following WebSocket events:

- `node_execution_start`: When a node begins execution
- `node_execution_complete`: When a node completes execution
- `node_execution_error`: When a node encounters an error
- `call_status_update`: Call status changes
- `audio_streaming`: Audio streaming events
- `transcript_update`: Real-time transcript updates

## Monitoring and Error Tracking

- Prometheus metrics available at http://localhost:9090
- Sentry integration for error tracking

## License

MIT
