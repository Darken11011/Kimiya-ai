#!/usr/bin/env node

/**
 * Render Deployment Test for ConversationRelay
 * Tests the production Render deployment to identify WebSocket connection issues
 */

const WebSocket = require('ws');

const RENDER_BASE_URL = 'https://kimiyi-ai.onrender.com';
const RENDER_WS_URL = 'wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?workflowId=debug&trackingId=render-test&CallSid=debug_call';

console.log('🔍 RENDER DEPLOYMENT DEBUGGING');
console.log('===============================');
console.log(`Production URL: ${RENDER_BASE_URL}`);
console.log(`WebSocket URL: ${RENDER_WS_URL}`);

async function testRenderHealth() {
  console.log('\n📊 Step 1: Testing Render Health Endpoint');
  console.log('==========================================');
  
  try {
    const response = await fetch(`${RENDER_BASE_URL}/health`);
    const healthData = await response.json();
    
    console.log('✅ Health endpoint response:');
    console.log(`   Status: ${healthData.status}`);
    console.log(`   Service: ${healthData.service}`);
    console.log(`   Uptime: ${Math.round(healthData.uptime)}s`);
    
    if (healthData.conversationRelay) {
      console.log('\n🎙️  ConversationRelay Status:');
      console.log(`   Status: ${healthData.conversationRelay.status}`);
      console.log(`   Active Connections: ${healthData.conversationRelay.activeConnections}`);
      console.log(`   WebSocket Path: ${healthData.conversationRelay.websocketPath}`);
      console.log(`   Expected URL: ${healthData.conversationRelay.expectedUrl}`);
      
      if (healthData.conversationRelay.status !== 'active') {
        console.log('❌ CRITICAL: ConversationRelay WebSocket server is not active!');
        return false;
      }
    } else {
      console.log('❌ CRITICAL: No ConversationRelay status in health response!');
      return false;
    }
    
    if (healthData.warnings && healthData.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      healthData.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
    return false;
  }
}

async function testRenderWebSocket() {
  console.log('\n🔌 Step 2: Testing Render WebSocket Connection');
  console.log('===============================================');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(RENDER_WS_URL);
    let connectionSuccessful = false;
    
    const timeout = setTimeout(() => {
      if (!connectionSuccessful) {
        console.log('❌ WebSocket connection timeout (10 seconds)');
        ws.close();
        resolve(false);
      }
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established!');
      connectionSuccessful = true;
      clearTimeout(timeout);
      
      // Send ConversationRelay setup message
      const setupMessage = {
        type: 'setup',
        callSid: 'CA_debug_render_test',
        accountSid: 'AC_debug_render_test',
        from: '+17077433838',
        to: '+919649770017',
        direction: 'outbound-api',
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending ConversationRelay SETUP message...');
      ws.send(JSON.stringify(setupMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received response from Render:', {
          type: message.type,
          text: message.text?.substring(0, 50) + (message.text?.length > 50 ? '...' : ''),
          voice: message.voice
        });
        
        console.log('✅ ConversationRelay protocol working on Render!');
        ws.close();
        resolve(true);
        
      } catch (error) {
        console.error('❌ Error parsing WebSocket response:', error.message);
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket connection closed: ${code} - ${reason || 'Connection ended'}`);
      if (!connectionSuccessful) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  });
}

async function testTwiMLEndpoint() {
  console.log('\n📋 Step 3: Testing TwiML Endpoint');
  console.log('==================================');
  
  try {
    const testParams = new URLSearchParams({
      id: 'debug-workflow',
      trackingId: 'render-debug-test',
      CallSid: 'CA_debug_twiml_test',
      From: '+17077433838',
      To: '+919649770017'
    });
    
    const response = await fetch(`${RENDER_BASE_URL}/api/twiml-optimized?${testParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const twimlResponse = await response.text();
    console.log('✅ TwiML endpoint response received');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    // Check if TwiML contains ConversationRelay configuration
    if (twimlResponse.includes('<ConversationRelay')) {
      console.log('✅ TwiML contains ConversationRelay configuration');
      
      // Extract WebSocket URL from TwiML
      const urlMatch = twimlResponse.match(/url="([^"]+)"/);
      if (urlMatch) {
        const extractedUrl = urlMatch[1].replace(/&amp;/g, '&');
        console.log(`   WebSocket URL in TwiML: ${extractedUrl}`);
        
        if (extractedUrl.includes('kimiyi-ai.onrender.com')) {
          console.log('✅ TwiML points to correct Render WebSocket URL');
          return true;
        } else {
          console.log('❌ TwiML WebSocket URL does not point to Render');
          return false;
        }
      } else {
        console.log('❌ Could not extract WebSocket URL from TwiML');
        return false;
      }
    } else {
      console.log('❌ TwiML does not contain ConversationRelay configuration');
      console.log('TwiML Response:', twimlResponse);
      return false;
    }
    
  } catch (error) {
    console.error('❌ TwiML endpoint test failed:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Render Deployment Diagnostics...\n');
  
  const healthOk = await testRenderHealth();
  const websocketOk = await testRenderWebSocket();
  const twimlOk = await testTwiMLEndpoint();
  
  console.log('\n📊 DIAGNOSTIC RESULTS');
  console.log('=====================');
  console.log(`Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Connection: ${websocketOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`TwiML Configuration: ${twimlOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthOk && websocketOk && twimlOk) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ Render deployment is working correctly');
    console.log('✅ ConversationRelay WebSocket server is active');
    console.log('✅ TwiML is configured properly');
    console.log('✅ WebSocket connection successful');
    console.log('\n🔍 NEXT STEPS:');
    console.log('- Check Twilio webhook logs for connection attempts');
    console.log('- Verify Twilio is actually calling the webhook URLs');
    console.log('- Check for any firewall or network issues');
    
  } else {
    console.log('\n❌ DEPLOYMENT ISSUES DETECTED!');
    console.log('===============================');
    
    if (!healthOk) {
      console.log('🔧 ISSUE: Health endpoint problems');
      console.log('   - ConversationRelay WebSocket server may not be initialized');
      console.log('   - Check Render deployment logs for startup errors');
    }
    
    if (!websocketOk) {
      console.log('🔧 ISSUE: WebSocket connection failed');
      console.log('   - ConversationRelay WebSocket server not responding');
      console.log('   - Check if latest code is deployed to Render');
      console.log('   - Verify WebSocket server initialization in logs');
    }
    
    if (!twimlOk) {
      console.log('🔧 ISSUE: TwiML configuration problems');
      console.log('   - TwiML may not contain ConversationRelay configuration');
      console.log('   - WebSocket URL may be incorrect');
      console.log('   - Check TwiML generation logic');
    }
    
    console.log('\n🚀 RECOMMENDED ACTIONS:');
    console.log('1. Check Render deployment logs');
    console.log('2. Verify latest code is deployed');
    console.log('3. Test WebSocket server locally first');
    console.log('4. Check environment variables on Render');
  }
  
  process.exit(healthOk && websocketOk && twimlOk ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic script failed:', error);
  process.exit(1);
});
