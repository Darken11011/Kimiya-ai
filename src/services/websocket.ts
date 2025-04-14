
// WebSocket Service for real-time updates from backend

// WebSocket event types
export enum WebSocketEventType {
  NODE_EXECUTION_START = 'node_execution_start',
  NODE_EXECUTION_COMPLETE = 'node_execution_complete',
  NODE_EXECUTION_ERROR = 'node_execution_error',
  CALL_STATUS_UPDATE = 'call_status_update',
  AUDIO_STREAMING = 'audio_streaming',
  TRANSCRIPT_UPDATE = 'transcript_update'
}

// Interface for WebSocket events
export interface WebSocketEvent<T> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
}

// Interface for node execution data
export interface NodeExecutionData {
  node_id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1s, will be increased exponentially
  private eventListeners: { [key in WebSocketEventType]?: ((data: any) => void)[] } = {};
  
  // Connect to WebSocket
  connect(url: string = 'ws://localhost:8000/ws') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket connection already established');
      return;
    }
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const parsedEvent: WebSocketEvent<any> = JSON.parse(event.data);
          this.handleEvent(parsedEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }
  
  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  // Send data to WebSocket server
  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }
  
  // Listen for specific event types
  on<T>(event: WebSocketEventType, callback: (data: T) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]?.push(callback);
  }
  
  // Remove event listener
  off(event: WebSocketEventType, callback: (data: any) => void) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event]?.filter(
        (listener) => listener !== callback
      );
    }
  }
  
  // Handle incoming events
  private handleEvent(event: WebSocketEvent<any>) {
    const listeners = this.eventListeners[event.type];
    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        try {
          listener(event.data);
        } catch (error) {
          console.error(`Error in listener for event ${event.type}:`, error);
        }
      });
    }
  }
  
  // Attempt to reconnect with exponential backoff
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
      
      // Increase the timeout for the next attempt (exponential backoff)
      this.reconnectTimeout *= 2;
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();

// Example usage:
/*
// Connect to WebSocket server
webSocketService.connect();

// Listen for node execution events
webSocketService.on(WebSocketEventType.NODE_EXECUTION_COMPLETE, (data: NodeExecutionData) => {
  console.log('Node execution completed:', data);
  // Update UI based on the node execution result
});

// Send a message to start node execution
webSocketService.send({
  type: 'start_node_execution',
  data: {
    node_id: 'node-1',
    workflow_id: 'workflow-1',
    input: {
      message: 'Hello, how can I help you today?'
    }
  }
});

// Later, disconnect when done
webSocketService.disconnect();
*/
