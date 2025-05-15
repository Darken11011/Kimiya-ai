
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { callAzureOpenAI } from '../../services/azureOpenAI';
import { initiateCall } from '../../services/twilioService';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatbotTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotTester: React.FC<ChatbotTesterProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are a helpful AI assistant following the conversation flow.'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallMode, setIsCallMode] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userInput
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    
    try {
      // Call AI service
      const updatedMessages = [...messages, newUserMessage];
      const response = await callAzureOpenAI(updatedMessages);
      
      // Add AI response to chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: response }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateCall = async () => {
    if (!phoneNumber) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsCallInProgress(true);
    
    try {
      // Start a call with the current workflow
      const callResponse = await initiateCall(phoneNumber, 'current-workflow');
      
      if (callResponse.success) {
        setIsCallMode(true);
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'system', 
            content: `Call initiated to ${phoneNumber}. Call SID: ${callResponse.callSid}` 
          }
        ]);
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'system', 
            content: `Failed to initiate call: ${callResponse.error || 'Unknown error'}` 
          }
        ]);
      }
    } finally {
      setIsCallInProgress(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test Your Call Flow Chatbot</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          {!isCallMode ? (
            // Phone number input mode
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">
                Enter a phone number to start a call with your workflow,
                or test the conversation directly in chat mode.
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Phone number (e.g. +12345678901)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isCallInProgress}
                />
                <Button 
                  onClick={handleInitiateCall}
                  disabled={!phoneNumber || isCallInProgress}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCallInProgress ? "Calling..." : "Start Call"}
                </Button>
              </div>
              <div className="flex justify-center">
                <span className="text-sm text-gray-500 italic">- or -</span>
              </div>
              <Button 
                onClick={() => setIsCallMode(true)}
                variant="outline"
              >
                Continue in Chat Mode
              </Button>
            </div>
          ) : (
            // Chat mode
            <>
              <div 
                id="chat-container"
                className="bg-gray-50 p-4 rounded-md h-96 overflow-y-auto flex flex-col space-y-2"
              >
                {messages.filter(m => m.role !== 'system' || m.role === 'system' && messages.indexOf(m) > 0).map((message, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white self-end' 
                        : message.role === 'system'
                          ? 'bg-yellow-100 text-gray-800 self-center italic text-sm'
                          : 'bg-gray-200 text-gray-800 self-start'
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-gray-200 text-gray-800 self-start p-2 rounded-lg max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="animate-bounce">.</div>
                      <div className="animate-bounce delay-100">.</div>
                      <div className="animate-bounce delay-200">.</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
          
        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-gray-500">
            Using Azure OpenAI for responses
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotTester;
