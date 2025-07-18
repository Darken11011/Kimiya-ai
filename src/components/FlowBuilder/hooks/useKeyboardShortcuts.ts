
import { useCallback } from 'react';
import { Node, Edge, applyEdgeChanges, EdgeChange } from '@xyflow/react';

export const useKeyboardShortcuts = (
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  onEdgesChange: (changes: EdgeChange[]) => void
) => {
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Backspace' && event.target === document.body) {
        const selectedNodes = nodes.filter((node) => node.selected);

        if (selectedNodes.length > 0) {
          // Only disconnect edges connected to selected nodes, don't delete the nodes
          const nodeIds = selectedNodes.map((node) => node.id);
          const edgesToRemove = edges.filter(edge =>
            nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
          );

          if (edgesToRemove.length > 0) {
            onEdgesChange(
              edgesToRemove.map((edge) => ({ id: edge.id, type: 'remove' as const }))
            );
          }

          // Deselect the nodes after disconnecting
          setNodes((nds) => nds.map(node => ({ ...node, selected: false })));
        }
      } else if (event.key === 'Delete' && event.target === document.body) {
        // Delete key still deletes nodes (for users who want to actually delete)
        const selectedNodes = nodes.filter((node) => node.selected);

        if (selectedNodes.length > 0) {
          // Remove selected nodes
          setNodes((nds) => nds.filter((node) => !node.selected));

          // Remove edges connected to these nodes
          const nodeIds = selectedNodes.map((node) => node.id);
          const edgesToRemove = edges.filter(edge =>
            nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
          );

          if (edgesToRemove.length > 0) {
            onEdgesChange(
              edgesToRemove.map((edge) => ({ id: edge.id, type: 'remove' as const }))
            );
          }
        }
      }
    },
    [nodes, edges, setNodes, onEdgesChange]
  );

  return { onKeyDown };
};
