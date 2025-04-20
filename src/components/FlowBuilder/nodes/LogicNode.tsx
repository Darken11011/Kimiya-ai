
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Input } from "@/components/ui/input";
import { useReactFlow } from '@xyflow/react';

interface LogicNodeData {
  logicType?: string;
  value?: string;
  onChange?: (params: { logicType: string; value: string }) => void;
}

interface BranchNodeProps {
  title: string;
  conditionType: string;
  conditionValue: string;
  onConditionTypeChange: (value: string) => void;
  onConditionValueChange: (value: string) => void;
}

// Create a custom branch node content component
const BranchNodeContent = ({ title, conditionType, conditionValue, onConditionTypeChange, onConditionValueChange }: BranchNodeProps) => {
  return (
    <div className="space-y-2 p-2">
      <div className="font-medium">{title}</div>
      <select 
        value={conditionType}
        onChange={(e) => onConditionTypeChange(e.target.value)}
        className="w-full border-input bg-background ring-offset-background focus:ring-ring flex h-8 rounded-md border px-3 py-1 text-sm"
      >
        <option value="equals">equals</option>
        <option value="not_equals">not equals</option>
        <option value="greater_than">greater than</option>
        <option value="less_than">less than</option>
      </select>
      <Input 
        type="text" 
        placeholder="Enter value" 
        className="h-8"
        value={conditionValue}
        onChange={(e) => onConditionValueChange(e.target.value)}
      />
    </div>
  );
};

const LogicNode = ({ id, data }: NodeProps<LogicNodeData>) => {
  const [logicType, setLogicType] = useState(data?.logicType || '');
  const [value, setValue] = useState(data?.value || '');
  const { setNodes, setEdges } = useReactFlow();

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLogicType(newValue);
    
    if (newValue === 'condition') {
      // Create nodes for if/else branches with proper condition UI
      const ifNode = {
        id: `${id}-if`,
        type: 'default',
        data: { 
          label: (
            <BranchNodeContent 
              title="If Condition"
              conditionType="equals"
              conditionValue=""
              onConditionTypeChange={(value) => {
                setNodes(nodes => 
                  nodes.map(node => {
                    if (node.id === `${id}-if`) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          conditionType: value
                        }
                      };
                    }
                    return node;
                  })
                );
              }}
              onConditionValueChange={(value) => {
                setNodes(nodes => 
                  nodes.map(node => {
                    if (node.id === `${id}-if`) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          conditionValue: value
                        }
                      };
                    }
                    return node;
                  })
                );
              }}
            />
          ),
          conditionType: "equals",
          conditionValue: "",
          selectable: true,
        },
        position: { x: 200, y: 100 },
      };

      const elseNode = {
        id: `${id}-else`,
        type: 'default',
        data: { 
          label: (
            <BranchNodeContent 
              title="Else Condition"
              conditionType="equals"
              conditionValue=""
              onConditionTypeChange={(value) => {
                setNodes(nodes => 
                  nodes.map(node => {
                    if (node.id === `${id}-else`) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          conditionType: value
                        }
                      };
                    }
                    return node;
                  })
                );
              }}
              onConditionValueChange={(value) => {
                setNodes(nodes => 
                  nodes.map(node => {
                    if (node.id === `${id}-else`) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          conditionValue: value
                        }
                      };
                    }
                    return node;
                  })
                );
              }}
            />
          ),
          conditionType: "equals",
          conditionValue: "",
          selectable: true,
        },
        position: { x: -200, y: 100 },
      };

      setNodes((nodes) => [...nodes, ifNode, elseNode]);

      // Create edges for both branches
      const newEdges = [
        {
          id: `${id}-to-if`,
          source: id,
          target: `${id}-if`,
          type: 'smoothstep',
        },
        {
          id: `${id}-to-else`,
          source: id,
          target: `${id}-else`,
          type: 'smoothstep',
        }
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
          className="w-full border-input bg-background ring-offset-background focus:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm"
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
    </div>
  );
};

export default LogicNode;
