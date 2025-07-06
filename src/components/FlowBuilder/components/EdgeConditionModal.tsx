import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Info } from 'lucide-react';
import {
  ConditionType,
  LogicalOperator,
  VariableType,
  EdgeConditionData,
  LogicalCondition,
  ExtractedVariable
} from '../../../types/flowTypes';
import ConditionPreview from './ConditionPreview';

interface EdgeConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conditionData: EdgeConditionData) => void;
  initialData?: EdgeConditionData;
  availableVariables: ExtractedVariable[];
  edgeId?: string;
}

const EdgeConditionModal: React.FC<EdgeConditionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableVariables,
  edgeId
}) => {
  const [conditionType, setConditionType] = useState<ConditionType>(
    initialData?.type || ConditionType.NONE
  );
  const [aiCondition, setAiCondition] = useState(initialData?.aiCondition || '');
  const [logicalConditions, setLogicalConditions] = useState<LogicalCondition[]>(
    initialData?.logicalConditions || []
  );
  const [combinedCondition, setCombinedCondition] = useState(
    initialData?.combinedCondition || ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);

  useEffect(() => {
    if (initialData) {
      setConditionType(initialData.type);
      setAiCondition(initialData.aiCondition || '');
      setLogicalConditions(initialData.logicalConditions || []);
      setCombinedCondition(initialData.combinedCondition || '');
      setDescription(initialData.description || '');
      setIsDefault(initialData.isDefault || false);
    }
  }, [initialData]);

  const addLogicalCondition = () => {
    setLogicalConditions([
      ...logicalConditions,
      {
        variable: '',
        operator: LogicalOperator.EQUALS,
        value: '',
        combineWith: logicalConditions.length > 0 ? 'and' : undefined
      }
    ]);
  };

  const updateLogicalCondition = (index: number, updates: Partial<LogicalCondition>) => {
    const updated = [...logicalConditions];
    updated[index] = { ...updated[index], ...updates };
    setLogicalConditions(updated);
  };

  const removeLogicalCondition = (index: number) => {
    setLogicalConditions(logicalConditions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const conditionData: EdgeConditionData = {
      type: conditionType,
      description,
      isDefault
    };

    switch (conditionType) {
      case ConditionType.AI_BASED:
        conditionData.aiCondition = aiCondition;
        break;
      case ConditionType.LOGICAL:
        conditionData.logicalConditions = logicalConditions;
        break;
      case ConditionType.COMBINED:
        conditionData.combinedCondition = combinedCondition;
        break;
    }

    onSave(conditionData);
    onClose();
  };

  const getVariableByName = (name: string) => {
    return availableVariables.find(v => v.name === name);
  };

  const renderConditionTypeSelector = () => (
    <div className="space-y-2">
      <Label>Condition Type</Label>
      <Select value={conditionType} onValueChange={(value) => setConditionType(value as ConditionType)}>
        <SelectTrigger>
          <SelectValue placeholder="Select condition type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ConditionType.NONE}>No Condition (Default Path)</SelectItem>
          <SelectItem value={ConditionType.AI_BASED}>AI-Based Condition</SelectItem>
          <SelectItem value={ConditionType.LOGICAL}>Logical Condition</SelectItem>
          <SelectItem value={ConditionType.COMBINED}>Combined Condition</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderAiConditionInput = () => (
    <div className="space-y-2">
      <Label>AI Condition</Label>
      <Textarea
        value={aiCondition}
        onChange={(e) => setAiCondition(e.target.value)}
        placeholder="User wanted to talk about voice agents"
        className="min-h-[80px]"
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Write in natural language. Format as: "User [verb] [rest of condition]"</span>
      </div>
    </div>
  );

  const renderLogicalConditions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Logical Conditions</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLogicalCondition}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </Button>
      </div>
      
      {logicalConditions.map((condition, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          {index > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Combine with:</Label>
              <Select
                value={condition.combineWith || 'and'}
                onValueChange={(value) => updateLogicalCondition(index, { combineWith: value as 'and' | 'or' })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">AND</SelectItem>
                  <SelectItem value="or">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Variable</Label>
              <Select
                value={condition.variable}
                onValueChange={(value) => updateLogicalCondition(index, { variable: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variable" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariables.map((variable) => (
                    <SelectItem key={variable.name} value={variable.name}>
                      <div className="flex items-center gap-2">
                        <span>{variable.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {variable.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Operator</Label>
              <Select
                value={condition.operator}
                onValueChange={(value) => updateLogicalCondition(index, { operator: value as LogicalOperator })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LogicalOperator.EQUALS}>equals (==)</SelectItem>
                  <SelectItem value={LogicalOperator.NOT_EQUALS}>not equals (!=)</SelectItem>
                  <SelectItem value={LogicalOperator.GREATER_THAN}>greater than (&gt;)</SelectItem>
                  <SelectItem value={LogicalOperator.LESS_THAN}>less than (&lt;)</SelectItem>
                  <SelectItem value={LogicalOperator.GREATER_THAN_OR_EQUAL}>greater than or equal (&gt;=)</SelectItem>
                  <SelectItem value={LogicalOperator.LESS_THAN_OR_EQUAL}>less than or equal (&lt;=)</SelectItem>
                  <SelectItem value={LogicalOperator.CONTAINS}>contains</SelectItem>
                  <SelectItem value={LogicalOperator.NOT_CONTAINS}>not contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Value</Label>
              <div className="flex gap-2">
                <Input
                  value={condition.value?.toString() || ''}
                  onChange={(e) => {
                    const variable = getVariableByName(condition.variable);
                    let value: string | number | boolean = e.target.value;
                    
                    if (variable?.type === VariableType.NUMBER || variable?.type === VariableType.INTEGER) {
                      value = Number(e.target.value);
                    } else if (variable?.type === VariableType.BOOLEAN) {
                      value = e.target.value.toLowerCase() === 'true';
                    }
                    
                    updateLogicalCondition(index, { value });
                  }}
                  placeholder="Enter value"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLogicalCondition(index)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {logicalConditions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No logical conditions added yet.</p>
          <p className="text-sm">Click "Add Condition" to create your first condition.</p>
        </div>
      )}
    </div>
  );

  const renderCombinedCondition = () => (
    <div className="space-y-2">
      <Label>Combined Condition</Label>
      <Textarea
        value={combinedCondition}
        onChange={(e) => setCombinedCondition(e.target.value)}
        placeholder="customer_tier == 'VIP' or total_orders > 50"
        className="min-h-[80px]"
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Mix logical operators with variables. Use variable names directly or with curly braces: {'{'}{'{'} variable_name {'}'}{'}'}</span>
      </div>
    </div>
  );

  // Create current condition data for preview
  const currentConditionData: EdgeConditionData = {
    type: conditionType,
    aiCondition,
    logicalConditions,
    combinedCondition,
    description,
    isDefault
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Edge Condition</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="preview">Preview & Test</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6 mt-6">
            {renderConditionTypeSelector()}

            {conditionType === ConditionType.AI_BASED && renderAiConditionInput()}
            {conditionType === ConditionType.LOGICAL && renderLogicalConditions()}
            {conditionType === ConditionType.COMBINED && renderCombinedCondition()}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this condition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isDefault">Default path (fallback when no other conditions match)</Label>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <ConditionPreview
              condition={currentConditionData}
              availableVariables={availableVariables}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Condition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EdgeConditionModal;
