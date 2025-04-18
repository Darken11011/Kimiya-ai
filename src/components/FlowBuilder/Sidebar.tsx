
import React, { useCallback } from 'react';

const Sidebar: React.FC = () => {
  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="w-64 bg-white shadow-md p-4 border-r border-gray-200 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Nodes</h2>
      
      <div className="space-y-3">
        <div 
          className="bg-green-50 p-3 rounded border border-green-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'startCall')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <span className="font-medium">Start Call</span>
        </div>

        <div 
          className="bg-blue-50 p-3 rounded border border-blue-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'playAudio')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <span className="font-medium">Assistant (Say)</span>
        </div>

        <div 
          className="bg-yellow-50 p-3 rounded border border-yellow-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'logic')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="font-medium">Logic</span>
        </div>

        <div 
          className="bg-orange-50 p-3 rounded border border-orange-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'gather')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <span className="font-medium">Gather</span>
        </div>

        <div 
          className="bg-indigo-50 p-3 rounded border border-indigo-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'apiRequest')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <span className="font-medium">API Request</span>
        </div>

        <div 
          className="bg-teal-50 p-3 rounded border border-teal-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'transferCall')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <path d="M7 23h8"/>
              <path d="M11 19v4"/>
              <path d="M15 13v2a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4v-2"/>
            </svg>
          </div>
          <span className="font-medium">Transfer Call</span>
        </div>

        <div 
          className="bg-purple-50 p-3 rounded border border-purple-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'aiNode')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 2a5 5 0 1 0 5 5"></path>
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
              <path d="M7.5 10.5A3 3 0 0 0 8 15h12"></path>
              <path d="M22 17v-1a2 2 0 0 0-2-2h-3"></path>
            </svg>
          </div>
          <span className="font-medium">AI Node</span>
        </div>

        <div 
          className="bg-red-50 p-3 rounded border border-red-200 cursor-move flex items-center"
          onDragStart={(event) => onDragStart(event, 'endCall')}
          draggable
        >
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.574 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </div>
          <span className="font-medium">End Call</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
