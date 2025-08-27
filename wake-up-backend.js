#!/usr/bin/env node

/**
 * Wake Up Backend Script
 * 
 * Render services go to sleep after 15 minutes of inactivity.
 * This script wakes up the backend by making repeated requests.
 */

const BACKEND_URL = 'https://kimiyi-ai.onrender.com';
const MAX_ATTEMPTS = 10;
const RETRY_DELAY = 5000; // 5 seconds

console.log('🚀 Waking up Render backend service...');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log('');

async function wakeUpBackend() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}: Pinging backend...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${BACKEND_URL}/health`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Backend-Wake-Up-Tool/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is awake!');
        console.log(`   Status: ${data.status}`);
        console.log(`   Uptime: ${Math.floor(data.uptime)}s`);
        console.log('');
        return true;
      } else {
        console.log(`   Response: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   Timeout (30s) - service is still waking up...');
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    if (attempt < MAX_ATTEMPTS) {
      console.log(`   Waiting ${RETRY_DELAY/1000}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  console.log('❌ Failed to wake up backend after all attempts');
  console.log('');
  console.log('💡 Possible solutions:');
  console.log('   1. Check Render dashboard for service status');
  console.log('   2. Manually restart the service in Render');
  console.log('   3. Check for deployment errors in Render logs');
  console.log('   4. Verify environment variables are set correctly');
  
  return false;
}

async function testEndpoints() {
  console.log('🧪 Testing key endpoints...');
  
  const endpoints = [
    '/health',
    '/api/health-optimized',
    '/api/twiml-optimized'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: endpoint === '/api/twiml-optimized' ? 'POST' : 'GET',
        headers: {
          'Content-Type': endpoint === '/api/twiml-optimized' ? 'application/x-www-form-urlencoded' : 'application/json'
        },
        body: endpoint === '/api/twiml-optimized' ? 'CallSid=test&workflowId=test&trackingId=test' : undefined
      });
      
      if (response.ok) {
        console.log(`   ✅ ${endpoint}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`   ❌ ${endpoint}: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('');
}

async function main() {
  const isAwake = await wakeUpBackend();
  
  if (isAwake) {
    await testEndpoints();
    
    console.log('🎉 Backend is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run the debug script: node debug-call-silence.js');
    console.log('2. Make a test call to verify the fix');
    console.log('3. Monitor Render logs during the call');
  }
}

// Run if executed directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main().catch(console.error);
}

export { wakeUpBackend, testEndpoints };
