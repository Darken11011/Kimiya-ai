#!/usr/bin/env node

/**
 * Production WebSocket Connection Test
 * Tests if our production ConversationRelay WebSocket server is accessible from external clients
 */

const WebSocket = require('ws');

const PRODUCTION_WS_URL = 'wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?workflowId=test&trackingId=test123&CallSid=test_call';
const LOCAL_WS_URL = 'ws://localhost:3000/api/conversationrelay-ws?workflowId=test&trackingId=test123&CallSid=test_call';

console.log('🧪 Testing Production WebSocket Connection');
console.log('==========================================');

async function testWebSocketConnection(url, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔗 Testing ${name}...`);
    console.log(`URL: ${url}`);
    
    const ws = new WebSocket(url, {
      // Add headers that Twilio might send
      headers: {
        'User-Agent': 'TwilioProxy/1.1',
        'X-Twilio-Signature': 'test-signature'
      }
    });

    let connected = false;

    ws.on('open', () => {
      connected = true;
      console.log(`✅ ${name}: Connection established!`);
      
      // Send a Twilio-like start message
      const startMessage = {
        event: 'start',
        streamSid: 'MZ1234567890abcdef1234567890abcdef',
        callSid: 'CA1234567890abcdef1234567890abcdef',
        tracks: ['inbound', 'outbound'],
        mediaFormat: {
          encoding: 'audio/x-mulaw',
          sampleRate: 8000,
          channels: 1
        }
      };
      
      ws.send(JSON.stringify(startMessage));
      console.log(`📤 ${name}: Sent Twilio start message`);
      
      // Close after receiving response or timeout
      setTimeout(() => {
        ws.close();
        resolve({ success: true, name });
      }, 3000);
    });

    ws.on('message', (data) => {
      console.log(`📥 ${name}: Received response:`, data.toString());
    });

    ws.on('error', (error) => {
      console.error(`❌ ${name}: Connection error:`, error.message);
      if (!connected) {
        resolve({ success: false, name, error: error.message });
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 ${name}: Connection closed: ${code} - ${reason || 'No reason'}`);
      if (!connected) {
        resolve({ success: false, name, error: `Connection closed: ${code}` });
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!connected) {
        ws.terminate();
        resolve({ success: false, name, error: 'Connection timeout' });
      }
    }, 10000);
  });
}

async function runTests() {
  const tests = [
    [LOCAL_WS_URL, 'Local WebSocket'],
    [PRODUCTION_WS_URL, 'Production WebSocket']
  ];
  
  const results = [];
  
  for (const [url, name] of tests) {
    try {
      const result = await testWebSocketConnection(url, name);
      results.push(result);
    } catch (error) {
      results.push({ success: false, name, error: error.message });
    }
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  
  let allPassed = true;
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}: PASSED`);
    } else {
      console.log(`❌ ${result.name}: FAILED - ${result.error}`);
      allPassed = false;
    }
  }
  
  console.log('\n🔍 DIAGNOSIS');
  console.log('=============');
  
  if (allPassed) {
    console.log('🎉 All tests passed! WebSocket servers are working correctly.');
    console.log('🤔 If Twilio still can\'t connect, the issue might be:');
    console.log('   • Twilio firewall/network restrictions');
    console.log('   • Specific Twilio ConversationRelay protocol requirements');
    console.log('   • SSL/TLS certificate issues on production');
  } else {
    const localPassed = results.find(r => r.name === 'Local WebSocket')?.success;
    const prodPassed = results.find(r => r.name === 'Production WebSocket')?.success;
    
    if (localPassed && !prodPassed) {
      console.log('🚨 PRODUCTION ISSUE DETECTED!');
      console.log('   • Local WebSocket works fine');
      console.log('   • Production WebSocket is not accessible');
      console.log('   • This explains why Twilio can\'t connect');
      console.log('   • Check Render deployment and SSL configuration');
    } else if (!localPassed) {
      console.log('🚨 LOCAL ISSUE DETECTED!');
      console.log('   • Local WebSocket server has problems');
      console.log('   • Fix local issues before deploying to production');
    }
  }
  
  console.log('\n🚀 NEXT STEPS');
  console.log('==============');
  if (!allPassed) {
    console.log('1. Fix the failing WebSocket connections');
    console.log('2. Ensure Render deployment is working correctly');
    console.log('3. Verify SSL/TLS certificates are valid');
    console.log('4. Test again with a real Twilio call');
  } else {
    console.log('1. Deploy the enhanced WebSocket server to production');
    console.log('2. Test with a real Twilio call');
    console.log('3. Monitor logs for Twilio connection attempts');
  }
}

runTests().catch(console.error);
