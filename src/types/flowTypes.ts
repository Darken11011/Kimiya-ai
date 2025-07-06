
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

// Base types for node data with common fields
export interface BaseNodeData {
  label?: string;
  onChange?: (params: any) => void;
  [key: string]: any;
}

// Condition types for edges
export enum ConditionType {
  AI_BASED = 'ai_based',
  LOGICAL = 'logical',
  COMBINED = 'combined',
  NONE = 'none'
}

// Variable types for logical conditions
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  INTEGER = 'integer'
}

// Logical operators for conditions
export enum LogicalOperator {
  EQUALS = '==',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  AND = 'and',
  OR = 'or'
}

// Interface for extracted variables
export interface ExtractedVariable {
  name: string;
  type: VariableType;
  description?: string;
  enumValues?: string[]; // For string type with predefined values
  nodeId: string; // Which node extracted this variable
}

// Interface for logical condition
export interface LogicalCondition {
  variable: string;
  operator: LogicalOperator;
  value: string | number | boolean;
  combineWith?: 'and' | 'or';
}

// Interface for edge condition data
export interface EdgeConditionData extends Record<string, unknown> {
  type: ConditionType;
  aiCondition?: string; // Natural language condition for AI evaluation
  logicalConditions?: LogicalCondition[]; // Array of logical conditions
  combinedCondition?: string; // Mixed logical and AI condition
  description?: string; // Human-readable description
  isDefault?: boolean; // Whether this is the default path
}

// Extended edge interface with condition data
export interface ConditionalEdge extends ReactFlowEdge {
  data?: EdgeConditionData;
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

// Interface for workflow context and variable management
export interface WorkflowContext {
  variables: Map<string, ExtractedVariable>;
  currentNodeId?: string;
  executionPath: string[]; // Track execution path for debugging
}

// Define the workflow type
export interface Workflow {
  id?: string;
  name: string;
  nodes: CustomNode[];
  edges: ConditionalEdge[];
  variables?: ExtractedVariable[];
  created_at?: string;
  updated_at?: string;
}
