import React from 'react';
import { X, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '../../stores/flowStore';
import { ComponentInput } from '../../types/componentTypes';

const ConfigPanel: React.FC = () => {
  const { 
    selectedNodeId, 
    nodes, 
    updateNode, 
    deleteNode, 
    selectNode,
    getComponent 
  } = useFlowStore();

  if (!selectedNodeId) return null;

  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  if (!selectedNode) return null;

  const componentDef = getComponent(selectedNode.type);
  if (!componentDef) return null;

  const handleClose = () => {
    selectNode(null);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNodeId);
    }
  };

  const handleInputChange = (inputName: string, value: any) => {
    updateNode(selectedNodeId, { [inputName]: value });
  };

  const renderInput = (input: ComponentInput) => {
    const currentValue = selectedNode.data[input.name] ?? input.defaultValue ?? '';

    switch (input.type) {
      case 'text':
      case 'password':
        return (
          <Input
            type={input.type}
            value={currentValue}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            placeholder={input.description}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleInputChange(input.name, Number(e.target.value))}
            placeholder={input.description}
            min={input.validation?.min}
            max={input.validation?.max}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            placeholder={input.description}
            rows={3}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => handleInputChange(input.name, checked)}
            />
            <span className="text-sm text-gray-600">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleInputChange(input.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={input.description} />
            </SelectTrigger>
            <SelectContent>
              {input.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleInputChange(input.name, file.name);
              }
            }}
          />
        );

      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            placeholder={input.description}
          />
        );
    }
  };

  return (
    <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: componentDef.color }}
            >
              {componentDef.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {componentDef.displayName}
              </h3>
              <p className="text-xs text-gray-500">
                {componentDef.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {componentDef.inputs.map((input) => (
          <div key={input.name} className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              {input.label}
              {input.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            {renderInput(input)}
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        ))}

        {componentDef.inputs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No configuration options available</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="w-full flex items-center justify-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Node</span>
        </Button>
      </div>
    </div>
  );
};

export default ConfigPanel;
