import { ComponentDefinition, ComponentRegistry, ValidationResult } from '../types/componentTypes';

class ComponentRegistryImpl implements ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();
  private categories = new Map<string, ComponentDefinition[]>();

  register(definition: ComponentDefinition): void {
    // Validate the component definition
    if (!definition.type || !definition.displayName || !definition.component) {
      throw new Error('Invalid component definition: missing required fields');
    }

    // Register the component
    this.components.set(definition.type, definition);

    // Update category index
    if (!this.categories.has(definition.category)) {
      this.categories.set(definition.category, []);
    }
    
    const categoryComponents = this.categories.get(definition.category)!;
    const existingIndex = categoryComponents.findIndex(c => c.type === definition.type);
    
    if (existingIndex >= 0) {
      categoryComponents[existingIndex] = definition;
    } else {
      categoryComponents.push(definition);
    }

    console.log(`Registered component: ${definition.type} in category: ${definition.category}`);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByCategory(category: string): ComponentDefinition[] {
    return this.categories.get(category) || [];
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  search(query: string): ComponentDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAll().filter(component => 
      component.displayName.toLowerCase().includes(lowercaseQuery) ||
      component.description.toLowerCase().includes(lowercaseQuery) ||
      component.type.toLowerCase().includes(lowercaseQuery) ||
      (component.tags && component.tags.some(tag => 
        tag.toLowerCase().includes(lowercaseQuery)
      ))
    );
  }

  validate(nodeData: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!nodeData.component) {
      result.isValid = false;
      result.errors.push('Node is missing component definition');
      return result;
    }

    const componentDef = this.get(nodeData.component.type);
    if (!componentDef) {
      result.isValid = false;
      result.errors.push(`Unknown component type: ${nodeData.component.type}`);
      return result;
    }

    // Validate required inputs
    for (const input of componentDef.inputs) {
      if (input.required && (nodeData[input.name] === undefined || nodeData[input.name] === '')) {
        result.isValid = false;
        result.errors.push(`Required field '${input.label}' is missing`);
      }

      // Validate input types and constraints
      if (nodeData[input.name] !== undefined) {
        const value = nodeData[input.name];
        
        switch (input.type) {
          case 'number':
            if (isNaN(Number(value))) {
              result.errors.push(`Field '${input.label}' must be a number`);
              result.isValid = false;
            } else {
              const numValue = Number(value);
              if (input.validation?.min !== undefined && numValue < input.validation.min) {
                result.errors.push(`Field '${input.label}' must be at least ${input.validation.min}`);
                result.isValid = false;
              }
              if (input.validation?.max !== undefined && numValue > input.validation.max) {
                result.errors.push(`Field '${input.label}' must be at most ${input.validation.max}`);
                result.isValid = false;
              }
            }
            break;
            
          case 'text':
          case 'textarea':
          case 'password':
            if (typeof value !== 'string') {
              result.errors.push(`Field '${input.label}' must be a string`);
              result.isValid = false;
            } else {
              if (input.validation?.pattern) {
                const regex = new RegExp(input.validation.pattern);
                if (!regex.test(value)) {
                  result.errors.push(
                    input.validation.message || 
                    `Field '${input.label}' does not match required pattern`
                  );
                  result.isValid = false;
                }
              }
            }
            break;
            
          case 'boolean':
            if (typeof value !== 'boolean') {
              result.errors.push(`Field '${input.label}' must be a boolean`);
              result.isValid = false;
            }
            break;
            
          case 'select':
            if (input.options && !input.options.some(option => option.value === value)) {
              result.errors.push(`Field '${input.label}' has invalid selection`);
              result.isValid = false;
            }
            break;
        }
      }
    }

    return result;
  }

  // Utility methods
  getComponentsByTags(tags: string[]): ComponentDefinition[] {
    return this.getAll().filter(component =>
      component.tags && tags.some(tag => component.tags!.includes(tag))
    );
  }

  exportRegistry(): any {
    return {
      components: Array.from(this.components.entries()),
      categories: Array.from(this.categories.entries())
    };
  }

  importRegistry(data: any): void {
    if (data.components) {
      for (const [type, definition] of data.components) {
        this.register(definition);
      }
    }
  }

  clear(): void {
    this.components.clear();
    this.categories.clear();
  }
}

// Create singleton instance
export const componentRegistry = new ComponentRegistryImpl();

// Export the registry instance as default
export default componentRegistry;
