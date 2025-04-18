
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ApiRequestNodeData {
  method?: string;
  url?: string;
  body?: string;
  onChange?: (params: { method: string; url: string; body: string }) => void;
}

const ApiRequestNode: React.FC<NodeProps<ApiRequestNodeData>> = ({ data }) => {
  const [method, setMethod] = useState(data?.method || 'GET');
  const [url, setUrl] = useState(data?.url || '');
  const [body, setBody] = useState(data?.body || '');

  const handleChange = (field: string, value: string) => {
    if (field === 'method') setMethod(value);
    if (field === 'url') setUrl(value);
    if (field === 'body') setBody(value);

    if (data?.onChange) {
      data.onChange({
        method: field === 'method' ? value : method,
        url: field === 'url' ? value : url,
        body: field === 'body' ? value : body,
      });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[300px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium mb-2">API Request</div>
      
      <div className="space-y-3">
        <select
          value={method}
          onChange={(e) => handleChange('method', e.target.value)}
          className="w-full border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <Input
          type="text"
          value={url}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="Enter API URL"
          className="w-full"
        />

        <Textarea
          value={body}
          onChange={(e) => handleChange('body', e.target.value)}
          placeholder="Request body (JSON)"
          rows={3}
          className="w-full"
        />
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="b"
        className="w-3 h-3 top-0 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-3 h-3 bottom-0 bg-blue-500"
      />
    </div>
  );
};

export default ApiRequestNode;
