import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { PhoneOff } from 'lucide-react';

interface EndCallComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const EndCallComponent: React.FC<EndCallComponentProps> = ({ 
  id, 
  data, 
  definition 
}) => {
  const { updateNode } = useFlowStore();
  const [reason, setReason] = useState(data.reason || 'completed');
  const [farewell, setFarewell] = useState(data.farewell || '');

  useEffect(() => {
    setReason(data.reason || 'completed');
    setFarewell(data.farewell || '');
  }, [data.reason, data.farewell]);

  const handleReasonChange = (value: string) => {
    setReason(value);
    updateNode(id, { reason: value });
  };

  const handleFarewellChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFarewell(value);
    updateNode(id, { farewell: value });
  };

  const reasonOptions = [
    { value: 'completed', label: 'Call Completed' },
    { value: 'user_hangup', label: 'User Hung Up' },
    { value: 'timeout', label: 'Timeout' },
    { value: 'error', label: 'Error Occurred' },
    { value: 'transferred', label: 'Call Transferred' }
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`reason-${id}`} className="text-sm font-medium">
          End Reason
        </Label>
        <Select value={reason} onValueChange={handleReasonChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select end reason" />
          </SelectTrigger>
          <SelectContent>
            {reasonOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor={`farewell-${id}`} className="text-sm font-medium">
          Farewell Message (Optional)
        </Label>
        <Textarea
          id={`farewell-${id}`}
          value={farewell}
          onChange={handleFarewellChange}
          placeholder="Thank you for calling. Have a great day!"
          className="mt-1 min-h-[60px]"
          rows={2}
        />
      </div>
    </div>
  );
};

// Component definition
export const endCallDefinition: ComponentDefinition = {
  type: 'endCall',
  displayName: 'End Call',
  description: 'Terminates the phone call',
  category: 'Communication',
  icon: <PhoneOff size={16} />,
  color: '#ef4444', // red-500
  inputs: [
    {
      name: 'reason',
      type: 'select',
      label: 'End Reason',
      description: 'The reason for ending the call',
      required: true,
      defaultValue: 'completed',
      options: [
        { label: 'Call Completed', value: 'completed' },
        { label: 'User Hung Up', value: 'user_hangup' },
        { label: 'Timeout', value: 'timeout' },
        { label: 'Error Occurred', value: 'error' },
        { label: 'Call Transferred', value: 'transferred' }
      ]
    },
    {
      name: 'farewell',
      type: 'textarea',
      label: 'Farewell Message',
      description: 'Optional farewell message to play before ending',
      required: false,
      validation: {
        max: 500,
        message: 'Farewell message must be less than 500 characters'
      }
    }
  ],
  outputs: [
    {
      name: 'callDuration',
      type: 'number',
      description: 'Total duration of the call in seconds'
    },
    {
      name: 'endTime',
      type: 'string',
      description: 'Timestamp when the call ended'
    },
    {
      name: 'status',
      type: 'string',
      description: 'Final status of the call'
    }
  ],
  handles: [
    {
      id: 'input',
      type: 'target',
      position: 'top'
    }
  ],
  defaultData: {
    reason: 'completed',
    farewell: 'Thank you for calling. Have a great day!'
  },
  component: EndCallComponent,
  tags: ['phone', 'call', 'end', 'hangup', 'twilio'],
  documentation: 'Terminates the phone call with optional farewell message. Records call duration and end status for analytics.'
};

export default EndCallComponent;
