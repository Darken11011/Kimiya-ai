
import React, { useState, useEffect, useRef } from 'react';
import { callAzureOpenAI } from '@/services/azureOpenAI';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useReactFlow, Node } from '@xyflow/react';
import { toast } from "sonner";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotTester: React.FC<ChatbotTesterProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant following the conversation flow.");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getNodes } = useReactFlow();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Generate system prompt based on the current flow
  const generateSystemPromptFromFlow = () => {
    const nodes = getNodes();
    let flowDescription = "You are following this conversation flow:\n\n";
    
    // Sort nodes by their positions to create a somewhat logical flow description
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    
    sortedNodes.forEach((node: Node) => {
      switch (node.type) {
        case 'startCall':
          flowDescription += `- Start call\n`;
          break;
        case 'playAudio':
          flowDescription += `- Say: "${node.data?.audioMessage || 'Hello'}"\n`;
          break;
        case 'aiNode':
          flowDescription += `- Process with AI using flow: ${node.data?.flowId || 'default'}\n`;
          break;
        case 'gather':
          flowDescription += `- Gather user input: ${node.data?.input || 'response'}\n`;
          break;
        case 'logic':
          flowDescription += `- Logic step: ${node.data?.logicType || 'condition'}\n`;
          break;
        case 'default': // For branch nodes
          flowDescription += `- Condition: ${node.data?.title || 'If'} ${node.data?.conditionType || 'equals'} ${node.data?.conditionValue || ''}\n`;
          break;
        case 'apiRequest':
          flowDescription += `- API Request: ${node.data?.method || 'GET'} to ${node.data?.url || 'API endpoint'}\n`;
          break;
        case 'transferCall':
          flowDescription += `- Transfer call to: ${node.data?.phoneNumber || 'another agent'}\n`;
          break;
        case 'endCall':
          flowDescription += `- End call\n`;
          break;
        default:
          flowDescription += `- ${node.type}: ${JSON.stringify(node.data)}\n`;
      }
    });
    
    flowDescription += "\nBehave as if you're following this call flow when responding to the user.";
    return flowDescription;
  };

  const applyFlowPrompt = () => {
    const flowPrompt = generateSystemPromptFromFlow();
    setSystemPrompt(flowPrompt);
    toast.success("System prompt updated based on current flow");
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      // Prepare full conversation history for context
      const conversationHistory = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: "user" as const, content: inputMessage }
      ];
      
      // Call Azure OpenAI
      const response = await callAzureOpenAI(conversationHistory);
      
      // Add AI response
      const aiMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in chatbot conversation:", error);
      toast.error("Failed to get response from AI");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Test Chatbot with Flow</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </div>
        
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">System Prompt:</label>
          <div className="flex space-x-2">
            <Textarea 
              value={systemPrompt} 
              onChange={(e) => setSystemPrompt(e.target.value)} 
              placeholder="Enter system instructions..."
              className="h-24 text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={applyFlowPrompt}>
              Generate From Flow
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-grow border rounded-md p-3 bg-gray-50 mb-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTester;
