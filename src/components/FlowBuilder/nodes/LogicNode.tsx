
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { useReactFlow } from '@xyflow/react';

interface LogicNodeData {
  logicType?: string;
  value?: string;
  onChange?: (params: { logicType: string; value: string }) => void;
}

const LogicNode: React.FC<NodeProps<LogicNodeData>> = ({ id, data, xPos, yPos }) => {
  const [logicType, setLogicType] = useState(data?.logicType || '');
  const [value, setValue] = useState(data?.value || '');
  const { setNodes, setEdges } = useReactFlow();

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLogicType(newValue);
    
    if (newValue === 'condition' && !value) {
      // Create "if" and "else" nodes when condition is selected
      const ifNode = {
        id: `${id}-if`,
        type: 'default',
        data: { label: 'If Branch' },
        position: { x: 100, y: 100 }, // Relative to parent
      };

      const elseNode = {
        id: `${id}-else`,
        type: 'default',
        data: { label: 'Else Branch' },
        position: { x: -100, y: 100 }, // Relative to parent
      };

      setNodes((nodes) => [...nodes, ifNode, elseNode]);

      // Create edges connecting to "if" and "else" nodes
      const newEdges = [
        {
          id: `${id}-to-if`,
          source: id,
          target: `${id}-if`,
          sourceHandle: 'true',
          type: 'smoothstep',
        },
        {
          id: `${id}-to-else`,
          source: id,
          target: `${id}-else`,
          sourceHandle: 'false',
          type: 'smoothstep',
        },
      ];

      setEdges((edges) => [...edges, ...newEdges]);
    }

    if (data?.onChange) {
      data.onChange({ logicType: newValue, value });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (data?.onChange) {
      data.onChange({ logicType, value: e.target.value });
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white p-4 shadow-md min-w-[250px]">
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      </div>
      <div className="text-center font-medium mb-2">Logic</div>
      
      <div className="space-y-3">
        <select
          value={logicType}
          onChange={handleTypeChange}
          className="w-full border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select Type</option>
          <option value="condition">Condition</option>
          <option value="set">Set Variable</option>
          <option value="component">Component</option>
          <option value="end">End</option>
        </select>

        <Input
          type="text"
          value={value}
          onChange={handleValueChange}
          placeholder={logicType === 'condition' ? 'Enter condition' : 
            logicType === 'set' ? 'Variable name' :
            logicType === 'component' ? 'Component name' : ''}
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
      {logicType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 right-0 bg-green-500"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            className="w-3 h-3 left-0 bg-red-500"
          />
        </>
      )}
    </div>
  );
};

export default LogicNode;
