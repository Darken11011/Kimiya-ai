import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ComponentDefinition } from '../../../../types/componentTypes';
import { useFlowStore } from '../../../../stores/flowStore';
import { PhoneForwarded } from 'lucide-react';

interface TransferCallComponentProps extends NodeProps {
  definition: ComponentDefinition;
}

const TransferCallComponent: React.FC<TransferCallComponentProps> = ({ 
  id, 
  data
}) => {
  const { updateNode } = useFlowStore();
  const [destination, setDestination] = useState<string>((data.destination as string) || '');
  const [transferMessage, setTransferMessage] = useState<string>((data.transferMessage as string) || '');

  useEffect(() => {
    setDestination((data.destination as string) || '');
    setTransferMessage((data.transferMessage as string) || '');
  }, [data.destination, data.transferMessage]);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);
    updateNode(id, { destination: value });
  };

  const handleTransferMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTransferMessage(value);
    updateNode(id, { transferMessage: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`destination-${id}`} className="text-sm font-medium">
          Transfer Destination
        </Label>
        <Input
          id={`destination-${id}`}
          value={destination}
          onChange={handleDestinationChange}
          placeholder="+1234567890 or agent@company.com"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Phone number or agent identifier to transfer the call to
        </p>
      </div>
      
      <div>
        <Label htmlFor={`message-${id}`} className="text-sm font-medium">
          Transfer Message (Optional)
        </Label>
        <Textarea
          id={`message-${id}`}
          value={transferMessage}
          onChange={handleTransferMessageChange}
          placeholder="Brief summary of the call for the receiving agent..."
          className="mt-1 min-h-[80px]"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Message or summary to provide to the receiving agent
        </p>
      </div>
    </div>
  );
};

// Component definition
export const transferCallDefinition: ComponentDefinition = {
  type: 'transferCall',
  displayName: 'Transfer Call',
  description: 'Transfer call to another agent or number',
  category: 'Communication',
  icon: <PhoneForwarded size={16} />,
  color: '#f59e0b', // amber-500
  inputs: [
    {
      name: 'destination',
      type: 'text',
      label: 'Transfer Destination',
      description: 'Phone number or agent identifier to transfer to',
      required: true,
      validation: {
        pattern: '^(\\+?[1-9]\\d{1,14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$',
        message: 'Please enter a valid phone number or email'
      }
    },
    {
      name: 'transferMessage',
      type: 'textarea',
      label: 'Transfer Message',
      description: 'Optional message or summary for the receiving agent',
      required: false,
      validation: {
        max: 500,
        message: 'Transfer message must be less than 500 characters'
      }
    }
  ],
  outputs: [
    {
      name: 'transferStatus',
      type: 'string',
      description: 'Status of the transfer attempt'
    },
    {
      name: 'transferTime',
      type: 'string',
      description: 'Timestamp when transfer was initiated'
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
    destination: '',
    transferMessage: 'Transferring customer call. Please assist with their inquiry.'
  },
  component: TransferCallComponent,
  tags: ['transfer', 'call', 'agent', 'handoff', 'escalation'],
  documentation: 'Transfer the call to another phone number or agent. Optionally provide a summary message to the receiving party.'
};

export default TransferCallComponent;
