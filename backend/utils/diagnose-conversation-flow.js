#!/usr/bin/env node

/**
 * Conversation Flow Diagnostic Tool
 * Tests the complete conversation flow to identify where the silence issue occurs
 */

const WebSocket = require('ws');

const RENDER_WS_URL = 'wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?workflowId=diagnostic&trackingId=flow-test&CallSid=diagnostic_call';

console.log('🔍 CONVERSATION FLOW DIAGNOSTIC');
console.log('===============================');
console.log('Testing complete conversation flow to identify silence issue...\n');

async function testConversationFlow() {
  return new Promise((resolve) => {
    const ws = new WebSocket(RENDER_WS_URL);
    const testResults = {
      connection: false,
      setupReceived: false,
      greetingSent: false,
      promptSent: false,
      responseReceived: false,
      errors: []
    };
    
    let testStep = 0;
    const testTimeout = setTimeout(() => {
      console.log('❌ Test timeout - conversation flow incomplete');
      ws.close();
      resolve(testResults);
    }, 30000);
    
    ws.on('open', () => {
      console.log('✅ Step 1: WebSocket connection established');
      testResults.connection = true;
      
      // Send ConversationRelay setup message (simulating Twilio)
      setTimeout(() => {
        console.log('📤 Step 2: Sending ConversationRelay SETUP message...');
        
        const setupMessage = {
          type: 'setup',
          callSid: 'CA_diagnostic_test_' + Date.now(),
          accountSid: 'AC_diagnostic_test',
          from: '+17077433838',
          to: '+919649770017',
          direction: 'outbound-api',
          timestamp: new Date().toISOString(),
          voice: {
            name: 'alice',
            language: 'en-US'
          }
        };
        
        ws.send(JSON.stringify(setupMessage));
        testStep = 1;
      }, 1000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📥 Received message:`, {
          type: message.type,
          text: message.text?.substring(0, 100) + (message.text?.length > 100 ? '...' : ''),
          voice: message.voice
        });
        
        if (testStep === 1 && message.type === 'text') {
          console.log('✅ Step 3: Greeting received from server');
          testResults.setupReceived = true;
          testResults.greetingSent = true;
          
          // Send user speech prompt (simulating user speaking)
          setTimeout(() => {
            console.log('📤 Step 4: Sending user PROMPT message (simulating speech)...');
            
            const promptMessage = {
              type: 'prompt',
              voicePrompt: 'Hello, I need help with my account balance',
              confidence: 0.95,
              timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(promptMessage));
            testResults.promptSent = true;
            testStep = 2;
          }, 2000);
        }
        
        else if (testStep === 2 && message.type === 'text') {
          console.log('✅ Step 5: AI response received!');
          testResults.responseReceived = true;
          
          console.log('\n🎉 CONVERSATION FLOW TEST COMPLETED SUCCESSFULLY!');
          console.log('===============================================');
          console.log('✅ WebSocket connection: WORKING');
          console.log('✅ ConversationRelay setup: WORKING');
          console.log('✅ Greeting generation: WORKING');
          console.log('✅ User prompt handling: WORKING');
          console.log('✅ AI response generation: WORKING');
          
          console.log('\n🔍 DIAGNOSIS: Conversation flow is working correctly!');
          console.log('🤔 If calls are still silent, the issue might be:');
          console.log('   1. Twilio ConversationRelay TTS not working');
          console.log('   2. Audio/voice configuration issues');
          console.log('   3. Twilio account or phone number settings');
          console.log('   4. Network/connectivity issues during real calls');
          
          clearTimeout(testTimeout);
          ws.close();
          resolve(testResults);
        }
        
      } catch (error) {
        console.error('❌ Error parsing message:', error.message);
        testResults.errors.push(`Message parsing error: ${error.message}`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      testResults.errors.push(`WebSocket error: ${error.message}`);
      clearTimeout(testTimeout);
      resolve(testResults);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason || 'Test completed'}`);
      clearTimeout(testTimeout);
      
      if (!testResults.responseReceived) {
        console.log('\n❌ CONVERSATION FLOW TEST FAILED!');
        console.log('=====================================');
        console.log(`Connection: ${testResults.connection ? '✅' : '❌'}`);
        console.log(`Setup handling: ${testResults.setupReceived ? '✅' : '❌'}`);
        console.log(`Greeting sent: ${testResults.greetingSent ? '✅' : '❌'}`);
        console.log(`Prompt sent: ${testResults.promptSent ? '✅' : '❌'}`);
        console.log(`Response received: ${testResults.responseReceived ? '✅' : '❌'}`);
        
        if (testResults.errors.length > 0) {
          console.log('\n🔍 ERRORS DETECTED:');
          testResults.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log('\n🔧 LIKELY ISSUES:');
        if (!testResults.setupReceived) {
          console.log('   - ConversationRelay setup message not handled correctly');
          console.log('   - Check handleSetup() method in conversationrelay-websocket.js');
        }
        if (!testResults.greetingSent) {
          console.log('   - Initial greeting not generated or sent');
          console.log('   - Check sendTextMessage() method');
        }
        if (testResults.promptSent && !testResults.responseReceived) {
          console.log('   - User prompt not processed or AI response failed');
          console.log('   - Check handlePrompt() method and Azure OpenAI integration');
          console.log('   - Verify Azure OpenAI API key and endpoint configuration');
        }
      }
      
      resolve(testResults);
    });
  });
}

async function testAzureOpenAIConnection() {
  console.log('\n🧪 Testing Azure OpenAI Connection...');
  console.log('====================================');
  
  try {
    // Test Azure OpenAI endpoint directly
    const testResponse = await fetch('https://kimiyi-ai.onrender.com/health');
    const healthData = await testResponse.json();
    
    console.log(`Azure OpenAI Endpoint: ${healthData.environment?.hasAzureEndpoint ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Azure OpenAI API Key: ${healthData.environment?.hasAzureKey ? '✅ Configured' : '❌ Missing'}`);
    
    if (!healthData.environment?.hasAzureEndpoint || !healthData.environment?.hasAzureKey) {
      console.log('\n❌ CRITICAL: Azure OpenAI configuration missing!');
      console.log('🔧 This could cause AI response generation to fail');
      console.log('📝 Check environment variables on Render:');
      console.log('   - AZURE_OPENAI_ENDPOINT');
      console.log('   - AZURE_OPENAI_API_KEY');
      return false;
    }
    
    console.log('✅ Azure OpenAI configuration appears correct');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to check Azure OpenAI configuration:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting conversation flow diagnostics...\n');
  
  // Test Azure OpenAI configuration first
  const azureOk = await testAzureOpenAIConnection();
  
  // Test complete conversation flow
  const flowResults = await testConversationFlow();
  
  console.log('\n📊 FINAL DIAGNOSTIC SUMMARY');
  console.log('============================');
  console.log(`Azure OpenAI Config: ${azureOk ? '✅ OK' : '❌ ISSUE'}`);
  console.log(`WebSocket Connection: ${flowResults.connection ? '✅ OK' : '❌ FAILED'}`);
  console.log(`ConversationRelay Setup: ${flowResults.setupReceived ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Greeting Generation: ${flowResults.greetingSent ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Prompt Processing: ${flowResults.promptSent ? '✅ OK' : '❌ FAILED'}`);
  console.log(`AI Response: ${flowResults.responseReceived ? '✅ OK' : '❌ FAILED'}`);
  
  const allWorking = azureOk && flowResults.connection && flowResults.setupReceived && 
                    flowResults.greetingSent && flowResults.responseReceived;
  
  if (allWorking) {
    console.log('\n🎉 ALL SYSTEMS WORKING!');
    console.log('======================');
    console.log('✅ Your conversation flow is working perfectly');
    console.log('✅ The issue is likely with Twilio ConversationRelay TTS or audio');
    console.log('\n🔍 NEXT STEPS:');
    console.log('1. Check Twilio Console for ConversationRelay errors');
    console.log('2. Verify Twilio account has ConversationRelay enabled');
    console.log('3. Test with different voice settings');
    console.log('4. Check for Twilio service outages');
  } else {
    console.log('\n❌ ISSUES DETECTED IN CONVERSATION FLOW');
    console.log('=======================================');
    console.log('🔧 Fix these issues to resolve the call silence problem');
  }
  
  process.exit(allWorking ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
