#!/usr/bin/env node

/**
 * Backend Diagnostic Script
 * Run this to diagnose issues with your Render backend
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://kimiyi-ai.onrender.com';

console.log('🔍 Kimiyi Backend Diagnostic Tool');
console.log('==================================');
console.log(`Testing backend at: ${BACKEND_URL}`);
console.log('');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kimiyi-Diagnostic-Tool/1.0',
        ...options.headers
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`📡 Testing ${name}...`);
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.status >= 200 && result.status < 300) {
      console.log(`✅ ${name}: OK (${result.status})`);
      if (result.data && typeof result.data === 'object') {
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log(`❌ ${name}: Failed (${result.status})`);
      console.log(`   Response:`, result.data);
    }
    
    return result;
  } catch (error) {
    console.log(`💥 ${name}: Error - ${error.message}`);
    return { error: error.message };
  }
  
  console.log('');
}

async function runDiagnostics() {
  console.log('🚀 Starting diagnostics...\n');
  
  // Test 1: Basic connectivity
  await testEndpoint('Basic Connectivity', `${BACKEND_URL}/`);
  
  // Test 2: Health check
  const healthResult = await testEndpoint('Health Check', `${BACKEND_URL}/health`);
  
  // Test 3: Ping endpoint
  await testEndpoint('Ping Endpoint', `${BACKEND_URL}/ping`);
  
  // Test 4: Make call endpoint (with dummy data)
  console.log('📞 Testing Make Call Endpoint...');
  const callResult = await testEndpoint('Make Call (Test)', `${BACKEND_URL}/api/make-call`, {
    method: 'POST',
    body: {
      to: '+1234567890', // Dummy number
      from: '+1234567890',
      twilioAccountSid: 'test_sid',
      twilioAuthToken: 'test_token'
    }
  });
  
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  
  if (healthResult && healthResult.data) {
    const health = healthResult.data;
    
    console.log(`Backend Status: ${health.status || 'Unknown'}`);
    console.log(`Uptime: ${health.uptime ? Math.round(health.uptime) + 's' : 'Unknown'}`);
    
    if (health.environment) {
      console.log('\n🔧 Environment Configuration:');
      console.log(`  Node Environment: ${health.environment.nodeEnv}`);
      console.log(`  Port: ${health.environment.port}`);
      console.log(`  Twilio SID: ${health.environment.hasTwilioSid ? '✅ Set' : '❌ Missing'}`);
      console.log(`  Twilio Token: ${health.environment.hasTwilioToken ? '✅ Set' : '❌ Missing'}`);
      console.log(`  Twilio Phone: ${health.environment.hasTwilioPhone ? '✅ Set' : '❌ Missing'}`);
      console.log(`  Azure OpenAI Key: ${health.environment.hasAzureKey ? '✅ Set' : '❌ Missing'}`);
      console.log(`  Azure OpenAI Endpoint: ${health.environment.hasAzureEndpoint ? '✅ Set' : '❌ Missing'}`);
    }
    
    if (health.warnings && health.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      health.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
    if (health.memory) {
      console.log(`\n💾 Memory Usage: ${health.memory.used} / ${health.memory.total}`);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (healthResult && healthResult.data && healthResult.data.warnings) {
    console.log('1. ❌ Missing Environment Variables Detected!');
    console.log('   Go to your Render dashboard → Your service → Environment');
    console.log('   Add the missing environment variables:');
    healthResult.data.warnings.forEach(warning => {
      if (warning.includes('Missing environment variables:')) {
        const vars = warning.replace('Missing environment variables: ', '').split(', ');
        vars.forEach(varName => {
          console.log(`   - ${varName}=your_${varName.toLowerCase()}_here`);
        });
      }
    });
  } else {
    console.log('1. ✅ Environment variables appear to be configured');
  }
  
  console.log('\n2. 🔄 If the issue persists:');
  console.log('   - Check Render logs: Dashboard → Your service → Logs');
  console.log('   - Restart your service: Dashboard → Your service → Manual Deploy');
  console.log('   - Verify your Twilio credentials are correct');
  
  console.log('\n3. 📞 For call testing:');
  console.log('   - Make sure your Twilio phone number is verified');
  console.log('   - Check that your webhook URLs are accessible');
  console.log('   - Verify your account has sufficient Twilio credits');
  
  console.log('\n✨ Diagnostic complete!');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('💥 Diagnostic failed:', error);
  process.exit(1);
});
