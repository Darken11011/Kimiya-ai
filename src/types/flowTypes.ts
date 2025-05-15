
import { Node as ReactFlowNode } from '@xyflow/react';

// Base types for node data with common fields
export interface BaseNodeData {
  onChange?: (params: any) => void;
  [key: string]: any;
}

// Specific node data types
export interface StartCallNodeData extends BaseNodeData {
  phoneNumber?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

export interface PlayAudioNodeData extends BaseNodeData {
  audioMessage?: string;
}

export interface AINodeData extends BaseNodeData {
  flowId?: string;
  openAIKey?: string;
}

export interface EndCallNodeData extends BaseNodeData {
  reason?: string;
}

export interface LogicNodeData extends BaseNodeData {
  logicType?: string;
  value?: string;
}

export interface BranchNodeData extends BaseNodeData {
  conditionType?: string;
  conditionValue?: string;
  title?: string;
}

export interface GatherNodeData extends BaseNodeData {
  input?: string;
}

export interface ApiRequestNodeData extends BaseNodeData {
  method?: string;
  url?: string;
  body?: string;
}

export interface TransferCallNodeData extends BaseNodeData {
  phoneNumber?: string;
}

// Types for the node that will be used in ReactFlow
export type CustomNode = ReactFlowNode<BaseNodeData>;
export type StartCallNode = ReactFlowNode<StartCallNodeData>;
export type PlayAudioNode = ReactFlowNode<PlayAudioNodeData>;
export type AINode = ReactFlowNode<AINodeData>;
export type EndCallNode = ReactFlowNode<EndCallNodeData>;
export type LogicNode = ReactFlowNode<LogicNodeData>;
export type BranchNode = ReactFlowNode<BranchNodeData>;
export type GatherNode = ReactFlowNode<GatherNodeData>;
export type ApiRequestNode = ReactFlowNode<ApiRequestNodeData>;
export type TransferCallNode = ReactFlowNode<TransferCallNodeData>;

// Define the workflow type
export interface Workflow {
  id?: string;
  name: string;
  nodes: CustomNode[];
  edges: any[];
  created_at?: string;
  updated_at?: string;
}
