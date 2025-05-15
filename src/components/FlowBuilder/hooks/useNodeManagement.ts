
import { useCallback, useState } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Node, Edge } from '@xyflow/react';
import { CustomNode } from '../../../types/flowTypes';
import { toast } from "sonner";

const initialNodes: CustomNode[] = [
  {
    id: 'start-1',
    type: 'startCall',
    data: { 
      label: 'Start Call',
      phoneNumber: ''
    },
    position: { x: 250, y: 50 },
  }
];

// Utility function to generate unique node IDs
let id = 0;
const getId = () => `node_${id++}`;

export const useNodeManagement = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState("New Workflow");

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    const flow = {
      name: workflowName,
      nodes: nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: undefined // Remove function references before saving
        }
      })),
      edges,
    };
    
    console.log('Workflow saved:', flow);
    
    // In a real scenario, this would be sent to the backend
    // Mock API call to simulate saving to the backend
    setTimeout(() => {
      toast.success("Workflow saved successfully!");
    }, 500);
    
    // Store in localStorage for demo purposes
    try {
      localStorage.setItem('savedWorkflow', JSON.stringify(flow));
    } catch (error) {
      console.error('Error saving workflow to localStorage:', error);
    }
  }, [nodes, edges, workflowName]);

  const onNewWorkflow = useCallback(() => {
    if (window.confirm("Create a new workflow? Any unsaved changes will be lost.")) {
      setNodes(initialNodes);
      setEdges([]);
      setWorkflowName("New Workflow");
      toast.info("New workflow created");
    }
  }, [setNodes, setEdges]);

  const createNewNode = (type: string, position: {x: number, y: number}) => {
    const newNode = {
      id: getId(),
      type,
      position,
      data: { 
        label: type,
        onChange: (params: any) => {
          setNodes(nodes => 
            nodes.map(node => {
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
    
    setNodes(nds => [...nds, newNode]);
  };

  return {
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
  };
};
