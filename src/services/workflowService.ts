
import { toast } from "sonner";

// Mock workflow types
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// In a real application, this would interact with your FastAPI backend
// For now, we'll simulate API calls with localStorage

export const saveWorkflow = async (workflow: Workflow): Promise<Workflow> => {
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a unique ID if it's a new workflow
    if (!workflow.id) {
      workflow.id = `workflow_${Date.now()}`;
    }
    
    // Store in localStorage
    const existingWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    const workflowIndex = existingWorkflows.findIndex((w: Workflow) => w.id === workflow.id);
    
    if (workflowIndex >= 0) {
      existingWorkflows[workflowIndex] = workflow;
    } else {
      existingWorkflows.push(workflow);
    }
    
    localStorage.setItem('workflows', JSON.stringify(existingWorkflows));
    toast.success(`Workflow "${workflow.name}" saved successfully`);
    
    return workflow;
  } catch (error) {
    console.error('Error saving workflow:', error);
    toast.error('Failed to save workflow');
    throw error;
  }
};

export const getWorkflows = async (): Promise<Workflow[]> => {
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    return workflows;
  } catch (error) {
    console.error('Error fetching workflows:', error);
    toast.error('Failed to fetch workflows');
    throw error;
  }
};

export const getWorkflowById = async (id: string): Promise<Workflow | null> => {
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    const workflow = workflows.find((w: Workflow) => w.id === id);
    
    if (!workflow) {
      throw new Error(`Workflow with ID ${id} not found`);
    }
    
    return workflow;
  } catch (error) {
    console.error(`Error fetching workflow ${id}:`, error);
    toast.error('Failed to load workflow');
    return null;
  }
};

export const deleteWorkflow = async (id: string): Promise<boolean> => {
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    const filteredWorkflows = workflows.filter((w: Workflow) => w.id !== id);
    
    localStorage.setItem('workflows', JSON.stringify(filteredWorkflows));
    toast.success('Workflow deleted successfully');
    
    return true;
  } catch (error) {
    console.error(`Error deleting workflow ${id}:`, error);
    toast.error('Failed to delete workflow');
    return false;
  }
};

// Mock API for AI integration
export const processAINode = async (input: string, apiKey: string): Promise<string> => {
  try {
    // In a real application, this would call the OpenAI API
    // For now, we'll simulate a response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key');
    }
    
    return `AI response to: "${input}"`;
  } catch (error) {
    console.error('Error processing AI node:', error);
    toast.error('AI processing failed');
    throw error;
  }
};
