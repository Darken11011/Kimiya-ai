
import React, { useRef, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Node components
import StartCallNode from './nodes/StartCallNode';
import PlayAudioNode from './nodes/PlayAudioNode';
import AINode from './nodes/AINode';
import EndCallNode from './nodes/EndCallNode';
import LogicNode, { BranchNode } from './nodes/LogicNode';
import GatherNode from './nodes/GatherNode';
import ApiRequestNode from './nodes/ApiRequestNode';
import TransferCallNode from './nodes/TransferCallNode';

// Sidebar and custom components
import Sidebar from './Sidebar';

// Custom hooks
import { useNodeManagement } from './hooks/useNodeManagement';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Components
import WorkflowControls from './components/WorkflowControls';
import FlowCanvas from './components/FlowCanvas';

// Define the node types
const FlowEditorContent: React.FC = () => {
  // Ref for the flow wrapper
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Memoize nodeTypes to avoid recreation on each render
  const nodeTypes = useMemo(() => ({
    startCall: StartCallNode as any,
    playAudio: PlayAudioNode as any,
    aiNode: AINode as any,
    endCall: EndCallNode as any,
    logic: LogicNode as any,
    gather: GatherNode as any,
    apiRequest: ApiRequestNode as any,
    transferCall: TransferCallNode as any,
    branch: BranchNode as any,
  }), []);
  
  // Hook for managing nodes, edges, and workflow state
  const {
    nodes,
    edges,
    workflowName,
    setWorkflowName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSave,
    onNewWorkflow,
    createNewNode,
    setNodes
  } = useNodeManagement();

  // Hook for handling drag and drop operations
  const { onDragOver, onDrop } = useDragAndDrop(reactFlowWrapper, createNewNode);
  
  // Hook for keyboard shortcuts
  const { onKeyDown } = useKeyboardShortcuts(nodes, setNodes, onEdgesChange);

  return (
    <div className="w-full h-full flex">
      <Sidebar />
      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onKeyDown={onKeyDown}
        />
        <WorkflowControls
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          onSave={onSave}
          onNewWorkflow={onNewWorkflow}
        />
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
