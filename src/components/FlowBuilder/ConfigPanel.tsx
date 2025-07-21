import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFlowStore } from '../../stores/flowStore';
import { ComponentInput } from '../../types/componentTypes';
import { VariableType, ExtractedVariable } from '../../types/flowTypes';
import VariableExtractor from './components/VariableExtractor';

const ConfigPanel: React.FC = () => {
  const {
    selectedNodeId,
    nodes,
    updateNode,
    deleteNode,
    selectNode,
    getComponent,
    getAvailableVariables
  } = useFlowStore();

  // Resize functionality state
  const [panelWidth, setPanelWidth] = useState(() => {
    // Load saved width from localStorage or use default
    const saved = localStorage.getItem('configPanelWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Minimum and maximum panel widths
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 600;

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle double-click to reset width
  const handleDoubleClick = () => {
    setPanelWidth(320); // Reset to default width
  };

  // Handle resize during mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, MIN_WIDTH, MAX_WIDTH]);

  // Save panel width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('configPanelWidth', panelWidth.toString());
  }, [panelWidth]);

  // Helper function to convert component output type to VariableType
  const mapOutputTypeToVariableType = (outputType: string): VariableType => {
    switch (outputType.toLowerCase()) {
      case 'string':
        return VariableType.STRING;
      case 'number':
        return VariableType.NUMBER;
      case 'integer':
        return VariableType.INTEGER;
      case 'boolean':
        return VariableType.BOOLEAN;
      default:
        return VariableType.STRING; // Default to string for objects and other types
    }
  };

  // Generate suggested variables from node outputs
  const generateSuggestedVariables = (nodeId: string, outputs: any[]): ExtractedVariable[] => {
    return outputs.map(output => {
      const nodeLabel = typeof selectedNode?.data?.label === 'string'
        ? selectedNode.data.label.toLowerCase().replace(/\s+/g, '_')
        : 'node';

      return {
        name: `${nodeLabel}_${output.name}`,
        type: mapOutputTypeToVariableType(output.type),
        description: output.description || `Output from ${componentDef?.displayName}: ${output.name}`,
        nodeId: nodeId
      };
    });
  };

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
    <div
      ref={panelRef}
      className="bg-white shadow-lg border-l border-gray-200 flex flex-col h-full relative"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize group transition-all duration-200 ${
          isResizing ? 'bg-blue-500/20' : 'hover:bg-gray-200/50'
        }`}
        onMouseDown={handleResizeStart}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize panel • Double-click to reset width"
      >
        {/* Visual indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-colors ${
          isResizing ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'
        }`} />

        {/* Grip icon */}
        <div className={`absolute left-0.5 top-1/2 transform -translate-y-1/2 transition-opacity ${
          isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
        }`}>
          <GripVertical className="h-4 w-4 text-gray-500 rotate-90" />
        </div>
      </div>
      {/* Header */}
      <div className="p-4 pl-6 border-b border-gray-200">
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
      <div className="flex-1 overflow-y-auto p-4 pl-6 space-y-4">
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

        {/* Variable Extraction Section - Show for nodes that have outputs */}
        {componentDef.outputs && componentDef.outputs.length > 0 && (
          <div className="border-t pt-4 mt-6">
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700">Output Variables</Label>
              <p className="text-xs text-gray-500 mt-1">
                Define variables that this node will output for use in conditional edges and other nodes.
              </p>
            </div>
            <VariableExtractor
              nodeId={selectedNodeId}
              existingVariables={generateSuggestedVariables(selectedNodeId, componentDef.outputs)}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 pl-6 border-t border-gray-200">
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
