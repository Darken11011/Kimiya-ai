
# FastAPI backend implementation for AI Call Flow Builder
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from contextlib import asynccontextmanager
import httpx
import logging
from prometheus_client import Counter, Histogram, start_http_server
import sentry_sdk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize Sentry for error tracking
sentry_sdk.init(
    dsn="your-sentry-dsn",  # Replace with your actual Sentry DSN
    traces_sample_rate=1.0,  # Adjust in production
)

# Prometheus metrics
WORKFLOW_EXECUTIONS = Counter(
    "workflow_executions_total", "Total number of workflow executions"
)
NODE_EXECUTIONS = Counter(
    "node_executions_total", "Total number of node executions", ["node_type"]
)
EXECUTION_TIME = Histogram(
    "node_execution_duration_seconds", "Duration of node execution in seconds", ["node_type"]
)

# MongoDB and Redis connection parameters
MONGO_URL = "mongodb://localhost:27017"
REDIS_URL = "redis://localhost:6379"

# Langflow API endpoint
LANGFLOW_API_URL = "http://localhost:7860/api/v1/run"

# Database models
class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]
    
class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    
class Workflow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    nodes: List[Node]
    edges: List[Edge]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, workflow_id: str):
        await websocket.accept()
        if workflow_id not in self.active_connections:
            self.active_connections[workflow_id] = []
        self.active_connections[workflow_id].append(websocket)
        
    def disconnect(self, websocket: WebSocket, workflow_id: str):
        if workflow_id in self.active_connections:
            self.active_connections[workflow_id].remove(websocket)
            
    async def broadcast_to_workflow(self, workflow_id: str, message: dict):
        if workflow_id in self.active_connections:
            for connection in self.active_connections[workflow_id]:
                await connection.send_json(message)

# Dependencies
async def get_mongodb():
    client = AsyncIOMotorClient(MONGO_URL)
    try:
        db = client.callflow
        yield db
    finally:
        client.close()
        
async def get_redis():
    redis_client = redis.from_url(REDIS_URL)
    try:
        yield redis_client
    finally:
        await redis_client.close()

# Application startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Prometheus metrics server
    start_http_server(8001)
    
    logger.info("Starting AI Call Flow Builder API")
    
    # Perform startup operations
    yield
    
    # Perform shutdown operations
    logger.info("Shutting down AI Call Flow Builder API")

# Initialize FastAPI app
app = FastAPI(
    title="AI Call Flow Builder API",
    description="Backend API for the AI Call Flow Builder application",
    version="1.0.0",
    lifespan=lifespan
)

# Connection manager for WebSockets
manager = ConnectionManager()

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to AI Call Flow Builder API"}

# Workflow CRUD operations
@app.get("/api/workflows")
async def get_workflows(db = Depends(get_mongodb)):
    workflows = await db.workflows.find().to_list(100)
    # Convert ObjectId to string and format datetime
    for workflow in workflows:
        workflow["id"] = str(workflow["_id"])
        del workflow["_id"]
        workflow["created_at"] = workflow["created_at"].isoformat()
        workflow["updated_at"] = workflow["updated_at"].isoformat()
    return {"success": True, "data": workflows}

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, db = Depends(get_mongodb)):
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Convert ObjectId to string and format datetime
    workflow["id"] = str(workflow["_id"])
    del workflow["_id"]
    workflow["created_at"] = workflow["created_at"].isoformat()
    workflow["updated_at"] = workflow["updated_at"].isoformat()
    
    return {"success": True, "data": workflow}

@app.post("/api/workflows")
async def create_workflow(workflow: Workflow, db = Depends(get_mongodb)):
    workflow_dict = workflow.model_dump()
    result = await db.workflows.insert_one(workflow_dict)
    return {"success": True, "data": workflow_dict}

@app.put("/api/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, workflow: Workflow, db = Depends(get_mongodb)):
    workflow_dict = workflow.model_dump()
    workflow_dict["updated_at"] = datetime.now()
    
    result = await db.workflows.update_one(
        {"id": workflow_id},
        {"$set": workflow_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {"success": True, "data": workflow_dict}

@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, db = Depends(get_mongodb)):
    result = await db.workflows.delete_one({"id": workflow_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {"success": True}

# Node execution
@app.post("/api/execute/node/{node_id}")
async def execute_node(
    node_id: str,
    workflow_id: str,
    input_data: Dict[str, Any],
    db = Depends(get_mongodb),
    redis_client = Depends(get_redis)
):
    # Get workflow
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Find the node
    node = next((n for n in workflow["nodes"] if n["id"] == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Execute node based on its type
    result = None
    error = None
    
    try:
        # Broadcast node execution start
        await manager.broadcast_to_workflow(
            workflow_id,
            {
                "type": "node_execution_start",
                "data": {
                    "node_id": node_id,
                    "workflow_id": workflow_id,
                    "status": "running"
                },
                "timestamp": datetime.now().isoformat()
            }
        )
        
        NODE_EXECUTIONS.labels(node["type"]).inc()
        with EXECUTION_TIME.labels(node["type"]).time():
            if node["type"] == "startCall":
                # Simulate Twilio call initiation
                result = {
                    "call_sid": f"CA{uuid.uuid4()}",
                    "status": "initiated",
                    "from": "+15551234567",
                    "to": "+15559876543"
                }
            
            elif node["type"] == "playAudio":
                # Simulate TTS with ElevenLabs
                message = node["data"].get("audioMessage", "Hello, this is a default message.")
                result = {
                    "audio_id": f"audio_{uuid.uuid4()}",
                    "message": message,
                    "status": "generated"
                }
                # Simulate processing delay
                await asyncio.sleep(1)
            
            elif node["type"] == "aiNode":
                # Connect to Langflow
                flow_id = node["data"].get("flowId")
                if not flow_id:
                    raise ValueError("No flow ID specified for AI Node")
                
                # Make request to Langflow API
                async with httpx.AsyncClient() as client:
                    try:
                        # In a real implementation, this would call Langflow
                        # response = await client.post(
                        #     LANGFLOW_API_URL,
                        #     json={"flow_id": flow_id, "input": input_data}
                        # )
                        # response.raise_for_status()
                        # result = response.json()
                        
                        # Simulated response
                        await asyncio.sleep(2)  # Simulate API delay
                        result = {
                            "response": "This is a simulated AI response",
                            "confidence": 0.95,
                            "intent": "greeting"
                        }
                    except httpx.HTTPError as e:
                        error = f"Error communicating with Langflow API: {str(e)}"
                        raise
            
            elif node["type"] == "endCall":
                # Simulate ending the call
                result = {
                    "status": "completed",
                    "duration": 120,  # seconds
                    "outcome": "success"
                }
    
        # Cache result in Redis for 1 hour
        await redis_client.setex(
            f"node_result:{node_id}",
            3600,  # 1 hour TTL
            json.dumps({
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
        )
        
        # Broadcast node execution complete
        await manager.broadcast_to_workflow(
            workflow_id,
            {
                "type": "node_execution_complete",
                "data": {
                    "node_id": node_id,
                    "workflow_id": workflow_id,
                    "status": "completed",
                    "result": result
                },
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Error executing node {node_id}: {str(e)}")
        sentry_sdk.capture_exception(e)
        
        error = str(e)
        
        # Broadcast node execution error
        await manager.broadcast_to_workflow(
            workflow_id,
            {
                "type": "node_execution_error",
                "data": {
                    "node_id": node_id,
                    "workflow_id": workflow_id,
                    "status": "error",
                    "error": error
                },
                "timestamp": datetime.now().isoformat()
            }
        )
    
    if error:
        return {"success": False, "error": error}
    
    return {"success": True, "data": result}

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{workflow_id}")
async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
    await manager.connect(websocket, workflow_id)
    try:
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process message (this could trigger workflows, etc.)
            # For now, just echo it back
            await websocket.send_json({
                "type": "echo",
                "data": message,
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)

# Voice integration endpoints
@app.post("/api/voice/call")
async def initiate_call(
    phone_number: str,
    workflow_id: str,
    db = Depends(get_mongodb)
):
    """
    Endpoint to initiate a call using Twilio
    """
    # Validate workflow exists
    workflow = await db.workflows.find_one({"id": workflow_id})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # In a real implementation, you'd call Twilio API here
    # For demo purposes, we'll simulate a successful call initiation
    call_id = f"call_{uuid.uuid4()}"
    
    # Record the call in the database
    await db.calls.insert_one({
        "id": call_id,
        "workflow_id": workflow_id,
        "phone_number": phone_number,
        "status": "initiated",
        "created_at": datetime.now()
    })
    
    return {
        "success": True,
        "data": {
            "call_id": call_id,
            "status": "initiated",
            "phone_number": phone_number
        }
    }

@app.post("/api/voice/speech-to-text")
async def speech_to_text(audio_data: Dict[str, Any]):
    """
    Endpoint to convert speech to text using Deepgram
    """
    # In a real implementation, you'd call Deepgram API here
    # For demo purposes, we'll simulate a successful transcription
    
    return {
        "success": True,
        "data": {
            "transcript": "Hello, I'm calling about your product.",
            "confidence": 0.95
        }
    }

@app.post("/api/voice/text-to-speech")
async def text_to_speech(text: str, voice_id: Optional[str] = None):
    """
    Endpoint to convert text to speech using ElevenLabs
    """
    # In a real implementation, you'd call ElevenLabs API here
    # For demo purposes, we'll simulate a successful audio generation
    
    return {
        "success": True,
        "data": {
            "audio_url": f"https://example.com/audio/{uuid.uuid4()}.mp3",
            "duration": 2.5  # seconds
        }
    }

# Run the application with Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
