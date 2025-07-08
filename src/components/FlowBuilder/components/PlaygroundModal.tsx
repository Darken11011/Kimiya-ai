import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, Loader2, AlertCircle, Play, Square, Phone, PhoneCall, MessageSquare, Settings, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Node } from '@xyflow/react';
import { ConditionalEdge } from '../../../types/flowTypes';
import { WorkflowConfig } from '../../../types/workflowConfig';
import { toast } from 'sonner';
import { defaultTwilioService, TwilioService, CallResponse } from '../../../services/twilioService';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: ConditionalEdge[];
  workflowConfig: WorkflowConfig | null;
  globalPrompt: string;
  onUpdateWorkflowConfig?: (config: WorkflowConfig) => void;
  onSaveFlow?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  nodeId?: string;
  nodeName?: string;
}

interface AzureOpenAIConfig {
  deploymentName: string;
  modelName: string;
  endpoint: string;
  apiKey: string;
}

const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  workflowConfig,
  globalPrompt,
  onUpdateWorkflowConfig,
  onSaveFlow
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [conversationTurns, setConversationTurns] = useState(0);
  const [nodeContext, setNodeContext] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Call functionality state
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [twilioService, setTwilioService] = useState<TwilioService>(defaultTwilioService);

  // Twilio configuration editing state
  const [isEditingTwilio, setIsEditingTwilio] = useState(false);
  const [isSavingTwilio, setIsSavingTwilio] = useState(false);
  const [isLoadingTwilioConfig, setIsLoadingTwilioConfig] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: workflowConfig?.twilio?.accountSid || 'AC64208c7087a03b475ea7fa9337b692f8',
    authToken: workflowConfig?.twilio?.authToken || '587e27a4553570edb09656c15a03d0e8',
    phoneNumber: workflowConfig?.twilio?.phoneNumber || '+17077433838',
    recordCalls: workflowConfig?.twilio?.recordCalls ?? true,
    callTimeout: workflowConfig?.twilio?.callTimeout ?? 30
  });
  const [showAuthToken, setShowAuthToken] = useState(false);

  // Azure OpenAI Configuration
  const azureConfig: AzureOpenAIConfig = {
    deploymentName: 'gpt4omini',
    modelName: 'gpt-4o-mini',
    endpoint: 'https://innochattemp.openai.azure.com/openai/deployments/gpt4omini/chat/completions?api-version=2025-01-01-preview',
    apiKey: 'f6d564a83af3498c9beb46d7d3e3da96'
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Initialize conversation when modal opens
      initializeConversation();
    } else {
      // Reset state when modal closes
      setMessages([]);
      setInputMessage('');
      setIsLoading(false);
      setIsSimulating(false);
      setCurrentNodeId(null);
      setConversationTurns(0);
      setNodeContext('');
      // Reset call state
      setActiveTab('chat');
      setPhoneNumber('');
      setIsCallInProgress(false);
      setCurrentCallSid(null);
      // Reset Twilio editing state
      setIsEditingTwilio(false);
      setIsSavingTwilio(false);
      setShowAuthToken(false);
    }
  }, [isOpen]);

  // Update Twilio config when workflowConfig changes
  useEffect(() => {
    if (!isEditingTwilio) {
      setTwilioConfig({
        accountSid: workflowConfig?.twilio?.accountSid || 'AC64208c7087a03b475ea7fa9337b692f8',
        authToken: workflowConfig?.twilio?.authToken || '587e27a4553570edb09656c15a03d0e8',
        phoneNumber: workflowConfig?.twilio?.phoneNumber || '+17077433838',
        recordCalls: workflowConfig?.twilio?.recordCalls ?? true,
        callTimeout: workflowConfig?.twilio?.callTimeout ?? 30
      });
    }
  }, [workflowConfig, isEditingTwilio]);

  // Fetch Twilio config from backend when modal opens
  useEffect(() => {
    console.log('useEffect triggered - isOpen:', isOpen, 'isBackendAvailable:', isBackendAvailable(), 'workflowConfig?.twilio:', !!workflowConfig?.twilio);

    if (isOpen && isBackendAvailable()) {
      console.log('Conditions met, calling fetchTwilioConfigFromBackend');
      fetchTwilioConfigFromBackend();
    } else {
      console.log('Conditions not met for fetching config - isOpen:', isOpen, 'isBackendAvailable:', isBackendAvailable());
    }
  }, [isOpen]);

  const initializeConversation = () => {
    // Find the start node
    const startNode = nodes.find(node => node.type === 'startNode');
    if (startNode) {
      setCurrentNodeId(startNode.id);
      setConversationTurns(0);

      // Set initial context based on start node
      const context = startNode.data?.prompt || startNode.data?.description || 'Call started';
      setNodeContext(context);

      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Call simulation started. ${startNode.data?.label || 'Start Node'}: ${context}`,
        timestamp: new Date(),
        nodeId: startNode.id,
        nodeName: startNode.data?.label
      };
      setMessages([systemMessage]);

      // If start node has specific content, have AI initiate the conversation
      if (startNode.data?.prompt || startNode.data?.greeting) {
        setTimeout(() => {
          initiateNodeConversation(startNode);
        }, 500);
      }
    } else {
      toast.error('No start node found in the workflow');
    }
  };

  const callAzureOpenAI = async (messages: any[]): Promise<string> => {
    try {
      const response = await fetch(azureConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureConfig.apiKey,
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Azure OpenAI API error:', error);
      throw error;
    }
  };

  const getEffectiveGlobalPrompt = () => {
    // First try to get global prompt from start node, then fall back to passed globalPrompt
    const startNode = nodes.find(node => node.type === 'startNode');
    return startNode?.data?.globalPrompt || globalPrompt || 'You are a helpful AI assistant.';
  };

  const initiateNodeConversation = async (node: Node) => {
    if (node.type === 'conversationNode' || node.type === 'startNode') {
      const nodePrompt = node.data?.prompt || node.data?.greeting || '';
      const nodeInstructions = node.data?.instructions || '';
      const effectiveGlobalPrompt = getEffectiveGlobalPrompt();

      const systemPrompt = `${effectiveGlobalPrompt}

Current Node: ${node.data?.label || node.type}
Node Context: ${nodePrompt}
${nodeInstructions ? `Instructions: ${nodeInstructions}` : ''}

You are in a phone conversation. Be natural and conversational. Stay in character for this node until the conversation naturally progresses or the user indicates they want to move forward. Don't immediately jump to the next step - have a proper conversation first.`;

      try {
        const aiResponse = await callAzureOpenAI([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Hello' }
        ]);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          nodeId: node.id,
          nodeName: node.data?.label
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Failed to initiate conversation:', error);
      }
    }
  };

  const getCurrentNode = () => {
    return nodes.find(node => node.id === currentNodeId);
  };

  const getNextNode = (currentNodeId: string, userMessage?: string) => {
    // Find edges from current node
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);

    if (outgoingEdges.length === 0) {
      return null; // End of flow
    }

    // For now, just take the first edge (in a real implementation, this would evaluate conditions)
    // In the future, this could evaluate edge conditions based on the user message or AI response
    const nextEdge = outgoingEdges[0];
    return nodes.find(node => node.id === nextEdge.target);
  };

  const getNodeTypeDescription = (nodeType: string) => {
    switch (nodeType) {
      case 'startNode':
        return 'Call Start';
      case 'conversationNode':
        return 'AI Conversation';
      case 'apiRequest':
        return 'API Request';
      case 'transferCall':
        return 'Transfer Call';
      case 'toolNode':
        return 'Tool Execution';
      case 'endCall':
        return 'Call End';
      default:
        return nodeType;
    }
  };

  const shouldMoveToNextNode = async (currentNode: Node, conversationHistory: ChatMessage[], userMessage: string): Promise<boolean> => {
    // For non-conversation nodes, move immediately
    if (currentNode.type !== 'conversationNode' && currentNode.type !== 'startNode') {
      return true;
    }

    // For conversation nodes, use AI to determine if we should move on
    const nodeObjective = currentNode.data?.prompt || currentNode.data?.objective || '';
    const nodeInstructions = currentNode.data?.instructions || '';

    const evaluationPrompt = `You are evaluating whether a conversation has completed its objective for the current node.

Current Node: ${currentNode.data?.label || currentNode.type}
Node Objective: ${nodeObjective}
${nodeInstructions ? `Instructions: ${nodeInstructions}` : ''}

Recent conversation:
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Latest user message: ${userMessage}

Has this conversation node achieved its objective? Should we move to the next step in the workflow?
Consider:
- Has the main purpose of this node been fulfilled?
- Has enough information been gathered or provided?
- Is the user ready to proceed?
- Has the conversation naturally reached a conclusion for this step?

Respond with only "YES" if we should move to the next node, or "NO" if we should continue the conversation in this node.`;

    try {
      const evaluation = await callAzureOpenAI([
        { role: 'system', content: evaluationPrompt }
      ]);

      return evaluation.trim().toUpperCase().includes('YES');
    } catch (error) {
      console.error('Failed to evaluate node completion:', error);
      // Default to staying in node if evaluation fails
      return false;
    }
  };

  const simulateWorkflowStep = async (userMessage: string) => {
    const currentNode = getCurrentNode();
    if (!currentNode) return;

    setConversationTurns(prev => prev + 1);

    // Handle different node types
    if (currentNode.type === 'conversationNode' || currentNode.type === 'startNode') {
      // AI Conversation Node - have a natural conversation
      const nodePrompt = currentNode.data?.prompt || '';
      const nodeInstructions = currentNode.data?.instructions || '';

      const effectiveGlobalPrompt = getEffectiveGlobalPrompt();

      const conversationMessages = [
        {
          role: 'system',
          content: `${effectiveGlobalPrompt}

Current Node: ${currentNode.data?.label || currentNode.type}
Node Context: ${nodePrompt}
${nodeInstructions ? `Instructions: ${nodeInstructions}` : ''}

You are in a phone conversation. Be natural and conversational. Focus on achieving the objective of this node. Don't mention moving to next steps unless the conversation naturally concludes or the user indicates they're ready to proceed.

Conversation turns in this node: ${conversationTurns}`
        },
        ...messages
          .filter(msg => msg.role !== 'system')
          .slice(-10) // Keep last 10 messages for context
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      try {
        const aiResponse = await callAzureOpenAI(conversationMessages);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          nodeId: currentNode.id,
          nodeName: currentNode.data?.label
        };

        setMessages(prev => [...prev, aiMessage]);

        // Check if we should move to next node (only after a few turns and with some delay)
        if (conversationTurns >= 2) {
          // Add a small delay to make the conversation feel more natural
          setTimeout(async () => {
            const shouldMove = await shouldMoveToNextNode(currentNode, [...messages, aiMessage], userMessage);

            if (shouldMove) {
              await moveToNextNode(currentNode.id, userMessage);
            }
          }, 1500);
        }
      } catch (error) {
        toast.error('Failed to get AI response');
        console.error('AI response error:', error);
        return;
      }
    } else {
      // Non-conversation nodes - process and move immediately
      await handleNonConversationNode(currentNode);
      await moveToNextNode(currentNode.id, userMessage);
    }
  };

  const handleNonConversationNode = async (node: Node) => {
    let nodeMessage: ChatMessage;

    if (node.type === 'apiRequest') {
      nodeMessage = {
        id: `api-${Date.now()}`,
        role: 'assistant',
        content: `[API Request] ${node.data?.label || 'API call executed'} - Processing request...`,
        timestamp: new Date(),
        nodeId: node.id,
        nodeName: node.data?.label
      };
    } else if (node.type === 'endCall') {
      nodeMessage = {
        id: `end-${Date.now()}`,
        role: 'system',
        content: 'Call ended. Thank you for calling!',
        timestamp: new Date(),
        nodeId: node.id,
        nodeName: node.data?.label
      };
      setIsSimulating(false);
    } else {
      nodeMessage = {
        id: `node-${Date.now()}`,
        role: 'assistant',
        content: `[${getNodeTypeDescription(node.type)}] ${node.data?.label || 'Processing'}...`,
        timestamp: new Date(),
        nodeId: node.id,
        nodeName: node.data?.label
      };
    }

    setMessages(prev => [...prev, nodeMessage]);
  };

  const moveToNextNode = async (currentNodeId: string, userMessage?: string) => {
    const nextNode = getNextNode(currentNodeId, userMessage);

    if (nextNode) {
      setCurrentNodeId(nextNode.id);
      setConversationTurns(0); // Reset conversation turns for new node

      // Set new node context
      const context = nextNode.data?.prompt || nextNode.data?.description || '';
      setNodeContext(context);

      // Add system message about node transition
      const transitionMessage: ChatMessage = {
        id: `transition-${Date.now()}`,
        role: 'system',
        content: `→ Moved to: ${getNodeTypeDescription(nextNode.type)} - ${nextNode.data?.label || 'Untitled'}`,
        timestamp: new Date(),
        nodeId: nextNode.id,
        nodeName: nextNode.data?.label
      };

      setMessages(prev => [...prev, transitionMessage]);

      // If it's a conversation node, initiate the conversation
      if (nextNode.type === 'conversationNode') {
        setTimeout(() => {
          initiateNodeConversation(nextNode);
        }, 1000);
      }
    } else {
      // End of workflow
      const endMessage: ChatMessage = {
        id: `end-${Date.now()}`,
        role: 'system',
        content: 'Workflow completed successfully.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, endMessage]);
      setIsSimulating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      await simulateWorkflowStep(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    initializeConversation();
  };

  const handleStopSimulation = async () => {
    setIsSimulating(false);
    setMessages([]);
    setCurrentNodeId(null);
    setConversationTurns(0);
    setNodeContext('');

    // End any active call
    if (isCallInProgress && currentCallSid) {
      await handleEndCall();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if backend API is available for real calls
  const isBackendAvailable = () => {
    if (typeof window === 'undefined') return false;

    // Backend is always available since we're using Render deployment
    return true;
  };

  // Get API base URL (same logic as TwilioService)
  const getApiBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'https://kimiyi-ai.onrender.com';
      } else {
        return 'https://kimiyi-ai.onrender.com';
      }
    }
    return 'https://kimiyi-ai.onrender.com';
  };

  // Fetch Twilio configuration from backend
  const fetchTwilioConfigFromBackend = async () => {
    console.log('fetchTwilioConfigFromBackend called');
    console.log('isBackendAvailable():', isBackendAvailable());

    if (!isBackendAvailable()) {
      console.log('Backend not available, skipping fetch');
      return;
    }

    setIsLoadingTwilioConfig(true);
    try {
      // Use the same API base URL logic as TwilioService
      const API_BASE_URL = getApiBaseUrl();
      console.log('Fetching from:', `${API_BASE_URL}/api/twilio-config`);

      const response = await fetch(`${API_BASE_URL}/api/twilio-config`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);

        if (data.success && data.config) {
          // Always use backend config when available (it has the real environment variables)
          console.log('Updating Twilio config with backend data (overriding any workflow config)');
          setTwilioConfig({
            accountSid: data.config.accountSid || 'AC64208c7087a03b475ea7fa9337b692f8',
            authToken: data.config.authToken || '587e27a4553570edb09656c15a03d0e8',
            phoneNumber: data.config.phoneNumber || '+17077433838',
            recordCalls: data.config.recordCalls ?? true,
            callTimeout: data.config.callTimeout ?? 30
          });
        }
      } else {
        console.error('Failed to fetch config, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch Twilio config from backend:', error);
      // Use fallback config if backend is slow/unavailable
      console.log('Using fallback Twilio config');
      setTwilioConfig({
        accountSid: 'AC64208c7087a03b475ea7fa9337b692f8',
        authToken: 'ab39243ee151ff74a03075d53070cf67',
        phoneNumber: '+17077433838',
        recordCalls: true,
        callTimeout: 30
      });
    } finally {
      setIsLoadingTwilioConfig(false);
    }
  };

  // Handle Twilio configuration save
  const handleSaveTwilioConfig = async () => {
    if (!onUpdateWorkflowConfig) {
      toast.error('Cannot update configuration - no update handler provided');
      return;
    }

    // Validate required fields
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      toast.error('Please fill in all required Twilio fields');
      return;
    }

    // Validate phone number format
    if (!twilioConfig.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      toast.error('Phone number must be in E.164 format (e.g., +1234567890)');
      return;
    }

    setIsSavingTwilio(true);

    // Create updated workflow config
    const updatedConfig: WorkflowConfig = {
      ...workflowConfig,
      id: workflowConfig?.id || `workflow-${Date.now()}`,
      name: workflowConfig?.name || 'Untitled Workflow',
      description: workflowConfig?.description || '',
      createdAt: workflowConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      twilio: {
        accountSid: twilioConfig.accountSid,
        authToken: twilioConfig.authToken,
        phoneNumber: twilioConfig.phoneNumber,
        recordCalls: twilioConfig.recordCalls,
        callTimeout: Math.min(Math.max(twilioConfig.callTimeout, 5), 600) // Clamp between 5-600 seconds
      },
      // Preserve other configs or use defaults
      llm: workflowConfig?.llm || {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 1000
      },
      voice: workflowConfig?.voice || {
        provider: 'elevenlabs',
        voiceId: 'default',
        apiKey: ''
      },
      transcription: workflowConfig?.transcription || {
        provider: 'deepgram',
        apiKey: '',
        language: 'en'
      },
      globalSettings: workflowConfig?.globalSettings || {
        enableLogging: true,
        enableAnalytics: false,
        maxConversationLength: 50
      }
    };

    onUpdateWorkflowConfig(updatedConfig);

    // Trigger save to persist changes
    if (onSaveFlow) {
      // Use setTimeout to ensure the state update is processed first
      setTimeout(() => {
        onSaveFlow();
        setIsSavingTwilio(false);
        toast.success('Twilio configuration updated and saved successfully! Changes will persist after refresh.');
      }, 100);
    } else {
      setIsSavingTwilio(false);
      toast.success('Twilio configuration updated successfully!');
    }

    setIsEditingTwilio(false);
  };

  // Handle cancel editing
  const handleCancelTwilioEdit = () => {
    // Reset to original values
    setTwilioConfig({
      accountSid: workflowConfig?.twilio?.accountSid || 'AC64208c7087a03b475ea7fa9337b692f8',
      authToken: workflowConfig?.twilio?.authToken || '587e27a4553570edb09656c15a03d0e8',
      phoneNumber: workflowConfig?.twilio?.phoneNumber || '+17077433838',
      recordCalls: workflowConfig?.twilio?.recordCalls ?? true,
      callTimeout: workflowConfig?.twilio?.callTimeout ?? 30
    });
    setIsEditingTwilio(false);
    setIsSavingTwilio(false);
  };

  // Call handling functions
  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    // Basic validation - just check if it contains digits
    if (!phoneNumber.match(/\d/)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsCallInProgress(true);

    try {
      // Use workflowConfig Twilio settings if available, otherwise use default
      const service = workflowConfig?.twilio ? new TwilioService(workflowConfig.twilio) : defaultTwilioService;
      const fromNumber = workflowConfig?.twilio?.phoneNumber || defaultTwilioService.getConfig().phoneNumber;

      const result: CallResponse = await service.makeCall({
        to: phoneNumber,
        from: fromNumber,
        record: workflowConfig?.twilio?.recordCalls ?? true,
        timeout: workflowConfig?.twilio?.callTimeout ?? 30,
        // Include workflow data for dynamic call processing
        workflowId: workflowConfig?.id || `workflow-${Date.now()}`,
        nodes: nodes,
        edges: edges,
        config: workflowConfig,
        globalPrompt: globalPrompt
      });

      if (result.success) {
        setCurrentCallSid(result.callSid || null);
        toast.success(result.message || 'Call initiated successfully');

        // Add a system message about the call
        const callMessage: ChatMessage = {
          id: `call-${Date.now()}`,
          role: 'system',
          content: `📞 Call initiated to ${phoneNumber}${result.callSid ? ` (Call ID: ${result.callSid})` : ''}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, callMessage]);
      } else {
        toast.error(result.error || 'Failed to initiate call');
        setIsCallInProgress(false);
      }
    } catch (error) {
      console.error('Call error:', error);
      toast.error('Failed to initiate call');
      setIsCallInProgress(false);
    }
  };

  const handleEndCall = async () => {
    if (!currentCallSid) {
      setIsCallInProgress(false);
      return;
    }

    try {
      const service = workflowConfig?.twilio ? new TwilioService(workflowConfig.twilio) : defaultTwilioService;
      const result = await service.hangupCall(currentCallSid);

      if (result.success) {
        toast.success('Call ended successfully');
      } else {
        toast.error(result.error || 'Failed to end call');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    } finally {
      setIsCallInProgress(false);
      setCurrentCallSid(null);

      // Add a system message about call ending
      const endMessage: ChatMessage = {
        id: `call-end-${Date.now()}`,
        role: 'system',
        content: '📞 Call ended',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, endMessage]);
    }
  };

  const currentNode = getCurrentNode();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Workflow Playground</span>
            <div className="flex items-center space-x-2">
              {currentNode && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {currentNode.data?.label || getNodeTypeDescription(currentNode.type)}
                  </Badge>
                  {conversationTurns > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Turn {conversationTurns}
                    </Badge>
                  )}
                </div>
              )}
              {!isSimulating ? (
                <Button
                  onClick={handleStartSimulation}
                  size="sm"
                  className="flex items-center space-x-1"
                  disabled={nodes.length === 0}
                >
                  <Play className="h-3 w-3" />
                  <span>Start</span>
                </Button>
              ) : (
                <Button
                  onClick={handleStopSimulation}
                  size="sm"
                  variant="destructive"
                  className="flex items-center space-x-1"
                >
                  <Square className="h-3 w-3" />
                  <span>Stop</span>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'call')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="call" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4 border rounded-lg" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && !isSimulating && (
                  <div className="text-center text-gray-500 py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Click "Start" to begin testing your workflow</p>
                    {nodes.length === 0 && (
                      <p className="text-sm mt-2 text-orange-600">
                        Add some nodes to your workflow first
                      </p>
                    )}
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col space-y-1">
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <Card className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.role === 'system'
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-white'
                      }`}>
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            ) : message.role === 'system' ? (
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-60" />
                            ) : (
                              <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs opacity-70 ${
                                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.timestamp)}
                                </span>
                                {message.nodeName && (
                                  <Badge variant="secondary" className="text-xs">
                                    {message.nodeName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <Card className="bg-white">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">AI is thinking...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Chat Input Area */}
            <div className="flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isSimulating ? "Type your message..." : "Start simulation to begin chatting"}
                  disabled={!isSimulating || isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isSimulating || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Using Azure OpenAI ({azureConfig.modelName}) • {nodes.length} nodes in workflow
                </span>
                {isSimulating && currentNode && (
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-medium">
                      {getNodeTypeDescription(currentNode.type)}
                    </span>
                    {conversationTurns > 0 && (
                      <span className="text-green-600">
                        {conversationTurns} exchange{conversationTurns !== 1 ? 's' : ''}
                      </span>
                    )}
                    {nodeContext && (
                      <span className="text-gray-400 max-w-xs truncate">
                        {nodeContext}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="call" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Call Interface */}
            <div className="flex-1 flex flex-col space-y-4">
              {/* Phone Number Input */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter phone number (e.g., +1234567890, 1234567890, or (123) 456-7890)"
                          disabled={isCallInProgress}
                          className="flex-1"
                        />
                        {!isCallInProgress ? (
                          <Button
                            onClick={handleMakeCall}
                            disabled={!phoneNumber.trim() || nodes.length === 0}
                            className="flex items-center space-x-2"
                          >
                            <PhoneCall className="h-4 w-4" />
                            <span>Call</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={handleEndCall}
                            variant="destructive"
                            className="flex items-center space-x-2"
                          >
                            <Phone className="h-4 w-4" />
                            <span>End Call</span>
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter any phone number format - it will be automatically normalized for calling
                      </p>
                    </div>

                    {/* Twilio Configuration Info */}
                    <div className="text-xs text-gray-500 space-y-2">
                      <div className="flex items-center justify-between">
                        <p><strong>Twilio Configuration:</strong></p>
                        <Button
                          onClick={() => setIsEditingTwilio(true)}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          disabled={isCallInProgress}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      {!isEditingTwilio ? (
                        <div className="space-y-1">
                          {isLoadingTwilioConfig ? (
                            <div className="text-blue-600">
                              <p>Loading configuration from backend...</p>
                              <p className="text-xs text-gray-500">This may take a moment if the backend is sleeping</p>
                            </div>
                          ) : (
                            <>
                              <p>Account SID: {twilioConfig.accountSid}</p>
                              <p>From Number: {twilioConfig.phoneNumber}</p>
                              <p>Recording: {twilioConfig.recordCalls ? 'Enabled' : 'Disabled'}</p>
                              <p>Timeout: {twilioConfig.callTimeout} seconds</p>
                              {workflowConfig?.twilio ? (
                                <p className="text-green-600 text-xs">Using workflow-specific configuration</p>
                              ) : (
                                <p className="text-blue-600 text-xs">
                                  {isBackendAvailable() ? 'Using backend environment configuration' : 'Using default configuration'}
                                </p>
                              )}
                            </>
                          )}
                          <p className="text-orange-600 mt-2">
                            <strong>Mode:</strong> {isBackendAvailable() ? 'Real calls via backend API' : 'Demo mode - calls are simulated'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                          <div>
                            <Label htmlFor="edit-account-sid" className="text-xs">Account SID *</Label>
                            <Input
                              id="edit-account-sid"
                              value={twilioConfig.accountSid}
                              onChange={(e) => setTwilioConfig(prev => ({ ...prev, accountSid: e.target.value }))}
                              className="h-7 text-xs mt-1"
                              placeholder="AC..."
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-auth-token" className="text-xs">Auth Token *</Label>
                            <div className="relative">
                              <Input
                                id="edit-auth-token"
                                type={showAuthToken ? "text" : "password"}
                                value={twilioConfig.authToken}
                                onChange={(e) => setTwilioConfig(prev => ({ ...prev, authToken: e.target.value }))}
                                className="h-7 text-xs mt-1 pr-8"
                                placeholder="Your auth token"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-1 h-7 w-7 p-0"
                                onClick={() => setShowAuthToken(!showAuthToken)}
                              >
                                {showAuthToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="edit-phone-number" className="text-xs">Phone Number *</Label>
                            <Input
                              id="edit-phone-number"
                              value={twilioConfig.phoneNumber}
                              onChange={(e) => setTwilioConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="h-7 text-xs mt-1"
                              placeholder="+1234567890"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-call-timeout" className="text-xs">Call Timeout (5-600 seconds)</Label>
                            <Input
                              id="edit-call-timeout"
                              type="number"
                              min="5"
                              max="600"
                              value={twilioConfig.callTimeout}
                              onChange={(e) => setTwilioConfig(prev => ({ ...prev, callTimeout: parseInt(e.target.value) || 30 }))}
                              className="h-7 text-xs mt-1"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-record-calls"
                              checked={twilioConfig.recordCalls}
                              onCheckedChange={(checked) => setTwilioConfig(prev => ({ ...prev, recordCalls: checked }))}
                            />
                            <Label htmlFor="edit-record-calls" className="text-xs">Record calls</Label>
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={handleSaveTwilioConfig}
                              size="sm"
                              className="h-7 text-xs flex-1"
                              disabled={isSavingTwilio}
                            >
                              {isSavingTwilio ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <Button
                              onClick={handleCancelTwilioEdit}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call Status and Messages */}
              <div className="flex-1">
                <ScrollArea className="h-full p-4 border rounded-lg">
                  <div className="space-y-4">
                    {!isCallInProgress && messages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Enter a phone number and click "Call" to start</p>
                        {nodes.length === 0 && (
                          <p className="text-sm mt-2 text-orange-600">
                            Add some nodes to your workflow first
                          </p>
                        )}
                      </div>
                    )}

                    {isCallInProgress && (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <PhoneCall className="h-6 w-6 animate-pulse" />
                          <span className="font-medium">Call in progress...</span>
                        </div>
                        {currentCallSid && (
                          <p className="text-xs text-gray-500 mt-2">
                            Call ID: {currentCallSid}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Show call-related messages */}
                    {messages.filter(msg => msg.role === 'system' && msg.content.includes('📞')).map((message) => (
                      <div key={message.id} className="flex justify-center">
                        <Card className="bg-gray-100 border-gray-300">
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 opacity-60" />
                              <p className="text-sm">{message.content}</p>
                              <span className="text-xs text-gray-500">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Call Info Footer */}
              <div className="text-xs text-gray-500 text-center">
                <p>{isBackendAvailable() ? 'Real Calls: Connected to backend API' : 'Demo Mode: Calls are simulated'} • {nodes.length} nodes in workflow</p>
                {workflowConfig?.twilio ? (
                  <p>Using workflow Twilio configuration {isBackendAvailable() ? '' : '(demo)'}</p>
                ) : (
                  <p>Using default Twilio configuration {isBackendAvailable() ? '' : '(demo)'}</p>
                )}
                {!isBackendAvailable() && (
                  <p className="text-blue-600 mt-1">Deploy the backend API to make real calls</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PlaygroundModal;
