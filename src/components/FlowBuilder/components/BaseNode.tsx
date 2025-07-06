import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ComponentDefinition, ComponentHandle } from '../../../types/componentTypes';
import { useFlowStore } from '../../../stores/flowStore';
import { cn } from '@/lib/utils';

interface BaseNodeProps extends NodeProps {
  definition: ComponentDefinition;
  children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  selected,
  definition,
  children
}) => {
  const { selectNode, selectedNodeId } = useFlowStore();

  const handleClick = () => {
    selectNode(id);
  };

  const renderHandle = (handle: ComponentHandle) => {
    const getPosition = (pos: string) => {
      switch (pos.toLowerCase()) {
        case 'top': return Position.Top;
        case 'bottom': return Position.Bottom;
        case 'left': return Position.Left;
        case 'right': return Position.Right;
        default: return Position.Bottom;
      }
    };

    const getPositionStyle = (pos: string) => {
      switch (pos.toLowerCase()) {
        case 'top': return { top: -12 };
        case 'bottom': return { bottom: -12 };
        case 'left': return { left: -12 };
        case 'right': return { right: -12 };
        default: return { bottom: -12 };
      }
    };

    return (
      <Handle
        key={handle.id}
        type={handle.type}
        position={getPosition(handle.position)}
        id={handle.id}
        className={cn(
          "w-6 h-6 border-4 border-white rounded-full shadow-lg cursor-pointer transition-colors",
          handle.className,
          {
            'bg-blue-500 hover:bg-blue-600': handle.type === 'target',
            'bg-green-500 hover:bg-green-600': handle.type === 'source'
          }
        )}
        style={{
          zIndex: 1000,
          ...getPositionStyle(handle.position),
          backgroundColor: handle.type === 'target' ? '#3b82f6' : '#10b981',
          border: '3px solid white',
          ...handle.style
        }}
        isConnectable={true}
      />
    );
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-white shadow-lg transition-all duration-200 min-w-[200px]",
        "hover:shadow-xl cursor-pointer",
        {
          'border-blue-500 shadow-blue-200': selected || selectedNodeId === id,
          'border-gray-300': !selected && selectedNodeId !== id,
          'ring-2 ring-blue-300 ring-opacity-50': selectedNodeId === id
        }
      )}
      onClick={handleClick}
      style={{ borderColor: selected ? definition.color : undefined }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 rounded-t-lg flex items-center space-x-3"
        style={{ backgroundColor: `${definition.color}15` }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: definition.color }}
        >
          {definition.icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">
            {definition.displayName}
          </div>
          <div className="text-xs text-gray-500">
            {definition.description}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {children}
      </div>

      {/* Render only the handles specified in the definition */}
      {definition.handles && definition.handles.length > 0 ? (
        definition.handles.map(renderHandle)
      ) : (
        // Fallback: render both handles if no handles are defined (for backward compatibility)
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            className="w-6 h-6 border-4 border-white rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 cursor-pointer"
            style={{
              zIndex: 1000,
              top: -12,
              backgroundColor: '#3b82f6',
              border: '3px solid white'
            }}
            isConnectable={true}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="w-6 h-6 border-4 border-white rounded-full shadow-lg bg-green-500 hover:bg-green-600 cursor-pointer"
            style={{
              zIndex: 1000,
              bottom: -12,
              backgroundColor: '#10b981',
              border: '3px solid white'
            }}
            isConnectable={true}
          />
        </>
      )}
    </div>
  );
};

export default BaseNode;
