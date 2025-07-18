# Call Termination Intent Detection

## Overview

The Call Flow Weaver now includes **automatic termination intent detection** that recognizes when users want to end a call naturally, even if the workflow hasn't reached an explicit end node.

## Problem Solved

Previously, calls would continue indefinitely unless:
1. The workflow reached an explicit "End Call" node
2. The workflow ran out of nodes to process  
3. A user manually clicked "End Call" in the UI

**The Issue**: When users said natural goodbye phrases like "bye", "goodbye", "I'll call back later", "thanks, that's all I need", etc., the AI would continue the conversation instead of recognizing the termination intent.

## Solution

### 1. Keyword Detection
The system now detects common termination phrases:
- `bye`, `goodbye`, `good bye`
- `see you`, `talk later`, `call later`, `call back`
- `that's all`, `thanks bye`, `thank you bye`
- `gotta go`, `have to go`, `need to go`
- `end call`, `hang up`, `disconnect`
- `that's it`, `i'm done`, `we're done`, `all set`
- `thank you that's all`

### 2. AI-Based Intent Detection
For more subtle termination intents, the system uses Azure OpenAI to evaluate if the user wants to end the call, even if they don't use explicit keywords.

### 3. Smart End Node Routing
When termination intent is detected:
1. **First**: Try to find an existing "End Call" node in the workflow and use its message
2. **Fallback**: Use a generic polite goodbye message if no end node exists

## Implementation Details

### Backend (TwiML AI Handler)
```javascript
// Function detects termination intent before processing normal conversation
const detectTerminationIntent = async (userMessage) => {
  // 1. Quick keyword detection
  // 2. AI evaluation for subtle intents
  // 3. Returns true/false
}

// Integration in conversation flow
if (wantsToEndCall) {
  // Try to use workflow's end node message
  const endNode = workflowData?.nodes?.find(node => isEndNode(node));
  if (endNode) {
    return generateEndCallTwiML(endNode);
  } else {
    return genericGoodbyeTwiML;
  }
}
```

### Frontend (Playground Modal)
```typescript
// Detects termination intent in chat mode
const detectTerminationIntent = (message: string): boolean => {
  // Keyword matching for chat interface
}

// Automatically ends active calls when termination intent detected
if (detectTerminationIntent(messageContent)) {
  // Show goodbye message
  // End active call if in progress
}
```

## Usage Examples

### User Says: "Thanks, bye!"
**Before**: AI responds with "You're welcome! Is there anything else I can help you with?"
**After**: AI responds with end node message and hangs up the call

### User Says: "I'll call back later"
**Before**: AI continues conversation
**After**: AI recognizes intent and ends call politely

### User Says: "That's all I needed, thank you"
**Before**: AI asks follow-up questions
**After**: AI ends call with appropriate goodbye

## Configuration

### Workflow Templates
Both the Real Estate and AI Specialist Teacher templates include proper end nodes that will be used when termination intent is detected.

### Logging
The system includes detailed logging for debugging:
- `✅ Termination keyword detected in: "user message"`
- `🔍 No termination keywords found in: "user message"`
- `AI termination intent detection for "message": true/false`

## Benefits

1. **Natural Conversation Flow**: Users can end calls naturally without needing to navigate through the entire workflow
2. **Better User Experience**: No more frustrating loops when users clearly want to end the call
3. **Workflow Flexibility**: Works with any workflow design, using end nodes when available
4. **Fallback Safety**: Always provides a polite goodbye even if no end node exists
5. **Dual Detection**: Combines fast keyword matching with intelligent AI evaluation

## Testing

To test the feature:
1. Create a workflow with conversation nodes
2. Start a call or chat session
3. Say any termination phrase like "bye", "thanks, that's all", or "I'll call back later"
4. Observe that the system ends the call/conversation appropriately

## Future Enhancements

- Add configurable termination keywords per workflow
- Support for multiple languages
- Analytics on termination patterns
- Custom goodbye messages per workflow type
