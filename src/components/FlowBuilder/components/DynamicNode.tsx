import React from 'react';
import { NodeProps } from '@xyflow/react';
import { useFlowStore } from '../../../stores/flowStore';
import BaseNode from './BaseNode';

const DynamicNode: React.FC<NodeProps> = (props) => {
  const { getComponent } = useFlowStore();

  // Get component definition from registry
  const componentDef = getComponent(props.type);

  if (!componentDef) {
    return (
      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 min-w-[200px]">
        <div className="text-red-600 font-semibold">Unknown Component</div>
        <div className="text-red-500 text-sm">Type: {props.type}</div>
      </div>
    );
  }

  // Render the component using its registered React component
  const ComponentRenderer = componentDef.component;
  
  return (
    <BaseNode {...props} definition={componentDef}>
      <ComponentRenderer {...props} definition={componentDef} />
    </BaseNode>
  );
};

export default DynamicNode;
