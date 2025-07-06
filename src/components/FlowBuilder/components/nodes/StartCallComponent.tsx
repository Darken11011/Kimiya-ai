import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { Phone } from 'lucide-react';

interface StartCallComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const StartCallComponent: React.FC<StartCallComponentProps> = ({
  id,
  data
}) => {
  const { updateNode } = useFlowStore();
  const [firstMessage, setFirstMessage] = useState<string>((data.firstMessage as string) || '');
  const [globalPrompt, setGlobalPrompt] = useState<string>((data.globalPrompt as string) || '');

  useEffect(() => {
    setFirstMessage((data.firstMessage as string) || '');
    setGlobalPrompt((data.globalPrompt as string) || '');
  }, [data.firstMessage, data.globalPrompt]);

  const handleFirstMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFirstMessage(value);
    updateNode(id, { firstMessage: value });
  };

  const handleGlobalPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setGlobalPrompt(value);
    updateNode(id, { globalPrompt: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`firstMessage-${id}`} className="text-sm font-medium">
          First Message (Optional)
        </Label>
        <Textarea
          id={`firstMessage-${id}`}
          value={firstMessage}
          onChange={handleFirstMessageChange}
          placeholder="Hello! How can I help you today?"
          className="mt-1 min-h-[60px]"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          Initial message when the call starts. Leave empty to wait for user input.
        </p>
      </div>

      <div>
        <Label htmlFor={`globalPrompt-${id}`} className="text-sm font-medium">
          Global System Prompt
        </Label>
        <Textarea
          id={`globalPrompt-${id}`}
          value={globalPrompt}
          onChange={handleGlobalPromptChange}
          placeholder="You are a helpful AI assistant. Be professional, friendly, and concise in your responses..."
          className="mt-1 min-h-[100px]"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          Global instructions that apply to the entire conversation flow
        </p>
      </div>
    </div>
  );
};

// Component definition
export const startCallDefinition: ComponentDefinition = {
  type: 'startNode',
  displayName: 'Start Node',
  description: 'Entry point for the conversation flow',
  category: 'Input',
  icon: <Phone size={16} />,
  color: '#10b981', // green-500
  inputs: [
    {
      name: 'firstMessage',
      type: 'textarea',
      label: 'First Message',
      description: 'Optional initial message when the call starts',
      required: false,
      validation: {
        max: 500,
        message: 'First message must be less than 500 characters'
      }
    },
    {
      name: 'globalPrompt',
      type: 'textarea',
      label: 'Global System Prompt',
      description: 'Global instructions that apply to the entire conversation',
      required: true,
      validation: {
        max: 4000,
        message: 'Global prompt must be less than 4000 characters'
      }
    }
  ],
  outputs: [
    {
      name: 'conversationStarted',
      type: 'boolean',
      description: 'Indicates the conversation has started'
    },
    {
      name: 'callId',
      type: 'string',
      description: 'Unique identifier for this call session'
    }
  ],
  handles: [
    {
      id: 'output',
      type: 'source',
      position: 'bottom'
    }
  ],
  defaultData: {
    firstMessage: '',
    globalPrompt: 'You are a helpful AI assistant. Be professional, friendly, and concise in your responses. Listen carefully to the user and provide accurate, helpful information.'
  },
  component: StartCallComponent,
  tags: ['start', 'entry', 'conversation', 'global', 'prompt'],
  documentation: 'Entry point for conversation flows. Configure the global system prompt that applies to all AI interactions and optionally set a first message.'
};

export default StartCallComponent;
