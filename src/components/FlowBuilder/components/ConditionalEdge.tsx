import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow
} from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Zap, Code, Combine, Route } from 'lucide-react';
import { ConditionType, EdgeConditionData, ConditionalEdge } from '../../../types/flowTypes';
import { useFlowStore } from '../../../stores/flowStore';
import EdgeConditionModal from './EdgeConditionModal';

interface ConditionalEdgeProps extends EdgeProps {
  data?: EdgeConditionData;
}

const ConditionalEdgeComponent: React.FC<ConditionalEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const { setEdges } = useReactFlow();
  const { getAvailableVariables } = useFlowStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getConditionIcon = (type: ConditionType) => {
    switch (type) {
      case ConditionType.AI_BASED:
        return <Zap className="w-3 h-3" />;
      case ConditionType.LOGICAL:
        return <Code className="w-3 h-3" />;
      case ConditionType.COMBINED:
        return <Combine className="w-3 h-3" />;
      default:
        return <Route className="w-3 h-3" />;
    }
  };

  const getConditionSummary = (data: EdgeConditionData): string => {
    switch (data.type) {
      case ConditionType.AI_BASED:
        return data.aiCondition?.substring(0, 30) + (data.aiCondition && data.aiCondition.length > 30 ? '...' : '') || 'AI Condition';
      case ConditionType.LOGICAL:
        if (data.logicalConditions && data.logicalConditions.length > 0) {
          const first = data.logicalConditions[0];
          const summary = `${first.variable} ${first.operator} ${first.value}`;
          return data.logicalConditions.length > 1 ? `${summary} +${data.logicalConditions.length - 1} more` : summary;
        }
        return 'Logical Condition';
      case ConditionType.COMBINED:
        return data.combinedCondition?.substring(0, 30) + (data.combinedCondition && data.combinedCondition.length > 30 ? '...' : '') || 'Combined Condition';
      case ConditionType.NONE:
        return data.isDefault ? 'Default Path' : 'No Condition';
      default:
        return 'Condition';
    }
  };

  const getConditionColor = (type: ConditionType, isDefault?: boolean) => {
    if (isDefault) return 'bg-gray-100 text-gray-700 border-gray-300';
    
    switch (type) {
      case ConditionType.AI_BASED:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case ConditionType.LOGICAL:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case ConditionType.COMBINED:
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getEdgeStyle = (type: ConditionType, isDefault?: boolean) => {
    if (isDefault) {
      return {
        ...style,
        strokeDasharray: '5,5',
        stroke: '#6b7280',
        strokeWidth: 2
      };
    }

    switch (type) {
      case ConditionType.AI_BASED:
        return { ...style, stroke: '#8b5cf6', strokeWidth: 2 };
      case ConditionType.LOGICAL:
        return { ...style, stroke: '#3b82f6', strokeWidth: 2 };
      case ConditionType.COMBINED:
        return { ...style, stroke: '#10b981', strokeWidth: 2 };
      default:
        return { ...style, stroke: '#6b7280', strokeWidth: 2 };
    }
  };

  const handleSaveCondition = (conditionData: EdgeConditionData) => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: conditionData,
            style: getEdgeStyle(conditionData.type, conditionData.isDefault)
          } as ConditionalEdge;
        }
        return edge;
      })
    );
  };

  const edgeStyle = data ? getEdgeStyle(data.type, data.isDefault) : style;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {data && data.type !== ConditionType.NONE ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:shadow-md transition-shadow ${getConditionColor(data.type, data.isDefault)}`}
                onClick={() => setIsModalOpen(true)}
              >
                {getConditionIcon(data.type)}
                <span className="text-xs font-medium">
                  {getConditionSummary(data)}
                </span>
              </Badge>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs bg-white hover:bg-gray-50 border-dashed"
              onClick={() => setIsModalOpen(true)}
            >
              <Settings className="w-3 h-3 mr-1" />
              Add Condition
            </Button>
          )}
        </div>
      </EdgeLabelRenderer>

      <EdgeConditionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCondition}
        initialData={data}
        availableVariables={getAvailableVariables()}
        edgeId={id}
      />
    </>
  );
};

export default ConditionalEdgeComponent;
