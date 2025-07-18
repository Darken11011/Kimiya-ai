import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  Panel,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import { useFlowStore } from '../../stores/flowStore';
import DynamicNode from './components/DynamicNode';
import ConditionalEdge from './components/ConditionalEdge';
import { ComponentDefinition } from '../../types/componentTypes';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  // All node types will use the DynamicNode component
  startNode: DynamicNode,
  conversationNode: DynamicNode,
  apiRequest: DynamicNode,
  transferCall: DynamicNode,
  toolNode: DynamicNode,
  endCall: DynamicNode,
  // Add more as needed - they all use DynamicNode
};

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

const NewFlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onConnect,
    selectNode,
    addNode,
    getComponent
  } = useFlowStore();

  // Add keyboard shortcuts for node operations
  const { onKeyDown } = useKeyboardShortcuts(nodes, edges, setNodes, onEdgesChange);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event as any);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyDown]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      const componentData = event.dataTransfer.getData('component');
      
      if (!type) {
        return;
      }

      let component: ComponentDefinition | undefined;
      
      if (componentData) {
        try {
          component = JSON.parse(componentData);
        } catch (error) {
          console.error('Failed to parse component data:', error);
        }
      }
      
      if (!component) {
        component = getComponent(type);
      }
      
      if (!component) {
        toast.error(`Unknown component type: ${type}`);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      addNode(component, position);
      toast.success(`Added ${component.displayName} to flow`);
    },
    [reactFlowInstance, addNode, getComponent]
  );

  const onNodesChange = useCallback(
    (changes: any) => {
      // Handle selection changes
      changes.forEach((change: any) => {
        if (change.type === 'select' && change.selected) {
          selectNode(change.id);
        }
      });

      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes, selectNode]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as any);
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onConnectStart = useCallback(() => {
    // Connection start handler - can be used for custom logic
  }, []);

  const onConnectEnd = useCallback((_event: any) => {
    // Connection end handler - can be used for custom logic
  }, []);

  const isValidConnection = useCallback((connection: any) => {
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }

    // Check if connection already exists
    const existingConnection = edges.find(
      edge => edge.source === connection.source &&
              edge.target === connection.target &&
              edge.sourceHandle === connection.sourceHandle &&
              edge.targetHandle === connection.targetHandle
    );

    if (existingConnection) {
      return false;
    }

    // Additional validation: Check if source and target nodes exist
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    return true;
  }, [edges, nodes]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
        connectionRadius={20}
        isValidConnection={isValidConnection}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        className="bg-gray-50"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: '#374151' },
          type: 'conditional',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#374151',
          },
        }}
      >
        <Controls 
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          showInteractive={false}
        />
        <MiniMap 
          nodeStrokeWidth={3}
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          pannable
          zoomable
        />
        <Background
          gap={20}
          size={1}
          color="#e5e7eb"
        />
        
        {/* Flow Info Panel */}
        <Panel position="top-left" className="bg-white shadow-lg border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-900">
            Flow Builder
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {nodes.length} nodes, {edges.length} connections
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default NewFlowCanvas;
