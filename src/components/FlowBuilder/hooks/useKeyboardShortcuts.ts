
import { useCallback } from 'react';
import { Node, Edge, applyEdgeChanges, EdgeChange } from '@xyflow/react';

export const useKeyboardShortcuts = (
  nodes: Node[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  onEdgesChange: (changes: EdgeChange[]) => void
) => {
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && event.target === document.body) {
        const selectedNodes = nodes.filter((node) => node.selected);
        
        if (selectedNodes.length > 0) {
          // Remove selected nodes
          setNodes((nds) => nds.filter((node) => !node.selected));
          
          // Remove edges connected to these nodes
          const nodeIds = selectedNodes.map((node) => node.id);
          onEdgesChange([
            ...nodeIds.map((id) => ({ id, type: 'remove' as const })),
          ]);
        }
      }
    },
    [nodes, setNodes, onEdgesChange]
  );

  return { onKeyDown };
};
