import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { Wrench } from 'lucide-react';

interface ToolNodeComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const ToolNodeComponent: React.FC<ToolNodeComponentProps> = ({ 
  id, 
  data
}) => {
  const { updateNode } = useFlowStore();
  const [toolName, setToolName] = useState<string>((data.toolName as string) || '');
  const [toolDescription, setToolDescription] = useState<string>((data.toolDescription as string) || '');
  const [serverUrl, setServerUrl] = useState<string>((data.serverUrl as string) || '');
  const [parameters, setParameters] = useState<string>((data.parameters as string) || '');
  const [async, setAsync] = useState<string>((data.async as string) || 'false');

  useEffect(() => {
    setToolName((data.toolName as string) || '');
    setToolDescription((data.toolDescription as string) || '');
    setServerUrl((data.serverUrl as string) || '');
    setParameters((data.parameters as string) || '');
    setAsync((data.async as string) || 'false');
  }, [data.toolName, data.toolDescription, data.serverUrl, data.parameters, data.async]);

  const handleToolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToolName(value);
    updateNode(id, { toolName: value });
  };

  const handleToolDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setToolDescription(value);
    updateNode(id, { toolDescription: value });
  };

  const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setServerUrl(value);
    updateNode(id, { serverUrl: value });
  };

  const handleParametersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setParameters(value);
    updateNode(id, { parameters: value });
  };

  const handleAsyncChange = (value: string) => {
    setAsync(value);
    updateNode(id, { async: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`toolName-${id}`} className="text-sm font-medium">
          Tool Name
        </Label>
        <Input
          id={`toolName-${id}`}
          value={toolName}
          onChange={handleToolNameChange}
          placeholder="get_weather, send_email, etc."
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor={`description-${id}`} className="text-sm font-medium">
          Tool Description
        </Label>
        <Textarea
          id={`description-${id}`}
          value={toolDescription}
          onChange={handleToolDescriptionChange}
          placeholder="Describe what this tool does..."
          className="mt-1 min-h-[60px]"
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor={`serverUrl-${id}`} className="text-sm font-medium">
          Server URL
        </Label>
        <Input
          id={`serverUrl-${id}`}
          value={serverUrl}
          onChange={handleServerUrlChange}
          placeholder="https://api.example.com/tool"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor={`parameters-${id}`} className="text-sm font-medium">
          Parameters (JSON Schema)
        </Label>
        <Textarea
          id={`parameters-${id}`}
          value={parameters}
          onChange={handleParametersChange}
          placeholder='{"type": "object", "properties": {"location": {"type": "string"}}, "required": ["location"]}'
          className="mt-1 min-h-[80px]"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor={`async-${id}`} className="text-sm font-medium">
          Async Mode
        </Label>
        <Select value={async} onValueChange={handleAsyncChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select async mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Synchronous</SelectItem>
            <SelectItem value="true">Asynchronous</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Component definition
export const toolNodeDefinition: ComponentDefinition = {
  type: 'toolNode',
  displayName: 'Tool Node',
  description: 'Execute custom tools and functions',
  category: 'Utility',
  icon: <Wrench size={16} />,
  color: '#6366f1', // indigo-500
  inputs: [
    {
      name: 'toolName',
      type: 'text',
      label: 'Tool Name',
      description: 'The name/identifier of the tool function',
      required: true
    },
    {
      name: 'toolDescription',
      type: 'textarea',
      label: 'Tool Description',
      description: 'Description of what the tool does',
      required: true
    },
    {
      name: 'serverUrl',
      type: 'text',
      label: 'Server URL',
      description: 'The endpoint where the tool is hosted',
      required: true,
      validation: {
        pattern: '^https?://.+',
        message: 'Please enter a valid HTTP/HTTPS URL'
      }
    },
    {
      name: 'parameters',
      type: 'textarea',
      label: 'Parameters (JSON Schema)',
      description: 'JSON schema defining the tool parameters',
      required: false
    },
    {
      name: 'async',
      type: 'select',
      label: 'Async Mode',
      description: 'Whether the tool should run asynchronously',
      required: false,
      defaultValue: 'false',
      options: [
        { label: 'Synchronous', value: 'false' },
        { label: 'Asynchronous', value: 'true' }
      ]
    }
  ],
  outputs: [
    {
      name: 'result',
      type: 'object',
      description: 'The tool execution result'
    },
    {
      name: 'success',
      type: 'boolean',
      description: 'Whether the tool executed successfully'
    }
  ],
  handles: [
    {
      id: 'input',
      type: 'target',
      position: 'top'
    },
    {
      id: 'output',
      type: 'source',
      position: 'bottom'
    }
  ],
  defaultData: {
    toolName: '',
    toolDescription: '',
    serverUrl: '',
    parameters: '{"type": "object", "properties": {}, "required": []}',
    async: 'false'
  },
  component: ToolNodeComponent,
  tags: ['tool', 'function', 'custom', 'api', 'integration'],
  documentation: 'Execute custom tools and functions. Configure the tool name, description, server URL, and parameters to integrate with external services.'
};

export default ToolNodeComponent;
