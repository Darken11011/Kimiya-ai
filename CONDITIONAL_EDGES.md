# Conditional Edges in Flow Builder

This document explains how to use the new conditional edge system in the Flow Builder, similar to Vapi's workflow builder design.

## Overview

Conditional edges allow you to create dynamic conversation flows where the path between nodes depends on specific conditions. This enables sophisticated branching logic based on user responses, extracted variables, or AI-based decisions.

## Types of Conditions

### 1. No Condition (Default Path)
- **Use case**: Fallback path when no other conditions match
- **Configuration**: Simply mark the edge as "Default path"
- **Example**: Always route to end call node if no other conditions are met

### 2. AI-Based Conditions
- **Use case**: Natural language conditions evaluated by AI
- **Configuration**: Write conditions in plain English
- **Examples**:
  - "User wanted to talk about voice agents"
  - "User expressed frustration or anger"
  - "User asked about pricing or costs"
  - "User requested to speak to a human"

### 3. Logical Conditions
- **Use case**: Precise control using extracted variables
- **Configuration**: Define variable comparisons with operators
- **Operators**: equals, not equals, greater than, less than, contains, etc.
- **Examples**:
  - `customer_tier == "VIP"`
  - `total_orders > 50`
  - `user_language == "Spanish"`
  - `appointment_time contains "morning"`

### 4. Combined Conditions
- **Use case**: Mix logical operators with variables for complex logic
- **Configuration**: Write expressions using variable names
- **Examples**:
  - `customer_tier == "VIP" or total_orders > 50`
  - `user_age >= 18 and user_location == "California"`
  - `appointment_type == "urgent" and available_slots > 0`

## How to Add Conditions to Edges

1. **Create a connection** between two nodes in the flow builder
2. **Click on the edge** - you'll see either:
   - "Add Condition" button (for new edges)
   - A condition badge (for existing conditional edges)
3. **Configure the condition** in the modal that opens:
   - Choose condition type
   - Set up the specific condition parameters
   - Add an optional description
   - Mark as default path if needed
4. **Test the condition** using the Preview & Test tab
5. **Save** the condition

## Variable Extraction

To use logical conditions, you need to extract variables from conversation nodes:

1. **In a conversation node**, look for the "Extract Variables" section
2. **Add variables** that you want to capture from user responses
3. **Configure each variable**:
   - Name (e.g., "customer_tier", "user_age")
   - Type (String, Number, Integer, Boolean)
   - Description of what it captures
   - Predefined values (for String types)

## Best Practices

### Condition Design
- **Use descriptive names** for variables (e.g., "customer_tier" not "ct")
- **Keep AI conditions specific** - "User asked about pricing" vs "User mentioned money"
- **Format AI conditions** as "User [verb] [rest of condition]"
- **Test all paths** to ensure complete coverage

### Flow Structure
- **Always have a default path** when using multiple conditions from one node
- **Avoid circular logic** that could create infinite loops
- **Use meaningful descriptions** for complex conditions
- **Group related conditions** logically

### Variable Management
- **Extract variables early** in the conversation flow
- **Use enum values** for String variables when possible (enables reliable branching)
- **Keep variable names consistent** across the workflow
- **Document what each variable represents**

## Example Workflow

Here's a simple customer service workflow using conditional edges:

```
Start Call
    ↓
Greeting Node (extracts: customer_tier, issue_type)
    ↓
    ├─ [customer_tier == "VIP"] → VIP Support Node
    ├─ [issue_type == "billing"] → Billing Node
    ├─ [issue_type == "technical"] → Technical Support Node
    └─ [Default] → General Support Node
```

## Validation

The flow builder includes validation for conditional logic:

- **Missing variables**: Warns if conditions reference undefined variables
- **Type mismatches**: Checks operator compatibility with variable types
- **Unreachable nodes**: Identifies nodes that can't be reached
- **Missing default paths**: Warns when conditional branches lack fallbacks

## Testing Conditions

Use the Preview & Test tab in the condition modal to:

1. **Set test values** for variables used in the condition
2. **Run the evaluation** to see if the condition would be met
3. **View step-by-step** evaluation process
4. **Verify logic** before deploying the workflow

## Troubleshooting

### Common Issues

1. **"Variable not found" errors**
   - Ensure the variable is extracted in a previous node
   - Check variable name spelling

2. **Conditions never trigger**
   - Verify variable extraction is working
   - Test with the preview system
   - Check for type mismatches

3. **Infinite loops**
   - Review flow structure for circular paths
   - Add proper end conditions

4. **Missing paths**
   - Always include a default path for conditional branches
   - Test all possible variable values

### Debug Tips

- Use the flow validation feature to check for issues
- Test conditions with the preview system
- Check browser console for detailed validation results
- Start with simple conditions and build complexity gradually

## Integration with Vapi

This conditional edge system is designed to be compatible with Vapi's workflow patterns:

- **AI-based conditions** work similarly to Vapi's natural language conditions
- **Variable extraction** follows Vapi's variable management approach
- **Logical conditions** use similar operators and syntax
- **Combined conditions** support both liquid syntax and plain expressions

The system provides a familiar experience for users coming from Vapi while adding additional flexibility and testing capabilities.
