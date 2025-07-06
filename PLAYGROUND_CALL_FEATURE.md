# Playground Call Feature

The playground now includes a **Call** option alongside the existing **Chat** functionality, allowing you to test your workflows by making actual phone calls using Twilio.

## Features

### 🔄 Dual Mode Interface
- **Chat Tab**: Test workflows through text-based conversation simulation
- **Call Tab**: Make real phone calls to test voice workflows

### 📞 Call Functionality
- Enter phone numbers in any format (e.g., +1234567890, 1234567890, (123) 456-7890)
- Automatic phone number normalization to E.164 format
- Initiate calls using configured Twilio credentials
- Monitor call status and receive real-time updates
- End calls manually or automatically when workflow completes

### 🔧 Twilio Integration
- Uses workflow-specific Twilio configuration when available
- Falls back to default Twilio credentials:
  - **Account SID**: `AC64208c7087a03b475ea7fa9337b692f8`
  - **Auth Token**: `587e27a4553570edb09656c15a03d0e8`
  - **Phone Number**: `+17077433838`

## How to Use

### 1. Access the Playground
1. Create or open a workflow with nodes
2. Click the **Playground** button in the top-right corner of the flow canvas
3. The playground modal will open with Chat and Call tabs

### 2. Making a Call
1. Switch to the **Call** tab
2. Enter the destination phone number in any format (automatically normalized)
3. Click the **Call** button to initiate the call
4. Monitor the call status in the interface
5. Click **End Call** to terminate the call manually

### 3. Call Status Monitoring
- Real-time call status updates
- Call ID tracking for debugging
- System messages showing call events
- Integration with existing workflow message system

## Technical Details

### Twilio Service
The implementation uses a dedicated `TwilioService` class that:
- Handles Twilio REST API calls
- Validates phone number formats
- Manages call lifecycle (initiate, monitor, terminate)
- Provides error handling and user feedback

### Configuration Priority
1. **Workflow Configuration**: Uses Twilio settings from the current workflow if configured
2. **Default Configuration**: Falls back to hardcoded Twilio credentials for demo purposes

### TwiML Handling
- Currently uses Twilio's demo TwiML endpoint for basic call handling
- In production, you should implement your own TwiML endpoint that:
  - Handles the conversation flow based on your workflow nodes
  - Integrates with AI services for dynamic responses
  - Manages call routing and conditional logic

## Important Notes

### ⚠️ Important: Demo Mode vs Production

#### 🖥️ **Current Implementation (Demo Mode)**
- **Browser Limitation**: Due to CORS (Cross-Origin Resource Sharing) restrictions, browsers cannot make direct API calls to Twilio
- **Simulated Calls**: The current implementation simulates calls for demonstration purposes
- **No Real Calls**: No actual phone calls are made in the browser environment
- **Testing Interface**: Provides a complete UI experience for testing workflow design

#### 🚀 **Production Implementation Requirements**
- **Backend Server**: You need a backend server (Node.js, Python, etc.) to make real Twilio API calls
- **API Proxy**: Create API endpoints on your server that proxy requests to Twilio
- **TwiML Endpoint**: Set up a server to generate dynamic TwiML based on your workflow
- **Security**: Properly secure Twilio credentials on the server side
- **Cost**: Be aware that making actual phone calls will incur Twilio charges

#### 🔧 **Implementation Architecture**
```
Browser → Your Backend Server → Twilio API → Phone Call
```

Instead of:
```
Browser → Twilio API (❌ Blocked by CORS)
```

### 🔒 Phone Number Handling
- Accepts phone numbers in multiple formats:
  - E.164 format: `+1234567890`
  - US format: `1234567890` or `11234567890`
  - Formatted: `(123) 456-7890`, `123-456-7890`
  - International: Any valid international number
- Automatically normalizes numbers to E.164 format for Twilio
- Validates format before attempting calls
- Provides clear error messages for invalid numbers

**Examples of supported formats:**
- `+1234567890` → `+1234567890` (E.164, no change)
- `1234567890` → `+11234567890` (US number)
- `(123) 456-7890` → `+11234567890` (formatted US)
- `123-456-7890` → `+11234567890` (dashed US)
- `123.456.7890` → `+11234567890` (dotted US)
- `+44 20 7946 0958` → `+442079460958` (UK number)

### 🎯 Integration with Workflow
- Call events are logged in the same message system as chat
- Call status updates appear as system messages
- Maintains consistency with existing playground behavior

## Future Enhancements

### Planned Features
- **Dynamic TwiML Generation**: Generate TwiML based on workflow nodes
- **Real-time Audio**: Stream audio for live conversation monitoring
- **Call Recording Playback**: Play back recorded calls within the interface
- **Advanced Call Controls**: Hold, transfer, conference capabilities
- **Webhook Integration**: Real-time call event handling

### Workflow Integration
- **Node-based Call Flow**: Execute workflow nodes during live calls
- **AI Integration**: Real-time AI responses during calls
- **Conditional Routing**: Dynamic call routing based on user responses
- **Variable Extraction**: Capture and use call data in workflow logic

## Troubleshooting

### Common Issues
1. **Invalid Phone Number**: Ensure the number contains valid digits and is a real phone number
2. **Call Failed**: Check Twilio credentials and account balance
3. **No Response**: Verify TwiML endpoint is accessible and returns valid TwiML
4. **Permission Denied**: Ensure Twilio account has calling permissions for the destination

### Error Messages
- Clear, user-friendly error messages for all failure scenarios
- Toast notifications for success and error states
- Detailed logging for debugging purposes

## API Reference

### TwilioService Methods
- `makeCall(options)`: Initiate a phone call
- `getCallStatus(callSid)`: Get current call status
- `hangupCall(callSid)`: Terminate an active call

### Configuration Types
- `TwilioConfig`: Twilio account configuration
- `CallOptions`: Call-specific options and settings
- `CallResponse`: API response structure

## Production Implementation Guide

### Backend Server Setup

To make real calls in production, you'll need to create a backend server. Here's a basic example:

#### Node.js/Express Example
```javascript
const express = require('express');
const twilio = require('twilio');
const app = express();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/api/make-call', async (req, res) => {
  try {
    const { to, from, twimlUrl } = req.body;

    const call = await client.calls.create({
      to: to,
      from: from,
      url: twimlUrl
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000);
```

#### Frontend Integration
Update the TwilioService to call your backend instead of Twilio directly:

```typescript
// Replace the makeRealCall method with:
private async makeRealCall(normalizedNumber: string, options: CallOptions): Promise<CallResponse> {
  const response = await fetch('/api/make-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: normalizedNumber,
      from: options.from,
      twimlUrl: options.url
    })
  });

  return await response.json();
}
```

This feature provides a comprehensive testing environment for voice workflows, bridging the gap between design and real-world implementation.
