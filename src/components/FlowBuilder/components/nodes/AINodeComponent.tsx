import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { Brain } from 'lucide-react';

interface AINodeComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const AINodeComponent: React.FC<AINodeComponentProps> = ({
  id,
  data
}) => {
  const { updateNode } = useFlowStore();
  const [prompt, setPrompt] = useState<string>((data.prompt as string) || '');
  const [model, setModel] = useState<string>((data.model as string) || 'gpt-4o');

  useEffect(() => {
    setPrompt((data.prompt as string) || '');
    setModel((data.model as string) || 'gpt-4o');
  }, [data.prompt, data.model]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    updateNode(id, { prompt: value });
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    updateNode(id, { model: value });
  };

  const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`model-${id}`} className="text-sm font-medium">
          AI Model
        </Label>
        <Select value={model} onValueChange={handleModelChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`prompt-${id}`} className="text-sm font-medium">
          Conversation Prompt
        </Label>
        <Textarea
          id={`prompt-${id}`}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Provide detailed instructions guiding agent responses and conversation direction..."
          className="mt-1 min-h-[100px]"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          This prompt guides how the AI responds in this conversation node
        </p>
      </div>
    </div>
  );
};

// Component definition
export const aiNodeDefinition: ComponentDefinition = {
  type: 'conversationNode',
  displayName: 'Conversation Node',
  description: 'AI conversation with configurable prompts and models',
  category: 'AI & ML',
  icon: <Brain size={16} />,
  color: '#8b5cf6', // purple-500
  inputs: [
    {
      name: 'model',
      type: 'select',
      label: 'AI Model',
      description: 'The AI model to use for conversation',
      required: true,
      defaultValue: 'gpt-4o',
      options: [
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus' },
        { label: 'Claude 3 Haiku', value: 'claude-3-haiku' }
      ]
    },
    {
      name: 'prompt',
      type: 'textarea',
      label: 'Conversation Prompt',
      description: 'Detailed instructions guiding agent responses and conversation direction',
      required: true,
      validation: {
        max: 4000,
        message: 'Prompt must be less than 4000 characters'
      }
    }
  ],
  outputs: [
    {
      name: 'response',
      type: 'string',
      description: 'The AI conversation response'
    },
    {
      name: 'extractedVariables',
      type: 'object',
      description: 'Variables extracted from the conversation'
    }
  ],
  handles: [
    {
      id: 'input',
      type: 'target',
      position: 'top'
    },
    {
      id: 'output',
      type: 'source',
      position: 'bottom'
    }
  ],
  defaultData: {
    model: 'gpt-4o',
    prompt: 'You are a helpful AI assistant. Be conversational, friendly, and helpful. Guide the conversation naturally based on the user\'s needs.'
  },
  component: AINodeComponent,
  tags: ['ai', 'conversation', 'llm', 'gpt', 'claude', 'chat'],
  documentation: 'Main conversation node for AI-powered real-time voice interactions. Configure the AI model and conversation prompt to guide the agent\'s behavior.'
};

export default AINodeComponent;
