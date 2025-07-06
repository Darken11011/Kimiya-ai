import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Phone, 
  Clock, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings,
  Play,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useFlowStore } from '../stores/flowStore';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  lastModified: string;
  callsCount: number;
  successRate: number;
  nodes: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { loadFlow, setWorkflowName } = useFlowStore();
  const [workflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Customer Support Flow',
      description: 'Automated customer support with AI routing',
      status: 'active',
      lastModified: '2024-01-15',
      callsCount: 1247,
      successRate: 94.2,
      nodes: 8
    },
    {
      id: '2',
      name: 'Sales Qualification',
      description: 'Lead qualification and appointment booking',
      status: 'active',
      lastModified: '2024-01-14',
      callsCount: 856,
      successRate: 87.5,
      nodes: 12
    },
    {
      id: '3',
      name: 'Survey Collection',
      description: 'Customer feedback and survey collection',
      status: 'draft',
      lastModified: '2024-01-13',
      callsCount: 0,
      successRate: 0,
      nodes: 6
    }
  ]);

  const handleNewWorkflow = () => {
    navigate('/builder');
  };

  const handleImportWorkflow = () => {
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

            // Navigate to the builder with the imported workflow
            navigate('/builder');

            // Show success message
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

  const handleEditWorkflow = (workflowId: string) => {
    navigate(`/builder?workflow=${workflowId}`);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    toast.success(`Workflow deleted successfully`);
  };

  const handleExportWorkflow = (workflowId: string) => {
    toast.success(`Workflow exported successfully`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      title: 'Total Workflows',
      value: workflows.length.toString(),
      icon: FileText,
      description: 'Active and draft workflows'
    },
    {
      title: 'Total Calls',
      value: workflows.reduce((sum, w) => sum + w.callsCount, 0).toLocaleString(),
      icon: Phone,
      description: 'Calls processed this month'
    },
    {
      title: 'Average Success Rate',
      value: `${(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Across all active workflows'
    },
    {
      title: 'Active Workflows',
      value: workflows.filter(w => w.status === 'active').length.toString(),
      icon: Play,
      description: 'Currently running workflows'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img src="/icon.png" alt="Kimiyi Logo" className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kimiyi Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your voice agent workflows</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleNewWorkflow} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleNewWorkflow}
              >
                <Plus className="h-6 w-6 mb-2" />
                Create New Workflow
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleImportWorkflow}
              >
                <Upload className="h-6 w-6 mb-2" />
                Import Workflow
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.open('/docs', '_blank')}
              >
                <FileText className="h-6 w-6 mb-2" />
                View Documentation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflows List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>Manage and monitor your voice agent workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{workflow.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Modified {workflow.lastModified}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {workflow.callsCount.toLocaleString()} calls
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {workflow.successRate}% success
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {workflow.nodes} nodes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportWorkflow(workflow.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
