
import { useCallback, RefObject } from 'react';
import { useReactFlow } from '@xyflow/react';

export const useDragAndDrop = (
  reactFlowWrapper: RefObject<HTMLDivElement>,
  createNewNode: (type: string, position: {x: number, y: number}) => void
) => {
  const reactFlowInstance = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      createNewNode(type, position);
    },
    [reactFlowInstance, reactFlowWrapper, createNewNode]
  );

  return {
    onDragOver,
    onDrop
  };
};
