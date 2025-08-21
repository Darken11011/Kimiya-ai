#!/usr/bin/env node

/**
 * Twilio Authentication Test Script
 * Tests your Twilio credentials directly against Twilio API
 */

const https = require('https');
require('dotenv').config();

console.log('🔐 Twilio Authentication Test');
console.log('=============================');

// Get credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('📋 Credential Check:');
console.log(`Account SID: ${accountSid ? '✅ Set' : '❌ Missing'}`);
console.log(`Auth Token: ${authToken ? '✅ Set' : '❌ Missing'}`);
console.log(`Phone Number: ${phoneNumber ? '✅ Set' : '❌ Missing'}`);

if (!accountSid || !authToken) {
  console.log('\n❌ Missing credentials! Please set environment variables:');
  console.log('TWILIO_ACCOUNT_SID=your_account_sid');
  console.log('TWILIO_AUTH_TOKEN=your_auth_token');
  process.exit(1);
}

// Validate credential format
console.log('\n🔍 Credential Format Check:');
console.log(`Account SID format: ${accountSid.startsWith('AC') && accountSid.length === 34 ? '✅ Valid' : '❌ Invalid'}`);
console.log(`  - Length: ${accountSid.length} (should be 34)`);
console.log(`  - Starts with AC: ${accountSid.startsWith('AC')}`);
console.log(`  - Preview: ${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}`);

console.log(`Auth Token format: ${authToken.length === 32 ? '✅ Valid' : '❌ Invalid'}`);
console.log(`  - Length: ${authToken.length} (should be 32)`);
console.log(`  - Preview: ${authToken.substring(0, 4)}...${authToken.substring(authToken.length - 4)}`);

if (phoneNumber) {
  console.log(`Phone Number format: ${phoneNumber.startsWith('+') ? '✅ Valid' : '⚠️  Should start with +'}`);
  console.log(`  - Value: ${phoneNumber}`);
}

// Test authentication by fetching account info
console.log('\n🧪 Testing Authentication...');

function testTwilioAuth() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    
    console.log(`Making request to: ${url}`);
    console.log(`Auth header length: ${auth.length}`);
    
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}.json`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Kimiyi-Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`Response status: ${res.statusCode}`);
      console.log(`Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTest() {
  try {
    const result = await testTwilioAuth();
    
    console.log('\n📊 Test Results:');
    
    if (result.status === 200) {
      console.log('✅ Authentication SUCCESS!');
      console.log('Account details:');
      console.log(`  - Account SID: ${result.data.sid}`);
      console.log(`  - Friendly Name: ${result.data.friendly_name}`);
      console.log(`  - Status: ${result.data.status}`);
      console.log(`  - Type: ${result.data.type}`);
      
      if (result.data.subresource_uris && result.data.subresource_uris.calls) {
        console.log('  - Calls endpoint available: ✅');
      }
      
      console.log('\n🎉 Your Twilio credentials are working correctly!');
      console.log('The 500 error is likely caused by something else.');
      
    } else if (result.status === 401) {
      console.log('❌ Authentication FAILED!');
      console.log('Error: Invalid credentials');
      
      if (result.data && result.data.message) {
        console.log(`Twilio error: ${result.data.message}`);
      }
      
      console.log('\n🔧 Possible fixes:');
      console.log('1. Double-check your Account SID and Auth Token in Twilio Console');
      console.log('2. Make sure there are no extra spaces or newlines');
      console.log('3. Verify you\'re using the correct Twilio account');
      console.log('4. Check if your account is suspended or has issues');
      
    } else {
      console.log(`❌ Unexpected response: ${result.status}`);
      console.log('Response data:', result.data);
    }
    
  } catch (error) {
    console.log('💥 Test failed with error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 Network error: Cannot reach Twilio API');
      console.log('Check your internet connection');
    } else if (error.message === 'Request timeout') {
      console.log('⏰ Request timed out');
      console.log('Check your internet connection or try again');
    }
  }
}

// Test phone number format if provided
if (phoneNumber) {
  console.log('\n📞 Testing Phone Number Format...');
  
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (phoneRegex.test(phoneNumber)) {
    console.log('✅ Phone number format looks good');
  } else {
    console.log('⚠️  Phone number format might be invalid');
    console.log('Should be in E.164 format: +1234567890');
  }
}

console.log('\n🚀 Starting authentication test...');
runTest().then(() => {
  console.log('\n✨ Test complete!');
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
