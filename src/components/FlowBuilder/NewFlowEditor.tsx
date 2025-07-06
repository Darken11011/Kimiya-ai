import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '../../stores/flowStore';
import { registerCoreComponents } from './components/nodes';
import componentRegistry from '../../lib/componentRegistry';

import NewSidebar from './NewSidebar';
import NewFlowCanvas from './NewFlowCanvas';
import ConfigPanel from './ConfigPanel';
import FlowToolbar from './FlowToolbar';

const NewFlowEditorContent: React.FC = () => {
  const {
    registerComponent,
    isConfigPanelOpen,
    selectedNodeId
  } = useFlowStore();

  // Register all core components on mount
  useEffect(() => {
    registerCoreComponents(componentRegistry);

    // Also register them in the store
    componentRegistry.getAll().forEach(definition => {
      registerComponent(definition);
    });
  }, [registerComponent]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <FlowToolbar />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <NewSidebar />
        
        {/* Canvas */}
        <div className="flex-1 relative">
          <NewFlowCanvas />
        </div>
        
        {/* Configuration Panel */}
        {isConfigPanelOpen && selectedNodeId && (
          <ConfigPanel />
        )}
      </div>
    </div>
  );
};

const NewFlowEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NewFlowEditorContent />
    </ReactFlowProvider>
  );
};

export default NewFlowEditor;
