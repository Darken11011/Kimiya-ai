
import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { TransferCallNodeData } from '../../../types/flowTypes';

const TransferCallNode: React.FC<NodeProps<TransferCallNodeData>> = ({ data }) => {
  const handlePhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({ phoneNumber: e.target.value });
    }
  }, [data]);

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[250px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23h8"/>
            <path d="M11 19v4"/>
            <path d="M15 13v2a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4v-2"/>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium mb-2">Transfer Call</div>
      
      <Input
        type="tel"
        value={data.phoneNumber || ""}
        onChange={handlePhoneNumberChange}
        placeholder="Enter phone number"
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

export default TransferCallNode;
