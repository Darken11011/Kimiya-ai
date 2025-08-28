#!/usr/bin/env node

/**
 * Real-time Twilio Connection Monitor
 * Monitors your Render deployment for incoming Twilio connections during actual calls
 */

const WebSocket = require('ws');

const RENDER_BASE_URL = 'https://kimiyi-ai.onrender.com';

console.log('🔍 TWILIO CONNECTION MONITOR');
console.log('============================');
console.log('This tool will monitor your Render deployment for incoming Twilio connections.');
console.log('Make a test call now and watch for connection attempts...\n');

let monitoringActive = true;
let connectionCount = 0;
let lastHealthCheck = null;

async function checkRenderHealth() {
  try {
    const response = await fetch(`${RENDER_BASE_URL}/health`);
    const healthData = await response.json();
    
    const currentConnections = healthData.conversationRelay?.activeConnections || 0;
    const uptime = Math.round(healthData.uptime);
    
    if (lastHealthCheck === null || currentConnections !== lastHealthCheck.connections) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 📊 Health Check:`);
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Uptime: ${uptime}s`);
      console.log(`   Active Connections: ${currentConnections}`);
      console.log(`   ConversationRelay: ${healthData.conversationRelay?.status || 'unknown'}`);
      
      if (currentConnections > (lastHealthCheck?.connections || 0)) {
        console.log(`   🎉 NEW CONNECTION DETECTED! (+${currentConnections - (lastHealthCheck?.connections || 0)})`);
        connectionCount++;
      }
      
      if (currentConnections < (lastHealthCheck?.connections || 0)) {
        console.log(`   🔌 CONNECTION CLOSED (-${(lastHealthCheck?.connections || 0) - currentConnections})`);
      }
      
      console.log('');
    }
    
    lastHealthCheck = {
      connections: currentConnections,
      uptime: uptime,
      timestamp: Date.now()
    };
    
    return healthData;
    
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    return null;
  }
}

async function testDirectConnection() {
  console.log('🧪 Testing direct WebSocket connection to verify server is responsive...');
  
  return new Promise((resolve) => {
    const testUrl = `wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?workflowId=monitor&trackingId=connection-test&CallSid=monitor_test`;
    const ws = new WebSocket(testUrl);
    
    const timeout = setTimeout(() => {
      console.log('❌ Direct connection test timeout');
      ws.close();
      resolve(false);
    }, 5000);
    
    ws.on('open', () => {
      console.log('✅ Direct connection successful - server is responsive');
      clearTimeout(timeout);
      
      // Send test setup message
      const setupMessage = {
        type: 'setup',
        callSid: 'CA_monitor_test',
        accountSid: 'AC_monitor_test',
        from: '+17077433838',
        to: '+919649770017',
        direction: 'outbound-api',
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify(setupMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('✅ Server responded correctly to test setup message');
        ws.close();
        resolve(true);
      } catch (error) {
        console.error('❌ Invalid response from server');
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`❌ Direct connection failed: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

async function monitorConnections() {
  console.log('🚀 Starting real-time monitoring...');
  console.log('📞 Make a test call now to see if Twilio connects to your WebSocket\n');
  
  // Initial health check
  await checkRenderHealth();
  
  // Test direct connection
  const directConnectionOk = await testDirectConnection();
  if (!directConnectionOk) {
    console.log('❌ Direct connection test failed - there may be server issues');
    return;
  }
  
  console.log('\n🔍 Monitoring for Twilio connections...');
  console.log('   (Press Ctrl+C to stop monitoring)\n');
  
  // Monitor every 2 seconds
  const monitorInterval = setInterval(async () => {
    if (!monitoringActive) {
      clearInterval(monitorInterval);
      return;
    }
    
    await checkRenderHealth();
  }, 2000);
  
  // Stop monitoring after 5 minutes
  setTimeout(() => {
    console.log('\n⏰ Monitoring timeout (5 minutes)');
    console.log('📊 MONITORING SUMMARY:');
    console.log(`   Total connection events detected: ${connectionCount}`);
    
    if (connectionCount === 0) {
      console.log('\n❌ NO TWILIO CONNECTIONS DETECTED!');
      console.log('🔍 POSSIBLE ISSUES:');
      console.log('   1. Twilio is not calling your webhook URLs');
      console.log('   2. Twilio webhook URLs are incorrect');
      console.log('   3. Twilio account/phone number configuration issues');
      console.log('   4. Network/firewall blocking Twilio connections');
      console.log('\n🚀 RECOMMENDED ACTIONS:');
      console.log('   1. Check Twilio Console webhook logs');
      console.log('   2. Verify webhook URLs in Twilio phone number configuration');
      console.log('   3. Test webhook endpoints manually');
      console.log('   4. Check Twilio account status and phone number setup');
    } else {
      console.log('\n✅ Twilio connections detected!');
      console.log('🔍 If calls are still silent, check:');
      console.log('   1. ConversationRelay message handling in server logs');
      console.log('   2. Azure OpenAI API configuration');
      console.log('   3. Speech processing and response generation');
    }
    
    monitoringActive = false;
    process.exit(0);
  }, 300000); // 5 minutes
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Monitoring stopped by user');
  console.log('📊 MONITORING SUMMARY:');
  console.log(`   Total connection events detected: ${connectionCount}`);
  
  if (connectionCount === 0) {
    console.log('\n❌ NO TWILIO CONNECTIONS DETECTED DURING MONITORING');
    console.log('🔍 This suggests Twilio is not connecting to your WebSocket server');
    console.log('📞 Check Twilio Console webhook logs for connection attempts');
  }
  
  monitoringActive = false;
  process.exit(0);
});

// Start monitoring
monitorConnections().catch(error => {
  console.error('❌ Monitoring failed:', error);
  process.exit(1);
});
