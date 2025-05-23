
import React, { useCallback } from 'react';
import FlowBuilder from '@/components/FlowBuilder';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNewWorkflow = useCallback(() => {
    // Clear any existing workflow data in localStorage
    localStorage.removeItem('savedWorkflow');
    // Reload the page to start fresh
    window.location.reload();
    toast.success("Created new workflow");
  }, []);
  
  const handleDocumentation = useCallback(() => {
    // Open documentation in a new tab
    window.open('https://docs.langflow.org/get-started-installation', '_blank');
  }, []);

  return (
    <div className="w-full h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/icon.png" alt="Kimiyi Logo" className="h-8 w-8 mr-2" />
          <h1 className="text-xl font-bold text-gray-800">Kimiyi Call Flow</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            onClick={handleDocumentation}
          >
            Documentation
          </button>
          <button 
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            onClick={handleNewWorkflow}
          >
            New Workflow
          </button>
        </div>
      </header>
      <FlowBuilder />
    </div>
  );
};

export default Index;
