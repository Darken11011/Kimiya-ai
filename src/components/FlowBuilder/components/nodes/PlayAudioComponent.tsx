import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { Globe } from 'lucide-react';

interface APIRequestComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const APIRequestComponent: React.FC<APIRequestComponentProps> = ({
  id,
  data
}) => {
  const { updateNode } = useFlowStore();
  const [url, setUrl] = useState<string>((data.url as string) || '');
  const [method, setMethod] = useState<string>((data.method as string) || 'POST');
  const [requestBody, setRequestBody] = useState<string>((data.requestBody as string) || '');
  const [headers, setHeaders] = useState<string>((data.headers as string) || '');

  useEffect(() => {
    setUrl((data.url as string) || '');
    setMethod((data.method as string) || 'POST');
    setRequestBody((data.requestBody as string) || '');
    setHeaders((data.headers as string) || '');
  }, [data.url, data.method, data.requestBody, data.headers]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    updateNode(id, { url: value });
  };

  const handleMethodChange = (value: string) => {
    setMethod(value);
    updateNode(id, { method: value });
  };

  const handleRequestBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRequestBody(value);
    updateNode(id, { requestBody: value });
  };

  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setHeaders(value);
    updateNode(id, { headers: value });
  };

  const methodOptions = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'DELETE', label: 'DELETE' }
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`url-${id}`} className="text-sm font-medium">
          API URL
        </Label>
        <Input
          id={`url-${id}`}
          value={url}
          onChange={handleUrlChange}
          placeholder="https://api.example.com/endpoint"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor={`method-${id}`} className="text-sm font-medium">
          HTTP Method
        </Label>
        <Select value={method} onValueChange={handleMethodChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select HTTP method" />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`headers-${id}`} className="text-sm font-medium">
          Headers (JSON)
        </Label>
        <Textarea
          id={`headers-${id}`}
          value={headers}
          onChange={handleHeadersChange}
          placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
          className="mt-1 min-h-[60px]"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor={`body-${id}`} className="text-sm font-medium">
          Request Body (JSON)
        </Label>
        <Textarea
          id={`body-${id}`}
          value={requestBody}
          onChange={handleRequestBodyChange}
          placeholder='{"key": "value", "variable": "{{extracted_variable}}"}'
          className="mt-1 min-h-[80px]"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use liquid syntax like {`{{variable_name}}`} to include extracted variables
        </p>
      </div>
    </div>
  );
};

// Component definition
export const apiRequestDefinition: ComponentDefinition = {
  type: 'apiRequest',
  displayName: 'API Request',
  description: 'Make HTTP requests to external APIs',
  category: 'Data',
  icon: <Globe size={16} />,
  color: '#059669', // emerald-600
  inputs: [
    {
      name: 'url',
      type: 'text',
      label: 'API URL',
      description: 'The endpoint URL to make the request to',
      required: true,
      validation: {
        pattern: '^https?://.+',
        message: 'Please enter a valid HTTP/HTTPS URL'
      }
    },
    {
      name: 'method',
      type: 'select',
      label: 'HTTP Method',
      description: 'The HTTP method to use for the request',
      required: true,
      defaultValue: 'POST',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' }
      ]
    },
    {
      name: 'headers',
      type: 'textarea',
      label: 'Headers (JSON)',
      description: 'HTTP headers in JSON format',
      required: false
    },
    {
      name: 'requestBody',
      type: 'textarea',
      label: 'Request Body (JSON)',
      description: 'Request body in JSON format. Use {{variable}} for dynamic values',
      required: false
    }
  ],
  outputs: [
    {
      name: 'response',
      type: 'object',
      description: 'The API response data'
    },
    {
      name: 'statusCode',
      type: 'number',
      description: 'HTTP status code of the response'
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
    url: '',
    method: 'POST',
    headers: '{"Content-Type": "application/json"}',
    requestBody: '{}'
  },
  component: APIRequestComponent,
  tags: ['api', 'http', 'request', 'webhook', 'integration'],
  documentation: 'Make HTTP requests to external APIs or webhooks. Supports dynamic variables from previous conversation nodes using liquid syntax.'
};

export default APIRequestComponent;
