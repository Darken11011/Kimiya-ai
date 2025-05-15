
import React, { DragEvent, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  NodeTypes,
  Node,
  Edge
} from '@xyflow/react';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  nodeTypes: NodeTypes;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  onDragOver,
  onDrop,
  onKeyDown
}) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      fitView
      attributionPosition="bottom-right"
      className="bg-gray-50"
    >
      <Controls />
      <MiniMap nodeStrokeWidth={3} />
      <Background gap={12} size={1} />
    </ReactFlow>
  );
};

export default FlowCanvas;
