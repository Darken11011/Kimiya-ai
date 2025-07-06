import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  ConditionType, 
  EdgeConditionData, 
  ExtractedVariable, 
  LogicalCondition,
  LogicalOperator,
  VariableType 
} from '../../../types/flowTypes';

interface ConditionPreviewProps {
  condition: EdgeConditionData;
  availableVariables: ExtractedVariable[];
}

interface TestValues {
  [variableName: string]: string | number | boolean;
}

interface EvaluationResult {
  result: boolean;
  explanation: string;
  steps: string[];
}

const ConditionPreview: React.FC<ConditionPreviewProps> = ({
  condition,
  availableVariables
}) => {
  const [testValues, setTestValues] = useState<TestValues>({});
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Get variables used in this condition
  const usedVariables = useMemo(() => {
    const variables = new Set<string>();
    
    if (condition.type === ConditionType.LOGICAL && condition.logicalConditions) {
      condition.logicalConditions.forEach(cond => variables.add(cond.variable));
    } else if (condition.type === ConditionType.COMBINED && condition.combinedCondition) {
      // Look for both {{ variable }} and plain variable names
      const liquidMatches = condition.combinedCondition.match(/\{\{\s*([\w]+)\s*[^}]*\}\}/g);
      if (liquidMatches) {
        liquidMatches.forEach(match => {
          const varName = match.replace(/[{}]/g, '').trim().split(/\s+/)[0];
          variables.add(varName);
        });
      }

      // Also look for plain variable names (simple word matching)
      availableVariables.forEach(variable => {
        if (condition.combinedCondition!.includes(variable.name)) {
          variables.add(variable.name);
        }
      });
    }
    
    return Array.from(variables)
      .map(name => availableVariables.find(v => v.name === name))
      .filter(Boolean) as ExtractedVariable[];
  }, [condition, availableVariables]);

  const evaluateLogicalCondition = (logicalCond: LogicalCondition, values: TestValues): boolean => {
    const variable = availableVariables.find(v => v.name === logicalCond.variable);
    if (!variable) return false;

    const testValue = values[logicalCond.variable];
    const conditionValue = logicalCond.value;

    switch (logicalCond.operator) {
      case LogicalOperator.EQUALS:
        return testValue == conditionValue;
      case LogicalOperator.NOT_EQUALS:
        return testValue != conditionValue;
      case LogicalOperator.GREATER_THAN:
        return Number(testValue) > Number(conditionValue);
      case LogicalOperator.LESS_THAN:
        return Number(testValue) < Number(conditionValue);
      case LogicalOperator.GREATER_THAN_OR_EQUAL:
        return Number(testValue) >= Number(conditionValue);
      case LogicalOperator.LESS_THAN_OR_EQUAL:
        return Number(testValue) <= Number(conditionValue);
      case LogicalOperator.CONTAINS:
        return String(testValue).includes(String(conditionValue));
      case LogicalOperator.NOT_CONTAINS:
        return !String(testValue).includes(String(conditionValue));
      default:
        return false;
    }
  };

  const evaluateCondition = (): EvaluationResult => {
    const steps: string[] = [];
    let result = false;
    let explanation = '';

    switch (condition.type) {
      case ConditionType.NONE:
        result = true;
        explanation = 'No condition - always true (default path)';
        steps.push('This is a default path with no conditions');
        break;

      case ConditionType.AI_BASED:
        result = true; // Simulated - in real implementation, this would call AI
        explanation = 'AI-based condition (simulated as true for preview)';
        steps.push(`AI evaluating: "${condition.aiCondition}"`);
        steps.push('Result: TRUE (simulated)');
        break;

      case ConditionType.LOGICAL:
        if (condition.logicalConditions) {
          const results: boolean[] = [];
          
          for (let i = 0; i < condition.logicalConditions.length; i++) {
            const logicalCond = condition.logicalConditions[i];
            const condResult = evaluateLogicalCondition(logicalCond, testValues);
            results.push(condResult);
            
            const testValue = testValues[logicalCond.variable];
            steps.push(
              `${logicalCond.variable} (${testValue}) ${logicalCond.operator} ${logicalCond.value} = ${condResult}`
            );
          }
          
          // Combine results based on logical operators
          result = results[0];
          for (let i = 1; i < results.length; i++) {
            const combineWith = condition.logicalConditions[i].combineWith || 'and';
            if (combineWith === 'and') {
              result = result && results[i];
              steps.push(`Previous result AND ${results[i]} = ${result}`);
            } else {
              result = result || results[i];
              steps.push(`Previous result OR ${results[i]} = ${result}`);
            }
          }
          
          explanation = `Logical condition evaluated to ${result}`;
        }
        break;

      case ConditionType.COMBINED:
        if (condition.combinedCondition) {
          // Try to evaluate the combined condition with test values
          let evaluatedCondition = condition.combinedCondition;

          // Replace variables with their test values
          usedVariables.forEach(variable => {
            const testValue = testValues[variable.name];
            if (testValue !== undefined) {
              // Replace both {{ variable }} and plain variable patterns
              const liquidPattern = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
              const plainPattern = new RegExp(`\\b${variable.name}\\b`, 'g');

              const valueStr = typeof testValue === 'string' ? `'${testValue}'` : String(testValue);
              evaluatedCondition = evaluatedCondition.replace(liquidPattern, valueStr);
              evaluatedCondition = evaluatedCondition.replace(plainPattern, valueStr);

              steps.push(`Replaced ${variable.name} with ${valueStr}`);
            }
          });

          steps.push(`Final expression: ${evaluatedCondition}`);

          try {
            // Simple evaluation for basic expressions (this is a simplified version)
            // In a real implementation, you'd use a proper expression evaluator
            result = true; // Simulated for safety
            explanation = 'Combined condition evaluated (simulated)';
            steps.push('Result: TRUE (simulated - actual evaluation would happen at runtime)');
          } catch (error) {
            result = false;
            explanation = 'Combined condition evaluation failed';
            steps.push(`Error: ${error}`);
          }
        }
        break;
    }

    return { result, explanation, steps };
  };

  const handleTestCondition = () => {
    const result = evaluateCondition();
    setEvaluationResult(result);
  };

  const handleValueChange = (variableName: string, value: string) => {
    const variable = availableVariables.find(v => v.name === variableName);
    if (!variable) return;

    let parsedValue: string | number | boolean = value;
    
    if (variable.type === VariableType.NUMBER || variable.type === VariableType.INTEGER) {
      parsedValue = Number(value);
    } else if (variable.type === VariableType.BOOLEAN) {
      parsedValue = value.toLowerCase() === 'true';
    }

    setTestValues(prev => ({
      ...prev,
      [variableName]: parsedValue
    }));
  };

  const getConditionSummary = () => {
    switch (condition.type) {
      case ConditionType.AI_BASED:
        return condition.aiCondition;
      case ConditionType.LOGICAL:
        if (condition.logicalConditions && condition.logicalConditions.length > 0) {
          return condition.logicalConditions
            .map(cond => `${cond.variable} ${cond.operator} ${cond.value}`)
            .join(` ${condition.logicalConditions[1]?.combineWith || 'and'} `);
        }
        return 'No logical conditions';
      case ConditionType.COMBINED:
        return condition.combinedCondition;
      case ConditionType.NONE:
        return condition.isDefault ? 'Default path' : 'No condition';
      default:
        return 'Unknown condition type';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="w-5 h-5" />
          Condition Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition Summary */}
        <div>
          <Label className="text-sm font-medium">Condition</Label>
          <div className="mt-1 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {condition.type.replace('_', ' ').toUpperCase()}
              </Badge>
              {condition.isDefault && (
                <Badge variant="secondary">Default Path</Badge>
              )}
            </div>
            <p className="text-sm text-gray-700">{getConditionSummary()}</p>
          </div>
        </div>

        {/* Test Values Input */}
        {usedVariables.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Test Values</Label>
              <div className="mt-2 space-y-3">
                {usedVariables.map(variable => (
                  <div key={variable.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-sm font-medium">{variable.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {variable.type}
                      </Badge>
                    </div>
                    <Input
                      value={testValues[variable.name]?.toString() || ''}
                      onChange={(e) => handleValueChange(variable.name, e.target.value)}
                      placeholder={`Enter ${variable.type} value`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Test Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleTestCondition}
            className="flex items-center gap-2"
            disabled={usedVariables.some(v => testValues[v.name] === undefined) && condition.type === ConditionType.LOGICAL}
          >
            <Play className="w-4 h-4" />
            Test Condition
          </Button>
        </div>

        {/* Evaluation Result */}
        {evaluationResult && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Evaluation Result</Label>
              <div className="mt-2 space-y-3">
                <div className={`flex items-center gap-2 p-3 rounded-md ${
                  evaluationResult.result 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {evaluationResult.result ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    evaluationResult.result ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {evaluationResult.result ? 'CONDITION MET' : 'CONDITION NOT MET'}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">{evaluationResult.explanation}</p>
                  {evaluationResult.steps.length > 0 && (
                    <div className="bg-gray-50 rounded-md p-3">
                      <Label className="text-xs font-medium text-gray-500 mb-2 block">
                        Evaluation Steps:
                      </Label>
                      <div className="space-y-1">
                        {evaluationResult.steps.map((step, index) => (
                          <div key={index} className="text-xs text-gray-600 font-mono">
                            {index + 1}. {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Text */}
        {condition.type === ConditionType.AI_BASED && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">AI-Based Condition</p>
              <p>This condition will be evaluated by AI during runtime. The preview shows a simulated result.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConditionPreview;
