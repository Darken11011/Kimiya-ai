
import React, { useState } from 'react';
import { Panel } from '@xyflow/react';
import { toast } from "sonner";
import ChatbotTester from '../ChatbotTester';

interface WorkflowControlsProps {
  workflowName: string;
  setWorkflowName: (name: string) => void;
  onSave: () => void;
  onNewWorkflow: () => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({ 
  workflowName, 
  setWorkflowName, 
  onSave, 
  onNewWorkflow 
}) => {
  const [showChatbotTester, setShowChatbotTester] = useState(false);
  
  return (
    <>
      <Panel position="top-right" className="flex gap-2">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Workflow Name"
        />
        <button 
          onClick={onNewWorkflow}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
        >
          New Workflow
        </button>
        <button 
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Save Workflow
        </button>
        <button 
          onClick={() => setShowChatbotTester(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Test Chatbot
        </button>
      </Panel>
      
      <ChatbotTester 
        isOpen={showChatbotTester} 
        onClose={() => setShowChatbotTester(false)} 
      />
    </>
  );
};

export default WorkflowControls;
