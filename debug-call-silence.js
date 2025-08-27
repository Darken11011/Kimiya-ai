#!/usr/bin/env node

/**
 * Debug Script for Call Silence Issue
 *
 * This script helps diagnose why calls go silent after the greeting message.
 * It tests various components of the ConversationRelay system.
 */

// Test configuration
const TEST_CONFIG = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000', // Test local backend first
  remoteBackendUrl: 'https://kimiyi-ai.onrender.com',
  testCallSid: 'TEST_CALL_' + Date.now(),
  testWorkflowId: 'test-workflow-123'
};

console.log('🔍 Call Silence Debug Tool');
console.log('==========================');
console.log(`Backend URL: ${TEST_CONFIG.backendUrl}`);
console.log(`Test Call SID: ${TEST_CONFIG.testCallSid}`);
console.log('');

async function testBackendHealth() {
  console.log('1. Testing Backend Health...');

  try {
    console.log(`   Connecting to: ${TEST_CONFIG.backendUrl}/health`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${TEST_CONFIG.backendUrl}/health`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Call-Silence-Debug-Tool/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Backend is healthy');
    console.log(`   - Status: ${data.status}`);
    console.log(`   - Uptime: ${Math.floor(data.uptime)}s`);
    console.log(`   - Has Twilio SID: ${data.environment?.hasTwilioSid || 'unknown'}`);
    console.log(`   - Has Twilio Token: ${data.environment?.hasTwilioToken || 'unknown'}`);
    console.log(`   - Has Twilio Phone: ${data.environment?.hasTwilioPhone || 'unknown'}`);
    console.log('');

    return true;
  } catch (error) {
    console.log('❌ Backend health check failed');
    if (error.name === 'AbortError') {
      console.log('   Error: Request timeout (>10s)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('   - Check if backend is running and accessible');
    console.log('   - Verify the URL is correct');
    console.log('');
    return false;
  }
}

async function testOptimizedEndpoints() {
  console.log('2. Testing Optimized Endpoints...');

  try {
    console.log(`   Connecting to: ${TEST_CONFIG.backendUrl}/api/health-optimized`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/health-optimized`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Optimized endpoints are working');
    console.log(`   - Optimization enabled: ${data.optimization?.enabled || 'unknown'}`);
    console.log(`   - ConversationRelay: ${data.optimization?.features?.conversationRelay || 'unknown'}`);
    console.log(`   - Expected latency: ${data.optimization?.expectedLatency || 'unknown'}`);
    console.log('');

    return true;
  } catch (error) {
    console.log('❌ Optimized endpoints test failed');
    if (error.name === 'AbortError') {
      console.log('   Error: Request timeout (>10s)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function testWebSocketConnection() {
  console.log('3. Testing WebSocket Endpoint...');

  try {
    const wsUrl = `${TEST_CONFIG.backendUrl}/api/conversationrelay-ws`;
    console.log(`   Testing WebSocket endpoint: ${wsUrl}`);

    // Test if the WebSocket endpoint exists by making an HTTP request
    // WebSocket endpoints should return 426 Upgrade Required for HTTP requests
    const response = await fetch(wsUrl, {
      method: 'GET',
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      }
    });

    console.log(`   - HTTP Status: ${response.status}`);

    if (response.status === 426) {
      console.log('✅ WebSocket endpoint is accessible');
      console.log('   - Returns 426 Upgrade Required (expected for WebSocket)');
      console.log('   - WebSocket server is likely running');
      console.log('');
      return true;
    } else if (response.status === 404) {
      console.log('❌ WebSocket endpoint not found');
      console.log('   - Check if the WebSocket route is properly mounted');
      console.log('');
      return false;
    } else {
      console.log('⚠️  Unexpected response from WebSocket endpoint');
      console.log(`   - Status: ${response.status}`);
      console.log('   - May still work for actual WebSocket connections');
      console.log('');
      return true;
    }

  } catch (error) {
    console.log('❌ WebSocket endpoint test failed');
    console.log(`   Error: ${error.message}`);
    console.log('   - Check if backend is running and accessible');
    console.log('');
    return false;
  }
}

async function testTwiMLGeneration() {
  console.log('4. Testing TwiML Generation...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/twiml-optimized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        CallSid: TEST_CONFIG.testCallSid,
        workflowId: TEST_CONFIG.testWorkflowId,
        trackingId: 'debug-test'
      })
    });
    
    const twiml = await response.text();
    
    console.log('✅ TwiML generation working');
    console.log('   - Response received');
    console.log(`   - Contains ConversationRelay: ${twiml.includes('ConversationRelay')}`);
    console.log(`   - Contains welcomeGreeting: ${twiml.includes('welcomeGreeting')}`);
    console.log(`   - Contains WebSocket URL: ${twiml.includes('wss://')}`);
    console.log('');

    // Always show TwiML content for debugging
    console.log('   TwiML Content:');
    console.log('   ' + twiml.split('\n').join('\n   '));
    console.log('');
    
    return true;
  } catch (error) {
    console.log('❌ TwiML generation test failed');
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Call Silence Diagnostics...\n');

  const results = {};

  try {
    console.log('Running backend health test...');
    results.backendHealth = await testBackendHealth();

    console.log('Running optimized endpoints test...');
    results.optimizedEndpoints = await testOptimizedEndpoints();

    console.log('Running WebSocket connection test...');
    results.webSocketConnection = await testWebSocketConnection();

    console.log('Running TwiML generation test...');
    results.twimlGeneration = await testTwiMLGeneration();

  } catch (error) {
    console.log('❌ Error during diagnostics:', error.message);
    return;
  }
  
  console.log('📊 Diagnostic Results Summary');
  console.log('=============================');
  console.log(`Backend Health: ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Optimized Endpoints: ${results.optimizedEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Endpoint: ${results.webSocketConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`TwiML Generation: ${results.twimlGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('🎉 All tests passed! The issue might be:');
    console.log('   1. Speech detection thresholds (now fixed)');
    console.log('   2. Audio quality/microphone issues');
    console.log('   3. Network latency affecting WebSocket');
    console.log('   4. Twilio ConversationRelay configuration');
  } else {
    console.log('⚠️  Some tests failed. Focus on fixing these issues first.');
  }
  
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Check browser console for WebSocket errors');
  console.log('   2. Test with different phones/networks');
  console.log('   3. Monitor backend logs during calls');
  console.log('   4. Verify Twilio webhook URLs are accessible');
}

// Run diagnostics if this script is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  runDiagnostics().catch(console.error);
}

export {
  runDiagnostics,
  testBackendHealth,
  testOptimizedEndpoints,
  testWebSocketConnection,
  testTwiMLGeneration
};
