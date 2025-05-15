
import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

export const useKeyboardShortcuts = (
  nodes: Node[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
) => {
  // Handle node deletion via keyboard
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Get selected nodes
      const selectedNodeIds = nodes
        .filter((node) => node.selected)
        .map(node => node.id);
      
      if (selectedNodeIds.length > 0) {
        // Remove selected nodes
        setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
        // Remove edges connected to deleted nodes
        setEdges((eds) => eds.filter((edge) => 
          !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        ));
      }
    }
  }, [nodes, setNodes, setEdges]);

  return { onKeyDown };
};
