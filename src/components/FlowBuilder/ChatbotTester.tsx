
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { callAzureOpenAI } from '../../services/azureOpenAI';
import { initiateCall } from '../../services/twilioService';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CustomNode } from '../../types/flowTypes';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatbotTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotTester: React.FC<ChatbotTesterProps> = ({ isOpen, onClose }) => {
  const { getNodes, getEdges } = useReactFlow();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallMode, setIsCallMode] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  
  // Generate system instruction from flow structure when component opens or when system prompt changes
  useEffect(() => {
    if (isOpen) {
      resetChat();
    }
  }, [isOpen, systemPrompt]);

  // Generate instructions from flow structure
  const generateFlowInstructions = useCallback((nodes: CustomNode[], edges: Edge[]): string => {
    let instructions = "Here is the conversation flow structure to follow:\n\n";
    
    // Find start node
    const startNode = nodes.find(node => node.type === 'startCall');
    if (!startNode) return "No valid flow structure found.";
    
    // Generate path descriptions
    try {
      // Map nodes by their IDs for quick lookup
      const nodeMap = new Map();
      nodes.forEach(node => nodeMap.set(node.id, node));
      
      // Build flow representation
      instructions += traverseFlow(startNode, nodeMap, edges, [], 0);
      
      // Add specific handling for AI nodes
      const aiNodes = nodes.filter(node => node.type === 'aiNode');
      if (aiNodes.length > 0) {
        instructions += "\n\nAI Agent Instructions:\n";
        aiNodes.forEach(node => {
          const flowId = node.data?.flowId;
          instructions += `- ${node.data?.label || 'AI Agent'}: ${flowId ? `Follow flow ID ${flowId}. ` : ''}${node.data?.label || 'Process user input and respond appropriately.'}\n`;
        });
      }
      
      // Add instructions for Play Audio nodes (conversation messages)
      const playAudioNodes = nodes.filter(node => node.type === 'playAudio');
      if (playAudioNodes.length > 0) {
        instructions += "\n\nScript Samples:\n";
        playAudioNodes.forEach(node => {
          instructions += `- "${node.data?.audioMessage || 'No message provided'}"\n`;
        });
      }
      
      // Add instructions for Gather nodes (expected inputs)
      const gatherNodes = nodes.filter(node => node.type === 'gather');
      if (gatherNodes.length > 0) {
        instructions += "\n\nExpected User Inputs:\n";
        gatherNodes.forEach(node => {
          instructions += `- Ask for: "${node.data?.input || 'user input'}"\n`;
        });
      }
      
      return instructions;
    } catch (error) {
      console.error("Error generating flow instructions:", error);
      return "Error generating flow instructions from the workflow structure.";
    }
  }, []);
  
  // Recursively traverse flow to build instructions
  const traverseFlow = useCallback((
    currentNode: CustomNode, 
    nodeMap: Map<string, CustomNode>, 
    edges: Edge[], 
    visitedNodes: string[], 
    depth: number
  ): string => {
    if (visitedNodes.includes(currentNode.id) || depth > 20) {
      return ""; // Prevent infinite loops
    }
    
    visitedNodes.push(currentNode.id);
    const indent = "  ".repeat(depth);
    let result = `${indent}${depth + 1}. ${currentNode.type}: ${currentNode.data?.label || ''}\n`;
    
    // Add node-specific details
    switch (currentNode.type) {
      case 'playAudio':
        result += `${indent}   Message: "${currentNode.data?.audioMessage || ''}"\n`;
        break;
      case 'aiNode':
        result += `${indent}   AI response based on context\n`;
        break;
      case 'gather':
        result += `${indent}   Ask for: "${currentNode.data?.input || 'user input'}"\n`;
        break;
      case 'logic':
        result += `${indent}   Logic type: ${currentNode.data?.logicType || ''}, Value: ${currentNode.data?.value || ''}\n`;
        break;
    }
    
    // Find child nodes through edges
    const childEdges = edges.filter(edge => edge.source === currentNode.id);
    
    // Add next steps
    if (childEdges.length > 0) {
      for (const edge of childEdges) {
        const targetNode = nodeMap.get(edge.target);
        if (targetNode) {
          result += traverseFlow(targetNode, nodeMap, edges, [...visitedNodes], depth + 1);
        }
      }
    } else if (currentNode.type !== 'endCall') {
      result += `${indent}   (End of branch)\n`;
    }
    
    return result;
  }, []);

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
      // Call AI service with flow context
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
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateCall = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsCallInProgress(true);
    
    try {
      // Create workflow ID from current nodes/edges
      const nodes = getNodes();
      const edges = getEdges();
      const workflowId = `flow-${Date.now()}`;
      
      // Start a call with the current workflow
      const callResponse = await initiateCall(phoneNumber, workflowId);
      
      if (callResponse.success) {
        setIsCallMode(true);
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'system', 
            content: `Call initiated to ${phoneNumber}. Call SID: ${callResponse.callSid}` 
          }
        ]);
        toast.success(`Call initiated to ${phoneNumber}`);
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'system', 
            content: `Failed to initiate call: ${callResponse.error || 'Unknown error'}` 
          }
        ]);
        toast.error(`Failed to initiate call: ${callResponse.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Error initiating call');
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'system', 
          content: `Error initiating call: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }
      ]);
    } finally {
      setIsCallInProgress(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const resetChat = () => {
    // Reset to initial state with system instruction
    const nodes = getNodes() as CustomNode[];
    const edges = getEdges();
    const flowInstructions = generateFlowInstructions(nodes, edges);
    
    const systemMessage = systemPrompt ? 
      `${systemPrompt}\n\n${flowInstructions}` : 
      `You are a helpful AI assistant following this conversation flow structure: ${flowInstructions}. Stay in character and follow the flow strictly.`;
    
    setMessages([
      {
        role: 'system',
        content: systemMessage
      }
    ]);
    
    setUserInput('');
    toast.info('Chat reset with current flow structure');
  };

  const toggleSystemPrompt = () => {
    setShowSystemPrompt(!showSystemPrompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test Your Call Flow Chatbot</DialogTitle>
          <DialogDescription>
            Test your workflow as a chat or phone call interaction
          </DialogDescription>
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
                <Input
                  type="text"
                  placeholder="Phone number (e.g. +12345678901)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
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
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setIsCallMode(true)}
                  variant="outline"
                  className="flex-1"
                >
                  Continue in Chat Mode
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={toggleSystemPrompt}
                  className="whitespace-nowrap"
                >
                  {showSystemPrompt ? "Hide System Prompt" : "Edit System Prompt"}
                </Button>
              </div>
              
              {showSystemPrompt && (
                <div className="mt-2">
                  <Textarea
                    placeholder="Enter custom system prompt to guide the AI behavior..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-24"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be combined with the workflow structure instructions
                  </p>
                </div>
              )}
              
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
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
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
          <div className="flex gap-2">
            <div className="text-xs text-gray-500">
              Using Azure OpenAI for responses
            </div>
            {isCallMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetChat} 
                className="text-xs"
              >
                Reset Chat
              </Button>
            )}
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
