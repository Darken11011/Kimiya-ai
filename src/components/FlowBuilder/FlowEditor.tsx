
import React, { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StartCallNode from './nodes/StartCallNode';
import PlayAudioNode from './nodes/PlayAudioNode';
import AINode from './nodes/AINode';
import EndCallNode from './nodes/EndCallNode';
import Sidebar from './Sidebar';

// Define custom node types
const nodeTypes = {
  startCall: StartCallNode,
  playAudio: PlayAudioNode,
  aiNode: AINode,
  endCall: EndCallNode
};

const initialNodes = [
  {
    id: 'start-1',
    type: 'startCall',
    data: { label: 'Start Call' },
    position: { x: 250, y: 50 },
  }
];

let id = 0;
const getId = () => `node_${id++}`;

const FlowEditorContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Get ReactFlow utilities from hook
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    const flow = {
      nodes,
      edges,
    };
    // In a real application, you would send this data to your backend API
    console.log('Workflow saved:', flow);
    alert('Workflow saved!');
    
    // Example API call to save workflow
    /*
    fetch('http://localhost:8000/api/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flow),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Workflow saved successfully:', data);
        alert('Workflow saved!');
      })
      .catch(error => {
        console.error('Error saving workflow:', error);
        alert('Failed to save workflow');
      });
    */
  }, [nodes, edges]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        
        if (typeof type === 'undefined' || !type) {
          return;
        }

        // Calculate the position where the node should be created
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        
        // Create a node based on the type
        const newNode = {
          id: getId(),
          type,
          position,
          data: { 
            label: `${type.charAt(0).toUpperCase() + type.slice(1)}`, 
            onChange: (params: Record<string, unknown>) => {
              setNodes(nds => 
                nds.map(node => {
                  if (node.id === newNode.id) {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        ...params,
                      },
                    };
                  }
                  return node;
                })
              );
            }
          },
        };

        setNodes((nds) => [...nds, newNode as any]);
      }
    },
    [setNodes]
  );

  // Handle node deletion via keyboard
  const onNodeDelete = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Get selected nodes using the current state
      const selectedNodeIds = nodes
        .filter(node => (node as any).selected)
        .map(node => node.id);
      
      if (selectedNodeIds.length > 0) {
        // Remove selected nodes
        setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
        // Remove edges connected to deleted nodes
        setEdges((eds) => eds.filter((edge) => 
          !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        ));
      }
    }
  }, [nodes, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex">
      <Sidebar />
      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onKeyDown={onNodeDelete}
          fitView
          attributionPosition="bottom-right"
          className="bg-gray-50"
        >
          <Panel position="top-right">
            <button 
              onClick={onSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Save Workflow
            </button>
          </Panel>
          <Controls />
          <MiniMap nodeStrokeWidth={3} />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapper with ReactFlowProvider
const FlowEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowEditorContent />
    </ReactFlowProvider>
  );
};

export default FlowEditor;
