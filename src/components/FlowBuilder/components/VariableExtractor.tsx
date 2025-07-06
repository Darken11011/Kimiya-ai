import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Variable } from 'lucide-react';
import { VariableType, ExtractedVariable } from '../../../types/flowTypes';
import { useFlowStore } from '../../../stores/flowStore';

interface VariableExtractorProps {
  nodeId: string;
  existingVariables?: ExtractedVariable[];
  onVariablesChange?: (variables: ExtractedVariable[]) => void;
}

const VariableExtractor: React.FC<VariableExtractorProps> = ({
  nodeId,
  existingVariables = [],
  onVariablesChange
}) => {
  const { addVariable, updateVariable, deleteVariable } = useFlowStore();
  const [variables, setVariables] = useState<ExtractedVariable[]>(existingVariables);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<ExtractedVariable>>({
    name: '',
    type: VariableType.STRING,
    description: '',
    nodeId
  });

  const handleAddVariable = () => {
    if (!newVariable.name) return;

    const variable: ExtractedVariable = {
      name: newVariable.name,
      type: newVariable.type || VariableType.STRING,
      description: newVariable.description,
      nodeId,
      enumValues: newVariable.type === VariableType.STRING ? newVariable.enumValues : undefined
    };

    const updatedVariables = [...variables, variable];
    setVariables(updatedVariables);
    addVariable(variable);
    onVariablesChange?.(updatedVariables);

    // Reset form
    setNewVariable({
      name: '',
      type: VariableType.STRING,
      description: '',
      nodeId
    });
    setIsAddingVariable(false);
  };

  const handleRemoveVariable = (variableName: string) => {
    const updatedVariables = variables.filter(v => v.name !== variableName);
    setVariables(updatedVariables);
    deleteVariable(variableName);
    onVariablesChange?.(updatedVariables);
  };

  const handleUpdateVariable = (index: number, updates: Partial<ExtractedVariable>) => {
    const updatedVariables = [...variables];
    updatedVariables[index] = { ...updatedVariables[index], ...updates };
    setVariables(updatedVariables);
    updateVariable(updatedVariables[index].name, updates);
    onVariablesChange?.(updatedVariables);
  };

  const addEnumValue = (variableIndex: number, value: string) => {
    if (!value.trim()) return;
    
    const variable = variables[variableIndex];
    const enumValues = [...(variable.enumValues || []), value.trim()];
    handleUpdateVariable(variableIndex, { enumValues });
  };

  const removeEnumValue = (variableIndex: number, valueIndex: number) => {
    const variable = variables[variableIndex];
    const enumValues = variable.enumValues?.filter((_, i) => i !== valueIndex) || [];
    handleUpdateVariable(variableIndex, { enumValues });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4" />
          <Label className="text-sm font-medium">Extract Variables</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingVariable(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Variable
        </Button>
      </div>

      {/* Existing Variables */}
      {variables.map((variable, index) => (
        <div key={variable.name} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{variable.name}</Badge>
              <Badge variant="outline">{variable.type}</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRemoveVariable(variable.name)}
              className="px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Variable Name</Label>
              <Input
                value={variable.name}
                onChange={(e) => handleUpdateVariable(index, { name: e.target.value })}
                placeholder="variable_name"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={variable.type}
                onValueChange={(value) => handleUpdateVariable(index, { type: value as VariableType })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VariableType.STRING}>String</SelectItem>
                  <SelectItem value={VariableType.NUMBER}>Number</SelectItem>
                  <SelectItem value={VariableType.INTEGER}>Integer</SelectItem>
                  <SelectItem value={VariableType.BOOLEAN}>Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={variable.description || ''}
              onChange={(e) => handleUpdateVariable(index, { description: e.target.value })}
              placeholder="Describe what this variable captures..."
              className="min-h-[60px] text-sm"
            />
          </div>

          {/* Enum Values for String Type */}
          {variable.type === VariableType.STRING && (
            <div>
              <Label className="text-xs">Predefined Values (Optional)</Label>
              <div className="space-y-2">
                {variable.enumValues?.map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) => {
                        const enumValues = [...(variable.enumValues || [])];
                        enumValues[valueIndex] = e.target.value;
                        handleUpdateVariable(index, { enumValues });
                      }}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEnumValue(index, valueIndex)}
                      className="px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addEnumValue(index, '')}
                  className="w-full h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Value
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Variable Form */}
      {isAddingVariable && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">New Variable</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingVariable(false)}
              className="px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Variable Name</Label>
              <Input
                value={newVariable.name || ''}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                placeholder="variable_name"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={newVariable.type}
                onValueChange={(value) => setNewVariable({ ...newVariable, type: value as VariableType })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VariableType.STRING}>String</SelectItem>
                  <SelectItem value={VariableType.NUMBER}>Number</SelectItem>
                  <SelectItem value={VariableType.INTEGER}>Integer</SelectItem>
                  <SelectItem value={VariableType.BOOLEAN}>Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={newVariable.description || ''}
              onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
              placeholder="Describe what this variable captures..."
              className="min-h-[60px] text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddVariable}
              size="sm"
              disabled={!newVariable.name}
            >
              Add Variable
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingVariable(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {variables.length === 0 && !isAddingVariable && (
        <div className="text-center py-6 text-muted-foreground">
          <Variable className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No variables extracted yet.</p>
          <p className="text-xs">Variables help create dynamic conditions between nodes.</p>
        </div>
      )}
    </div>
  );
};

export default VariableExtractor;
