
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const EndCallNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.574 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"></path>
            <line x1="2" y1="2" x2="22" y2="22"></line>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium">End Call</div>
      <div className="text-xs text-gray-500 text-center mt-1">Terminates the call</div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="b"
        className="w-3 h-3 top-0 bg-blue-500"
      />
    </div>
  );
};

export default EndCallNode;
