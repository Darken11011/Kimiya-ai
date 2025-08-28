#!/usr/bin/env node

/**
 * WebSocket Connection Test
 * Tests if our ConversationRelay WebSocket server is accessible
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/api/conversationrelay-ws?workflowId=test&trackingId=test123&CallSid=test_call';

console.log('🧪 Testing WebSocket Connection');
console.log('===============================');
console.log(`Connecting to: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connection established!');
  console.log('🎉 Our WebSocket server is working correctly');
  
  // Send a test message
  ws.send(JSON.stringify({
    event: 'connected',
    streamSid: 'test_stream',
    callSid: 'test_call'
  }));
  
  console.log('📤 Sent test message to server');
  
  // Close after a short delay
  setTimeout(() => {
    ws.close();
    console.log('🔌 Connection closed - test complete');
    process.exit(0);
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📥 Received message from server:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket connection error:', error.message);
  console.log('🔍 This indicates our WebSocket server has an issue');
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏰ Connection timeout - WebSocket server may not be responding');
  process.exit(1);
}, 10000);
