
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const AINode: React.FC<NodeProps> = ({ data }) => {
  const [flowId, setFlowId] = useState((data.flowId as string) || '');

  const handleFlowIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlowId(e.target.value);
    // Update node data
    if (data.onChange && typeof data.onChange === 'function') {
      data.onChange({ flowId: e.target.value });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[250px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 2a5 5 0 1 0 5 5"></path>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
            <path d="M7.5 10.5A3 3 0 0 0 8 15h12"></path>
            <path d="M22 17v-1a2 2 0 0 0-2-2h-3"></path>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium">AI Node</div>
      <div className="text-xs text-gray-500 text-center mt-1">Langflow integration</div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Langflow Flow ID
        </label>
        <input
          className="w-full p-2 border border-gray-300 rounded text-sm"
          value={flowId}
          onChange={handleFlowIdChange}
          placeholder="Enter Langflow Flow ID"
          id="flowId"
          name="flowId"
        />
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="b"
        className="w-3 h-3 top-0 bg-blue-500"
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-3 h-3 bottom-0 bg-blue-500"
      />
    </div>
  );
};

export default AINode;
