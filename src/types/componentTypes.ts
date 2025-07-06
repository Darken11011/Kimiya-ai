import { ReactNode } from 'react';

// Base types for component system
export interface ComponentInput {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'password' | 'file';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ComponentOutput {
  name: string;
  type: string;
  description?: string;
}

export interface ComponentHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
  style?: React.CSSProperties;
  className?: string;
}

export interface ComponentDefinition {
  type: string;
  displayName: string;
  description: string;
  category: string;
  icon: ReactNode;
  color: string;
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
  handles: ComponentHandle[];
  defaultData: Record<string, any>;
  component: React.ComponentType<any>;
  tags?: string[];
  documentation?: string;
  version?: string;
}

export interface FlowComponent {
  type: string;
  displayName: string;
  description: string;
  category: string;
  icon: ReactNode;
  color: string;
  defaultData: Record<string, any>;
}

// Component categories
export const COMPONENT_CATEGORIES = {
  INPUT: 'Input',
  OUTPUT: 'Output', 
  PROCESSING: 'Processing',
  LOGIC: 'Logic',
  COMMUNICATION: 'Communication',
  AI: 'AI & ML',
  DATA: 'Data',
  UTILITY: 'Utility'
} as const;

export type ComponentCategory = typeof COMPONENT_CATEGORIES[keyof typeof COMPONENT_CATEGORIES];

// Node data interface for React Flow
export interface NodeData {
  label: string;
  component: FlowComponent;
  [key: string]: any;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Component registry interface
export interface ComponentRegistry {
  register: (definition: ComponentDefinition) => void;
  get: (type: string) => ComponentDefinition | undefined;
  getAll: () => ComponentDefinition[];
  getByCategory: (category: string) => ComponentDefinition[];
  search: (query: string) => ComponentDefinition[];
  validate: (nodeData: any) => ValidationResult;
}

// Flow execution context
export interface ExecutionContext {
  nodeId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  metadata: Record<string, any>;
}

// Component execution interface
export interface ComponentExecutor {
  execute: (context: ExecutionContext) => Promise<Record<string, any>>;
  validate?: (inputs: Record<string, any>) => ValidationResult;
}
