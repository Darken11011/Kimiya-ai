import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Node, Edge, Connection, addEdge } from '@xyflow/react';
import { ComponentDefinition, FlowComponent } from '../types/componentTypes';
import { ConditionalEdge, ExtractedVariable, ConditionType, WorkflowContext } from '../types/flowTypes';
import { WorkflowConfig } from '../types/workflowConfig';

interface FlowState {
  // Flow data
  nodes: Node[];
  edges: ConditionalEdge[];
  workflowName: string;

  // Workflow configuration
  workflowConfig: WorkflowConfig | null;

  // Workflow context for variables and conditions
  workflowContext: WorkflowContext;

  // UI state
  selectedNodeId: string | null;
  isConfigPanelOpen: boolean;
  sidebarCollapsed: boolean;

  // Component registry
  componentRegistry: Map<string, ComponentDefinition>;
  
  // Actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: ConditionalEdge[] | ((edges: ConditionalEdge[]) => ConditionalEdge[])) => void;
  setWorkflowName: (name: string) => void;

  // Workflow configuration
  setWorkflowConfig: (config: WorkflowConfig) => void;
  updateWorkflowConfig: (updates: Partial<WorkflowConfig>) => void;

  // Node operations
  addNode: (component: FlowComponent, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  onConnect: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdgeCondition: (edgeId: string, conditionData: any) => void;

  // Variable operations
  addVariable: (variable: ExtractedVariable) => void;
  updateVariable: (variableName: string, updates: Partial<ExtractedVariable>) => void;
  deleteVariable: (variableName: string) => void;
  getAvailableVariables: () => ExtractedVariable[];
  addDefaultVariables: () => void;
  
  // Selection
  selectNode: (nodeId: string | null) => void;
  
  // UI actions
  toggleConfigPanel: () => void;
  toggleSidebar: () => void;
  
  // Component registry
  registerComponent: (definition: ComponentDefinition) => void;
  getComponent: (type: string) => ComponentDefinition | undefined;
  getAllComponents: () => ComponentDefinition[];
  
  // Flow operations
  saveFlow: () => void;
  loadFlow: (flowData: any) => void;
  newFlow: (config?: WorkflowConfig) => void;
}

let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}`;

// Function to load saved workflow from localStorage
const loadSavedWorkflow = () => {
  try {
    const savedWorkflow = localStorage.getItem('langflow_workflow');
    if (savedWorkflow) {
      return JSON.parse(savedWorkflow);
    }
  } catch (error) {
    console.error('Error loading saved workflow:', error);
  }
  return null;
};

// Initialize with saved workflow if available
const savedWorkflow = loadSavedWorkflow();

// Auto-save function with debouncing
let autoSaveTimeout: NodeJS.Timeout | null = null;
const autoSave = (store: any) => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  autoSaveTimeout = setTimeout(() => {
    store.saveFlow();
  }, 2000); // Auto-save after 2 seconds of inactivity
};

export const useFlowStore = create<FlowState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state - load from localStorage if available
      nodes: savedWorkflow?.nodes || [],
      edges: savedWorkflow?.edges || [],
      workflowName: savedWorkflow?.name || 'New Workflow',
      workflowConfig: savedWorkflow?.config || null,
      workflowContext: {
        variables: savedWorkflow?.variables ? new Map(savedWorkflow.variables) : new Map(),
        executionPath: savedWorkflow?.executionPath || []
      },
      selectedNodeId: null,
      isConfigPanelOpen: false,
      sidebarCollapsed: false,
      componentRegistry: new Map(),
      
      // Node operations
      setNodes: (nodes) => set((state) => ({
        nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes
      })),
      
      setEdges: (edges) => set((state) => ({
        edges: typeof edges === 'function' ? edges(state.edges) : edges
      })),
      
      setWorkflowName: (name) => set({ workflowName: name }),

      // Workflow configuration
      setWorkflowConfig: (config) => {
        set({
          workflowConfig: config,
          workflowName: config.name
        });
        // Auto-save after config update
        autoSave(get());
      },

      updateWorkflowConfig: (updates) => {
        set((state) => ({
          workflowConfig: state.workflowConfig
            ? { ...state.workflowConfig, ...updates, updatedAt: new Date().toISOString() }
            : null
        }));
        // Auto-save after config update
        autoSave(get());
      },
      
      addNode: (component, position) => {
        const newNode: Node = {
          id: generateNodeId(),
          type: component.type,
          position,
          data: {
            ...component.defaultData,
            label: component.displayName,
            component: component
          }
        };
        
        set((state) => ({
          nodes: [...state.nodes, newNode]
        }));

        // Trigger auto-save
        autoSave(get());
      },
      
      updateNode: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          )
        }));

        // Trigger auto-save
        autoSave(get());
      },
      
      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter(node => node.id !== nodeId),
          edges: state.edges.filter(edge =>
            edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
        }));

        // Trigger auto-save
        autoSave(get());
      },
      
      // Edge operations
      onConnect: (connection) => {
        // Create a conditional edge with default settings
        const newEdge: ConditionalEdge = {
          ...addEdge(connection, [])[0],
          data: {
            type: ConditionType.NONE,
            isDefault: false
          },
          type: 'conditional'
        };

        set((state) => ({
          edges: [...state.edges, newEdge]
        }));

        // Trigger auto-save
        autoSave(get());
      },

      deleteEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter(edge => edge.id !== edgeId)
        }));

        // Trigger auto-save
        autoSave(get());
      },

      updateEdgeCondition: (edgeId, conditionData) => {
        set((state) => ({
          edges: state.edges.map(edge =>
            edge.id === edgeId
              ? { ...edge, data: conditionData }
              : edge
          )
        }));

        // Trigger auto-save
        autoSave(get());
      },
      
      // Selection
      selectNode: (nodeId) => set({ 
        selectedNodeId: nodeId,
        isConfigPanelOpen: nodeId !== null
      }),
      
      // UI actions
      toggleConfigPanel: () => set((state) => ({
        isConfigPanelOpen: !state.isConfigPanelOpen
      })),
      
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      // Variable operations
      addVariable: (variable) => set((state) => ({
        workflowContext: {
          ...state.workflowContext,
          variables: new Map(state.workflowContext.variables).set(variable.name, variable)
        }
      })),

      updateVariable: (variableName, updates) => set((state) => {
        const variables = new Map(state.workflowContext.variables);
        const existing = variables.get(variableName);
        if (existing) {
          variables.set(variableName, { ...existing, ...updates });
        }
        return {
          workflowContext: {
            ...state.workflowContext,
            variables
          }
        };
      }),

      deleteVariable: (variableName) => set((state) => {
        const variables = new Map(state.workflowContext.variables);
        variables.delete(variableName);
        return {
          workflowContext: {
            ...state.workflowContext,
            variables
          }
        };
      }),

      getAvailableVariables: () => {
        const state = get();
        return Array.from(state.workflowContext.variables.values());
      },

      // Helper function to add some default variables for testing
      addDefaultVariables: () => set((state) => {
        const defaultVariables = new Map(state.workflowContext.variables);

        // Add some common variables if they don't exist
        if (!defaultVariables.has('user_input')) {
          defaultVariables.set('user_input', {
            name: 'user_input',
            type: 'string' as any,
            description: 'User input from conversation',
            nodeId: 'system'
          });
        }

        if (!defaultVariables.has('call_duration')) {
          defaultVariables.set('call_duration', {
            name: 'call_duration',
            type: 'number' as any,
            description: 'Duration of the call in seconds',
            nodeId: 'system'
          });
        }

        if (!defaultVariables.has('api_status')) {
          defaultVariables.set('api_status', {
            name: 'api_status',
            type: 'number' as any,
            description: 'HTTP status code from API request',
            nodeId: 'system'
          });
        }

        return {
          workflowContext: {
            ...state.workflowContext,
            variables: defaultVariables
          }
        };
      }),
      
      // Component registry
      registerComponent: (definition) => set((state) => {
        const newRegistry = new Map(state.componentRegistry);
        newRegistry.set(definition.type, definition);
        return { componentRegistry: newRegistry };
      }),
      
      getComponent: (type) => {
        return get().componentRegistry.get(type);
      },
      
      getAllComponents: () => {
        return Array.from(get().componentRegistry.values());
      },
      
      // Flow operations
      saveFlow: () => {
        const { nodes, edges, workflowName, workflowConfig, workflowContext } = get();
        const flowData = {
          name: workflowName,
          config: workflowConfig,
          nodes: nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              component: undefined // Remove component reference for serialization
            }
          })),
          edges,
          variables: Array.from(workflowContext.variables.entries()).filter(([key, value]) =>
            key !== null && key !== undefined && value !== null && value !== undefined
          ), // Convert Map to array for serialization, filtering out invalid entries
          executionPath: workflowContext.executionPath,
          savedAt: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('langflow_workflow', JSON.stringify(flowData));
        console.log('Flow saved:', flowData);
      },
      
      loadFlow: (flowData) => {
        // Safely handle variables conversion
        let variablesMap = new Map();
        if (flowData.variables) {
          try {
            if (Array.isArray(flowData.variables)) {
              // Check if it's an array of [key, value] pairs (exported format)
              if (flowData.variables.length > 0 && Array.isArray(flowData.variables[0])) {
                // Filter out null/invalid entries
                const validVariables = flowData.variables.filter(entry =>
                  entry &&
                  Array.isArray(entry) &&
                  entry.length === 2 &&
                  entry[0] !== null &&
                  entry[0] !== undefined
                );
                variablesMap = new Map(validVariables);
              } else {
                // It's an array of variable objects (original format)
                // Convert to Map format: variable name -> variable object
                flowData.variables.forEach(variable => {
                  if (variable && variable.name) {
                    variablesMap.set(variable.name, variable);
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Failed to load variables, using empty Map:', error);
            variablesMap = new Map();
          }
        }

        set({
          nodes: flowData.nodes || [],
          edges: flowData.edges || [],
          workflowName: flowData.name || 'Loaded Workflow',
          workflowConfig: flowData.config || null,
          workflowContext: {
            variables: variablesMap,
            executionPath: flowData.executionPath || []
          }
        });
      },

      newFlow: (config) => {
        set({
          nodes: [],
          edges: [],
          workflowName: config?.name || 'New Workflow',
          workflowConfig: config || null,
          workflowContext: {
            variables: new Map(),
            executionPath: []
          },
          selectedNodeId: null,
          isConfigPanelOpen: false
        });
      }
    })),
    { name: 'flow-store' }
  )
);
