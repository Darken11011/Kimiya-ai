
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface PlayAudioNodeData {
  audioMessage?: string;
  onChange?: (params: { audioMessage: string }) => void;
}

const PlayAudioNode: React.FC<NodeProps<PlayAudioNodeData>> = ({ data }) => {
  const [audioMessage, setAudioMessage] = useState(data?.audioMessage || 'Welcome to our service. How can I help you today?');

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAudioMessage(e.target.value);
    // Update node data
    if (data?.onChange) {
      data.onChange({ audioMessage: e.target.value });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[250px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
      </div>
      <div className="text-center font-medium">Agent</div>
      
      <div className="mt-3">
        <textarea
          className="w-full p-2 border border-gray-300 rounded text-sm h-20"
          value={audioMessage}
          onChange={handleMessageChange}
          placeholder="Enter audio message here..."
          id="audioMessage"
          name="audioMessage"
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

export default PlayAudioNode;
