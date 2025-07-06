import { Node } from '@xyflow/react';
import { 
  ConditionalEdge, 
  ConditionType, 
  ExtractedVariable, 
  LogicalCondition,
  LogicalOperator,
  VariableType 
} from '../types/flowTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlowValidationResult extends ValidationResult {
  nodeValidation: Map<string, ValidationResult>;
  edgeValidation: Map<string, ValidationResult>;
}

export class FlowValidator {
  private nodes: Node[];
  private edges: ConditionalEdge[];
  private variables: ExtractedVariable[];

  constructor(nodes: Node[], edges: ConditionalEdge[], variables: ExtractedVariable[] = []) {
    this.nodes = nodes;
    this.edges = edges;
    this.variables = variables;
  }

  validate(): FlowValidationResult {
    const result: FlowValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      nodeValidation: new Map(),
      edgeValidation: new Map()
    };

    // Validate basic flow structure
    this.validateFlowStructure(result);
    
    // Validate nodes
    this.validateNodes(result);
    
    // Validate edges and conditions
    this.validateEdges(result);
    
    // Validate conditional logic
    this.validateConditionalLogic(result);
    
    // Check for unreachable nodes
    this.validateReachability(result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateFlowStructure(result: FlowValidationResult): void {
    // Check if flow has nodes
    if (this.nodes.length === 0) {
      result.errors.push('Flow is empty - add at least one node');
      return;
    }

    // Check for start node
    const startNodes = this.nodes.filter(node => 
      node.type === 'startNode' || node.type === 'startCall'
    );
    
    if (startNodes.length === 0) {
      result.errors.push('Flow must have a start node');
    } else if (startNodes.length > 1) {
      result.warnings.push('Multiple start nodes detected - only one will be used');
    }

    // Check for end nodes
    const endNodes = this.nodes.filter(node => 
      node.type === 'endCall' || node.type === 'endNode'
    );
    
    if (endNodes.length === 0) {
      result.warnings.push('Flow has no end nodes - calls may run indefinitely');
    }
  }

  private validateNodes(result: FlowValidationResult): void {
    for (const node of this.nodes) {
      const nodeResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Validate node-specific requirements
      this.validateNodeData(node, nodeResult);
      
      result.nodeValidation.set(node.id, nodeResult);
      
      if (!nodeResult.isValid) {
        result.errors.push(...nodeResult.errors.map(err => `Node ${node.id}: ${err}`));
      }
      result.warnings.push(...nodeResult.warnings.map(warn => `Node ${node.id}: ${warn}`));
    }
  }

  private validateNodeData(node: Node, result: ValidationResult): void {
    switch (node.type) {
      case 'conversationNode':
        if (!node.data?.prompt) {
          result.errors.push('Conversation node requires a prompt');
          result.isValid = false;
        }
        break;
      
      case 'apiRequest':
        if (!node.data?.url) {
          result.errors.push('API request node requires a URL');
          result.isValid = false;
        }
        if (!node.data?.method) {
          result.warnings.push('API request method not specified - defaulting to GET');
        }
        break;
      
      case 'transferCall':
        if (!node.data?.phoneNumber) {
          result.errors.push('Transfer call node requires a phone number');
          result.isValid = false;
        }
        break;
    }
  }

  private validateEdges(result: FlowValidationResult): void {
    for (const edge of this.edges) {
      const edgeResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      this.validateEdgeCondition(edge, edgeResult);
      
      result.edgeValidation.set(edge.id, edgeResult);
      
      if (!edgeResult.isValid) {
        result.errors.push(...edgeResult.errors.map(err => `Edge ${edge.id}: ${err}`));
      }
      result.warnings.push(...edgeResult.warnings.map(warn => `Edge ${edge.id}: ${warn}`));
    }
  }

  private validateEdgeCondition(edge: ConditionalEdge, result: ValidationResult): void {
    if (!edge.data) return;

    const { type, aiCondition, logicalConditions, combinedCondition } = edge.data;

    switch (type) {
      case ConditionType.AI_BASED:
        if (!aiCondition || aiCondition.trim().length === 0) {
          result.errors.push('AI-based condition cannot be empty');
          result.isValid = false;
        } else if (aiCondition.length < 10) {
          result.warnings.push('AI condition is very short - consider adding more detail');
        }
        break;

      case ConditionType.LOGICAL:
        if (!logicalConditions || logicalConditions.length === 0) {
          result.errors.push('Logical condition requires at least one condition');
          result.isValid = false;
        } else {
          this.validateLogicalConditions(logicalConditions, result);
        }
        break;

      case ConditionType.COMBINED:
        if (!combinedCondition || combinedCondition.trim().length === 0) {
          result.errors.push('Combined condition cannot be empty');
          result.isValid = false;
        } else {
          this.validateCombinedCondition(combinedCondition, result);
        }
        break;
    }
  }

  private validateLogicalConditions(conditions: LogicalCondition[], result: ValidationResult): void {
    for (const condition of conditions) {
      // Check if variable exists
      const variable = this.variables.find(v => v.name === condition.variable);
      if (!variable) {
        result.errors.push(`Variable '${condition.variable}' not found`);
        result.isValid = false;
        continue;
      }

      // Validate operator compatibility with variable type
      this.validateOperatorCompatibility(condition, variable, result);
      
      // Validate value type
      this.validateValueType(condition, variable, result);
    }
  }

  private validateOperatorCompatibility(
    condition: LogicalCondition, 
    variable: ExtractedVariable, 
    result: ValidationResult
  ): void {
    const numericOperators = [
      LogicalOperator.GREATER_THAN,
      LogicalOperator.LESS_THAN,
      LogicalOperator.GREATER_THAN_OR_EQUAL,
      LogicalOperator.LESS_THAN_OR_EQUAL
    ];

    const stringOperators = [
      LogicalOperator.CONTAINS,
      LogicalOperator.NOT_CONTAINS
    ];

    if (numericOperators.includes(condition.operator) && 
        variable.type !== VariableType.NUMBER && 
        variable.type !== VariableType.INTEGER) {
      result.warnings.push(
        `Operator '${condition.operator}' used with non-numeric variable '${variable.name}'`
      );
    }

    if (stringOperators.includes(condition.operator) && 
        variable.type !== VariableType.STRING) {
      result.warnings.push(
        `Operator '${condition.operator}' used with non-string variable '${variable.name}'`
      );
    }
  }

  private validateValueType(
    condition: LogicalCondition, 
    variable: ExtractedVariable, 
    result: ValidationResult
  ): void {
    const value = condition.value;

    switch (variable.type) {
      case VariableType.NUMBER:
      case VariableType.INTEGER:
        if (typeof value !== 'number' && isNaN(Number(value))) {
          result.errors.push(
            `Value '${value}' is not a valid number for variable '${variable.name}'`
          );
          result.isValid = false;
        }
        break;

      case VariableType.BOOLEAN:
        if (typeof value !== 'boolean' && 
            value !== 'true' && 
            value !== 'false') {
          result.errors.push(
            `Value '${value}' is not a valid boolean for variable '${variable.name}'`
          );
          result.isValid = false;
        }
        break;

      case VariableType.STRING:
        if (variable.enumValues && variable.enumValues.length > 0) {
          if (!variable.enumValues.includes(String(value))) {
            result.warnings.push(
              `Value '${value}' is not in predefined values for variable '${variable.name}'`
            );
          }
        }
        break;
    }
  }

  private validateCombinedCondition(condition: string, result: ValidationResult): void {
    // Basic validation for liquid syntax
    const liquidPattern = /\{\{\s*[\w\s\.\[\]]+\s*\}\}/g;
    const matches = condition.match(liquidPattern);
    
    if (matches) {
      for (const match of matches) {
        const variableName = match.replace(/[{}]/g, '').trim().split(/\s+/)[0];
        const variable = this.variables.find(v => v.name === variableName);
        if (!variable) {
          result.warnings.push(`Variable '${variableName}' in combined condition not found`);
        }
      }
    }
  }

  private validateConditionalLogic(result: FlowValidationResult): void {
    // Group edges by source node
    const edgesBySource = new Map<string, ConditionalEdge[]>();
    for (const edge of this.edges) {
      const sourceEdges = edgesBySource.get(edge.source) || [];
      sourceEdges.push(edge);
      edgesBySource.set(edge.source, sourceEdges);
    }

    // Check for nodes with multiple outgoing edges
    for (const [nodeId, edges] of edgesBySource) {
      if (edges.length > 1) {
        this.validateMultipleConditions(nodeId, edges, result);
      }
    }
  }

  private validateMultipleConditions(
    nodeId: string, 
    edges: ConditionalEdge[], 
    result: FlowValidationResult
  ): void {
    const hasDefault = edges.some(edge => edge.data?.isDefault);
    const hasConditions = edges.some(edge => 
      edge.data?.type !== ConditionType.NONE && !edge.data?.isDefault
    );

    if (hasConditions && !hasDefault) {
      result.warnings.push(
        `Node ${nodeId} has conditional edges but no default path - some cases may not be handled`
      );
    }

    if (edges.filter(edge => edge.data?.isDefault).length > 1) {
      result.errors.push(`Node ${nodeId} has multiple default paths`);
    }
  }

  private validateReachability(result: FlowValidationResult): void {
    const startNodes = this.nodes.filter(node => 
      node.type === 'startNode' || node.type === 'startCall'
    );
    
    if (startNodes.length === 0) return;

    const reachableNodes = new Set<string>();
    const queue = [startNodes[0].id];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (reachableNodes.has(currentNodeId)) continue;
      
      reachableNodes.add(currentNodeId);
      
      // Add connected nodes to queue
      const outgoingEdges = this.edges.filter(edge => edge.source === currentNodeId);
      for (const edge of outgoingEdges) {
        if (!reachableNodes.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    // Check for unreachable nodes
    const unreachableNodes = this.nodes.filter(node => !reachableNodes.has(node.id));
    if (unreachableNodes.length > 0) {
      result.warnings.push(
        `${unreachableNodes.length} node(s) are unreachable: ${unreachableNodes.map(n => n.id).join(', ')}`
      );
    }
  }
}

export const validateFlow = (
  nodes: Node[], 
  edges: ConditionalEdge[], 
  variables: ExtractedVariable[] = []
): FlowValidationResult => {
  const validator = new FlowValidator(nodes, edges, variables);
  return validator.validate();
};
