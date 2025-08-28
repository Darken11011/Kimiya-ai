# Flow Builder Tutorial

Learn how to create sophisticated voice agent workflows using Call Flow Weaver's visual flow builder.

## 🎯 Getting Started

### Accessing the Flow Builder

1. Navigate to the dashboard at `http://localhost:8080`
2. Click "Create New Workflow" or go to `/builder`
3. You'll see the visual flow canvas with a sidebar of available nodes

### Interface Overview

```
┌─────────────┐  ┌─────────────────────────────────┐
│   Sidebar   │  │         Canvas                  │
│             │  │                                 │
│ • Start     │  │  ┌─────┐    ┌─────┐            │
│ • AI Chat   │  │  │Start│───►│ AI  │            │
│ • API Call  │  │  └─────┘    └─────┘            │
│ • Transfer  │  │                                 │
│ • Tools     │  │                                 │
│ • End       │  │                                 │
└─────────────┘  └─────────────────────────────────┘
```

## 🧩 Node Types

### 1. Start Node
**Purpose**: Entry point for all voice calls

**Configuration:**
- **Label**: Display name for the node
- **Prompt**: Initial greeting message
- **Voice Settings**: Speed, pitch, voice selection

**Example:**
```
Label: "Welcome Call"
Prompt: "Hello! Welcome to our service. How can I help you today?"
```

### 2. Conversation Node (AI)
**Purpose**: AI-powered conversations with users

**Configuration:**
- **AI Model**: GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, etc.
- **System Prompt**: Instructions for the AI
- **Max Turns**: Conversation limit before moving on
- **Variables**: Extract information from conversation

**Example:**
```
Model: GPT-4o Mini
System Prompt: "You are a helpful customer service agent. Be friendly and concise."
Max Turns: 5
Variables: customer_name, issue_type
```

### 3. API Request Node
**Purpose**: Make external API calls during the conversation

**Configuration:**
- **URL**: API endpoint
- **Method**: GET, POST, PUT, DELETE
- **Headers**: Authentication and content type
- **Body**: Request payload
- **Response Mapping**: Extract data from response

**Example:**
```
URL: https://api.example.com/customer
Method: POST
Headers: {"Authorization": "Bearer token"}
Body: {"name": "{{customer_name}}"}
```

### 4. Transfer Call Node
**Purpose**: Transfer the call to another number

**Configuration:**
- **Transfer Number**: Destination phone number
- **Transfer Type**: Warm or cold transfer
- **Timeout**: Maximum wait time
- **Fallback**: Action if transfer fails

**Example:**
```
Transfer Number: +1234567890
Type: Warm Transfer
Timeout: 30 seconds
```

### 5. Tool Node
**Purpose**: Execute custom tools or functions

**Configuration:**
- **Tool Type**: Custom function or integration
- **Parameters**: Input parameters for the tool
- **Output Variables**: Store tool results
- **Error Handling**: What to do if tool fails

### 6. End Call Node
**Purpose**: Terminate the call gracefully

**Configuration:**
- **Goodbye Message**: Final message to user
- **Call Summary**: Log call details
- **Follow-up Actions**: Post-call processing

## 🔗 Connecting Nodes

### Basic Connections

1. **Click and Drag**: From output handle to input handle
2. **Connection Validation**: System prevents invalid connections
3. **Visual Feedback**: Connections show flow direction

### Connection Rules

- Start nodes can only connect outward
- End nodes can only receive connections
- Most nodes can have multiple outgoing connections
- Each node can have only one incoming connection

## 🧠 Conditional Logic

### Adding Conditions to Edges

1. **Right-click** on any edge
2. Select "Add Condition"
3. Choose condition type:
   - **AI-based**: Natural language conditions
   - **Logical**: Variable comparisons
   - **Combined**: Mix of both

### Condition Types

#### AI-based Conditions
```
Condition: "User wants to speak to a manager"
Description: "Route to manager if user requests escalation"
```

#### Logical Conditions
```
Variable: customer_type
Operator: equals
Value: "premium"
```

#### Combined Conditions
```
AI Condition: "User is frustrated" AND
Logical: priority_level > 3
```

## 📊 Variable Management

### Extracting Variables

1. **In Conversation Nodes**: Configure variable extraction
2. **Variable Name**: Unique identifier
3. **Description**: What the variable represents
4. **Type**: String, number, boolean, array

**Example:**
```
Variable: customer_email
Description: "Customer's email address"
Type: string
Extraction: "Extract the email address from the conversation"
```

### Using Variables

Variables can be used throughout the workflow:

- **In Prompts**: `"Hello {{customer_name}}, how can I help?"`
- **In API Calls**: `{"email": "{{customer_email}}"}`
- **In Conditions**: `customer_type equals "premium"`

## 🎨 Best Practices

### 1. Flow Design

- **Start Simple**: Begin with basic flows, add complexity gradually
- **Clear Naming**: Use descriptive labels for all nodes
- **Logical Flow**: Ensure conversation flows naturally
- **Error Handling**: Always include fallback paths

### 2. Conversation Design

- **Concise Prompts**: Keep AI instructions clear and brief
- **Natural Language**: Write prompts that sound conversational
- **Context Awareness**: Use variables to maintain context
- **Turn Limits**: Set reasonable conversation limits

### 3. Performance Optimization

- **Minimize API Calls**: Batch requests when possible
- **Cache Responses**: Use variables to store repeated data
- **Parallel Processing**: Design for concurrent operations
- **Timeout Handling**: Set appropriate timeouts

## 🔧 Advanced Features

### Global Prompt

Set a global prompt that applies to all AI nodes:

1. Click the "Global Prompt" button
2. Enter system-wide instructions
3. This prompt is prepended to all AI conversations

**Example:**
```
"You are representing XYZ Company. Always be professional, 
helpful, and follow company policies. Keep responses under 
50 words unless more detail is specifically requested."
```

### Workflow Configuration

Configure workflow-wide settings:

- **Twilio Settings**: Phone numbers, recording options
- **AI Settings**: Default models, temperature settings
- **Performance**: Optimization preferences
- **Logging**: Call recording and analytics

### Variable Extraction

Advanced variable extraction features:

- **Pattern Matching**: Extract using regex patterns
- **Entity Recognition**: Identify names, dates, numbers
- **Sentiment Analysis**: Detect user emotions
- **Intent Classification**: Understand user goals

## 🧪 Testing Your Flow

### Using the Playground

1. **Click Playground** in the top-right corner
2. **Choose Mode**:
   - **Chat Mode**: Text-based testing
   - **Call Mode**: Real voice calls

### Chat Mode Testing

- Test conversation flows without making calls
- See how AI responds to different inputs
- Verify variable extraction works correctly
- Check conditional logic paths

### Call Mode Testing

- Make real test calls through Twilio
- Experience the full voice interaction
- Test audio quality and response times
- Verify call flow follows your design

## 📝 Workflow Management

### Saving Workflows

- **Auto-save**: Changes are saved automatically
- **Manual Save**: Use Ctrl+S or the save button
- **Version Control**: Each save creates a new version

### Exporting/Importing

- **Export**: Download workflow as JSON
- **Import**: Upload previously exported workflows
- **Templates**: Save workflows as reusable templates

### Sharing Workflows

- **Export Link**: Generate shareable links
- **Team Collaboration**: Share with team members
- **Version History**: Track changes over time

## 🎯 Example Workflows

### Simple Customer Service

```
Start → AI Conversation → Transfer/End
```

1. **Start**: "Hello, welcome to customer service"
2. **AI**: Understand customer issue
3. **Decision**: Transfer to agent or resolve directly

### Lead Qualification

```
Start → AI Conversation → API Call → Conditional → End
```

1. **Start**: "Thanks for your interest in our product"
2. **AI**: Qualify lead with questions
3. **API**: Save lead information
4. **Conditional**: Route based on qualification score

### Appointment Booking

```
Start → AI → API (Check Availability) → AI (Confirm) → End
```

1. **Start**: "Let's schedule your appointment"
2. **AI**: Collect preferred date/time
3. **API**: Check calendar availability
4. **AI**: Confirm booking details
5. **End**: "Your appointment is confirmed"

This comprehensive guide covers everything you need to build sophisticated voice agent workflows with Call Flow Weaver!
