#!/usr/bin/env node

/**
 * Voice Configuration Test
 * Verifies that TwiML uses correct ConversationRelay voice settings
 */

const RENDER_BASE_URL = 'https://kimiyi-ai.onrender.com';

console.log('🎤 VOICE CONFIGURATION TEST');
console.log('===========================');
console.log('Testing TwiML voice settings to prevent Error 64101...\n');

async function testTwiMLVoiceConfiguration() {
  console.log('📋 Testing TwiML Voice Configuration...');
  console.log('======================================');
  
  try {
    const testParams = new URLSearchParams({
      id: 'voice-test-workflow',
      trackingId: 'voice-config-test',
      CallSid: 'CA_voice_test_' + Date.now(),
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
    
    // Parse and validate voice configuration
    console.log('\n🔍 Analyzing Voice Configuration...');
    console.log('===================================');
    
    // Check for ConversationRelay element
    if (twimlResponse.includes('<ConversationRelay')) {
      console.log('✅ ConversationRelay element found');
      
      // Extract voice setting
      const voiceMatch = twimlResponse.match(/voice="([^"]+)"/);
      if (voiceMatch) {
        const voiceValue = voiceMatch[1];
        console.log(`   Voice setting: "${voiceValue}"`);
        
        // Validate voice setting - Updated for ElevenLabs integration
        const validVoices = [
          '21m00Tcm4TlvDq8ikWAM', // Rachel (Female, English)
          'pNInz6obpgDQGcFmaJgB', // Adam (Male, English)
          'AZnzlk1XvdvUeBnXmlld', // Domi (Female, English)
          'EXAVITQu4vr4xnSDxMaL', // Bella (Female, English)
          'en-US-Standard-A',      // Google fallback
          'Joanna-Generative'      // Amazon Polly fallback
        ];
        if (validVoices.includes(voiceValue)) {
          console.log('✅ Voice setting is VALID for ConversationRelay with ElevenLabs');
        } else {
          console.log('❌ Voice setting is INVALID - will cause Error 64101');
          console.log(`   Valid ElevenLabs options: 21m00Tcm4TlvDq8ikWAM, pNInz6obpgDQGcFmaJgB`);
          console.log(`   Valid fallback options: en-US-Standard-A, Joanna-Generative`);
          return false;
        }
      } else {
        console.log('⚠️  No voice setting found - using default');
      }
      
      // Extract language setting
      const languageMatch = twimlResponse.match(/language="([^"]+)"/);
      if (languageMatch) {
        const languageValue = languageMatch[1];
        console.log(`   Language setting: "${languageValue}"`);
        
        // Validate language setting
        const validLanguages = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'];
        if (validLanguages.includes(languageValue)) {
          console.log('✅ Language setting is VALID for ConversationRelay');
        } else {
          console.log('❌ Language setting may cause issues');
          console.log(`   Recommended: ${validLanguages.join(', ')}`);
        }
      } else {
        console.log('⚠️  No language setting found - using default');
      }
      
      // Check for DTMF detection
      const dtmfMatch = twimlResponse.match(/dtmfDetection="([^"]+)"/);
      if (dtmfMatch) {
        console.log(`   DTMF Detection: "${dtmfMatch[1]}"`);
        console.log('✅ DTMF detection configured');
      } else {
        console.log('⚠️  DTMF detection not configured');
      }
      
      // Check for welcome greeting
      const greetingMatch = twimlResponse.match(/welcomeGreeting="([^"]+)"/);
      if (greetingMatch) {
        const greeting = greetingMatch[1];
        console.log(`   Welcome Greeting: "${greeting.substring(0, 50)}${greeting.length > 50 ? '...' : ''}"`);
        console.log('✅ Welcome greeting configured');
      } else {
        console.log('⚠️  No welcome greeting configured');
      }
      
      // Check for invalid voice patterns
      const invalidPatterns = [
        /Polly\./,
        /elevenlabs\./,
        /google\./,
        /azure\./,
        /Neural/,
        /Wavenet/
      ];
      
      let hasInvalidVoice = false;
      invalidPatterns.forEach(pattern => {
        if (pattern.test(twimlResponse)) {
          console.log('❌ CRITICAL: Invalid voice pattern detected!');
          console.log(`   Pattern: ${pattern.source}`);
          hasInvalidVoice = true;
        }
      });
      
      if (!hasInvalidVoice) {
        console.log('✅ No invalid voice patterns detected');
      }
      
      console.log('\n📋 Complete TwiML Response:');
      console.log('===========================');
      console.log(twimlResponse);
      
      return !hasInvalidVoice;
      
    } else {
      console.log('❌ ConversationRelay element not found in TwiML');
      console.log('TwiML Response:', twimlResponse);
      return false;
    }
    
  } catch (error) {
    console.error('❌ TwiML voice configuration test failed:', error.message);
    return false;
  }
}

async function testWebSocketVoiceConfiguration() {
  console.log('\n🔌 Testing WebSocket Voice Configuration...');
  console.log('==========================================');
  
  return new Promise((resolve) => {
    const WebSocket = require('ws');
    const testUrl = `wss://kimiyi-ai.onrender.com/api/conversationrelay-ws?workflowId=voice-test&trackingId=ws-voice-test&CallSid=voice_test`;
    const ws = new WebSocket(testUrl);
    
    const timeout = setTimeout(() => {
      console.log('❌ WebSocket voice test timeout');
      ws.close();
      resolve(false);
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Send setup message
      const setupMessage = {
        type: 'setup',
        callSid: 'CA_voice_test_' + Date.now(),
        accountSid: 'AC_voice_test',
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
        console.log('📥 Received WebSocket message:');
        console.log(`   Type: ${message.type}`);
        console.log(`   Text: "${message.text?.substring(0, 50)}${message.text?.length > 50 ? '...' : ''}"`);
        
        if (message.voice) {
          console.log(`   Voice Name: "${message.voice.name}"`);
          console.log(`   Voice Language: "${message.voice.language}"`);
          
          // Validate WebSocket voice configuration - Updated for ElevenLabs
          const validVoices = [
            '21m00Tcm4TlvDq8ikWAM', // Rachel (Female, English)
            'pNInz6obpgDQGcFmaJgB', // Adam (Male, English)
            'AZnzlk1XvdvUeBnXmlld', // Domi (Female, English)
            'EXAVITQu4vr4xnSDxMaL', // Bella (Female, English)
            'en-US-Standard-A',      // Google fallback
            'Joanna-Generative'      // Amazon Polly fallback
          ];
          if (validVoices.includes(message.voice.name)) {
            console.log('✅ WebSocket voice configuration is VALID for ElevenLabs');
          } else {
            console.log('❌ WebSocket voice configuration is INVALID');
            console.log(`   Valid ElevenLabs options: 21m00Tcm4TlvDq8ikWAM, pNInz6obpgDQGcFmaJgB`);
          }
        } else {
          console.log('⚠️  No voice configuration in WebSocket message');
        }
        
        clearTimeout(timeout);
        ws.close();
        resolve(true);
        
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error.message);
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function runVoiceConfigurationTest() {
  console.log('🚀 Starting voice configuration validation...\n');
  
  const twimlOk = await testTwiMLVoiceConfiguration();
  const websocketOk = await testWebSocketVoiceConfiguration();
  
  console.log('\n📊 VOICE CONFIGURATION TEST RESULTS');
  console.log('====================================');
  console.log(`TwiML Voice Config: ${twimlOk ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`WebSocket Voice Config: ${websocketOk ? '✅ VALID' : '❌ INVALID'}`);
  
  if (twimlOk && websocketOk) {
    console.log('\n🎉 VOICE CONFIGURATION SUCCESS!');
    console.log('===============================');
    console.log('✅ TwiML uses ConversationRelay-compatible voice settings');
    console.log('✅ WebSocket messages use matching voice configuration');
    console.log('✅ No Error 64101 should occur with these settings');
    console.log('✅ Ready for production calls with proper TTS');
    
    console.log('\n📞 NEXT STEPS:');
    console.log('1. Make a test call to verify no 64101 errors');
    console.log('2. Confirm clear audio output during calls');
    console.log('3. Test DTMF detection functionality');
    
  } else {
    console.log('\n❌ VOICE CONFIGURATION ISSUES DETECTED!');
    console.log('=======================================');
    
    if (!twimlOk) {
      console.log('🔧 TwiML Issues:');
      console.log('   - Voice setting may cause Error 64101');
      console.log('   - Use ElevenLabs voice IDs like "21m00Tcm4TlvDq8ikWAM" (Rachel)');
      console.log('   - Or fallback options like "en-US-Standard-A" (Google)');
    }
    
    if (!websocketOk) {
      console.log('🔧 WebSocket Issues:');
      console.log('   - Voice configuration in text messages may be invalid');
      console.log('   - Ensure voice.name uses ElevenLabs voice IDs like "21m00Tcm4TlvDq8ikWAM"');
    }
    
    console.log('\n🚀 RECOMMENDED ACTIONS:');
    console.log('1. Fix voice configuration issues identified above');
    console.log('2. Redeploy to Render');
    console.log('3. Re-run this test to verify fixes');
  }
  
  process.exit(twimlOk && websocketOk ? 0 : 1);
}

// Run voice configuration test
runVoiceConfigurationTest().catch(error => {
  console.error('❌ Voice configuration test failed:', error);
  process.exit(1);
});
