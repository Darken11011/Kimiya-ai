import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Play,
  Square,
  FileText,
  Settings,
  Download,
  Upload,
  Zap,
  Eye,
  Globe,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '../../stores/flowStore';
import { validateFlow } from '../../utils/flowValidation';
import { WorkflowConfig } from '../../types/workflowConfig';
import WorkflowSetupModal from './components/WorkflowSetupModal';
import PlaygroundModal from './components/PlaygroundModal';
import { toast } from 'sonner';

const FlowToolbar: React.FC = () => {
  const navigate = useNavigate();
  const {
    workflowName,
    setWorkflowName,
    saveFlow,
    loadFlow,
    newFlow,
    nodes,
    edges,
    workflowConfig,
    setWorkflowConfig,
    getAvailableVariables,
    updateNode,
    addDefaultVariables
  } = useFlowStore();

  const [isExecuting, setIsExecuting] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('You are a helpful AI assistant. Be professional, friendly, and concise in your responses. Listen carefully to the user and provide accurate, helpful information.');

  // Sync global prompt with start node when nodes change
  useEffect(() => {
    const startNode = nodes.find(node => node.type === 'startNode');
    if (startNode && startNode.data?.globalPrompt && typeof startNode.data.globalPrompt === 'string' && startNode.data.globalPrompt !== globalPrompt) {
      setGlobalPrompt(startNode.data.globalPrompt);
    }
  }, [nodes]);
  const [isGlobalPromptOpen, setIsGlobalPromptOpen] = useState(false);
  const [isWorkflowSetupOpen, setIsWorkflowSetupOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Check for existing saved data on component mount
  useEffect(() => {
    try {
      const savedWorkflow = localStorage.getItem('langflow_workflow');
      if (savedWorkflow) {
        const parsed = JSON.parse(savedWorkflow);
        if (parsed.savedAt) {
          setLastSavedTime(new Date(parsed.savedAt));
        }
      }
    } catch (error) {
      console.error('Error checking saved workflow:', error);
    }
  }, []);

  const handleSave = () => {
    try {
      saveFlow();
      const nodeCount = nodes.length;
      const edgeCount = edges.length;
      const saveTime = new Date();
      setLastSavedTime(saveTime);
      toast.success(`Workflow saved! (${nodeCount} nodes, ${edgeCount} connections)`);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow. Please try again.');
    }
  };

  const handleEditWorkflow = () => {
    // Open workflow setup modal to edit current workflow configuration
    setIsWorkflowSetupOpen(true);
  };

  const handleWorkflowSetupSave = (config: WorkflowConfig) => {
    // Update existing workflow configuration instead of creating new
    setWorkflowConfig(config);
    setWorkflowName(config.name);
    setIsWorkflowSetupOpen(false);
    toast.success(`Workflow "${config.name}" updated successfully!`);
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error('Cannot execute empty flow');
      return;
    }

    setIsExecuting(true);
    try {
      // Simulate flow execution
      toast.info('Executing flow...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Flow executed successfully!');
    } catch (error) {
      toast.error('Flow execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = () => {
    setIsExecuting(false);
    toast.info('Flow execution stopped');
  };

  const handleExport = () => {
    const flowData = {
      name: workflowName,
      config: workflowConfig,
      nodes: nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          component: undefined // Remove component reference for export
        }
      })),
      edges,
      variables: getAvailableVariables(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${workflowName.replace(/\s+/g, '_').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Flow exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const flowData = JSON.parse(e.target?.result as string);

            // Validate the imported data structure
            if (!flowData || typeof flowData !== 'object') {
              throw new Error('Invalid file format');
            }

            // Check if it has the expected structure
            if (!flowData.nodes && !flowData.edges && !flowData.name) {
              throw new Error('File does not contain valid workflow data');
            }

            // Ensure nodes and edges are arrays
            if (flowData.nodes && !Array.isArray(flowData.nodes)) {
              throw new Error('Invalid nodes data format');
            }
            if (flowData.edges && !Array.isArray(flowData.edges)) {
              throw new Error('Invalid edges data format');
            }

            // Confirm import if there are existing nodes/edges
            if (nodes.length > 0 || edges.length > 0) {
              if (!window.confirm('Import workflow? This will replace the current workflow. Any unsaved changes will be lost.')) {
                return;
              }
            }

            // Load the flow data
            try {
              loadFlow(flowData);

              // Update workflow name if provided
              if (flowData.name) {
                setWorkflowName(flowData.name);
              }
            } catch (loadError) {
              console.error('Flow loading error:', loadError);
              throw new Error(`Failed to load workflow data: ${loadError instanceof Error ? loadError.message : 'Unknown loading error'}`);
            }

            // Import variables if they exist
            if (flowData.variables && Array.isArray(flowData.variables)) {
              flowData.variables.forEach((variable: any) => {
                // Variables will be loaded through the loadFlow function
                // which handles the complete workflow context
              });
            }

            const importedItems = [];
            if (flowData.nodes?.length) importedItems.push(`${flowData.nodes.length} nodes`);
            if (flowData.edges?.length) importedItems.push(`${flowData.edges.length} edges`);
            if (flowData.variables?.length) importedItems.push(`${flowData.variables.length} variables`);
            if (flowData.config) importedItems.push('configuration');

            const itemsText = importedItems.length > 0 ? ` (${importedItems.join(', ')})` : '';
            toast.success(`Workflow "${flowData.name || 'Untitled'}" imported successfully!${itemsText}`);
          } catch (error) {
            console.error('Import error:', error);
            toast.error(`Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleValidate = () => {
    const variables = getAvailableVariables();
    const validationResult = validateFlow(nodes, edges, variables);

    if (validationResult.errors.length > 0) {
      toast.error(`Validation failed: ${validationResult.errors.slice(0, 3).join(', ')}${validationResult.errors.length > 3 ? '...' : ''}`);
    } else if (validationResult.warnings.length > 0) {
      toast.warning(`Validation warnings: ${validationResult.warnings.slice(0, 3).join(', ')}${validationResult.warnings.length > 3 ? '...' : ''}`);
    } else {
      toast.success('Flow validation passed!');
    }

    // Log detailed results to console for debugging
    console.log('Flow validation result:', validationResult);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left Section - Navigation and Flow Name */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>

        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="border-none shadow-none p-0 font-semibold text-lg focus-visible:ring-0"
            placeholder="Untitled Flow"
          />
          {lastSavedTime && (
            <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
              Saved {lastSavedTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Center Section - Execution Controls */}
      <div className="flex items-center space-x-2">
        {!isExecuting ? (
          <Button
            onClick={handleExecute}
            className="flex items-center space-x-2"
            disabled={nodes.length === 0}
          >
            <Play className="h-4 w-4" />
            <span>Execute</span>
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <Square className="h-4 w-4" />
            <span>Stop</span>
          </Button>
        )}
        
        <Button
          onClick={handleValidate}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Validate</span>
        </Button>
      </div>

      {/* Right Section - File Operations */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleEditWorkflow}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Edit Workflow</span>
        </Button>

        
        <Button
          onClick={handleSave}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
        
        <Button
          onClick={handleImport}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Import</span>
        </Button>
        
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>

        <Button
          onClick={() => {
            addDefaultVariables();
            toast.success('Default variables added for testing');
          }}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
          title="Add default variables for testing conditional edges"
        >
          <Zap className="h-4 w-4" />
          <span>Add Variables</span>
        </Button>

        <Dialog open={isGlobalPromptOpen} onOpenChange={setIsGlobalPromptOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4" />
              <span>Global Prompt</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Global System Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="globalPrompt">System Prompt</Label>
                <Textarea
                  id="globalPrompt"
                  value={globalPrompt}
                  onChange={(e) => setGlobalPrompt(e.target.value)}
                  placeholder="Enter global system prompt that applies to all AI interactions..."
                  className="mt-2 min-h-[200px]"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-2">
                  This prompt will be applied globally to all conversation nodes in your workflow.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsGlobalPromptOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Apply global prompt to start node to keep them in sync
                    const startNode = nodes.find(node => node.type === 'startNode');
                    if (startNode && updateNode) {
                      updateNode(startNode.id, { globalPrompt });
                    }
                    toast.success('Global prompt updated and synced with start node!');
                    setIsGlobalPromptOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => setIsPlaygroundOpen(true)}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
          disabled={nodes.length === 0}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Playground</span>
        </Button>

        {/* Workflow Setup Modal */}
        <WorkflowSetupModal
          isOpen={isWorkflowSetupOpen}
          onClose={() => setIsWorkflowSetupOpen(false)}
          onSave={handleWorkflowSetupSave}
          initialConfig={workflowConfig}
        />

        {/* Playground Modal */}
        <PlaygroundModal
          isOpen={isPlaygroundOpen}
          onClose={() => setIsPlaygroundOpen(false)}
          nodes={nodes}
          edges={edges}
          workflowConfig={workflowConfig}
          globalPrompt={globalPrompt}
          onUpdateWorkflowConfig={setWorkflowConfig}
          onSaveFlow={saveFlow}
        />
      </div>
    </div>
  );
};

export default FlowToolbar;
