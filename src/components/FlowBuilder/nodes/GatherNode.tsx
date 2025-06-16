
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { GatherNodeData } from '../../../types/flowTypes';

const GatherNode: React.FC<NodeProps<GatherNodeData>> = ({ data }) => {
  const [input, setInput] = useState(data?.input || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (data?.onChange) {
      data.onChange({ input: e.target.value });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[250px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium mb-2">Gather Input</div>
      
      <Input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Enter prompt for user input"
        className="w-full"
      />

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

export default GatherNode;
