
import React from 'react';
import FlowBuilder from '@/components/FlowBuilder';

const Index: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800">AI Call Flow Builder</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300">
            Documentation
          </button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            New Workflow
          </button>
        </div>
      </header>
      <FlowBuilder />
    </div>
  );
};

export default Index;
