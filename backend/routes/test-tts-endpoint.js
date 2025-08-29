/**
 * TTS Test Endpoint - Run TTS diagnostics from backend
 * Uses same credentials as working backend
 */

const twilio = require('twilio');

// Get credentials from environment (same as working backend)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+17077433838';

async function testTTSEndpoint(req, res) {
  console.log('[TTS-Test] Starting TTS diagnostic tests...');
  console.log('[TTS-Test] Request method:', req.method);
  console.log('[TTS-Test] Request body:', req.body);
  console.log('[TTS-Test] Request query:', req.query);

  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate credentials
    if (!accountSid || !authToken) {
      console.log('[TTS-Test] Missing credentials:', { accountSid: !!accountSid, authToken: !!authToken });
      return res.status(500).json({
        success: false,
        error: 'Missing Twilio credentials',
        details: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN required',
        env: {
          hasAccountSid: !!accountSid,
          hasAuthToken: !!authToken,
          hasFromNumber: !!fromNumber
        }
      });
    }
    
    // If GET request, return a simple test page
    if (req.method === 'GET') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TTS Diagnostic Test</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
            .button:hover { background: #005a87; }
            .result { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .loading { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>🎤 TTS Diagnostic Test</h1>
          <p>This will make 3 test calls to diagnose TTS functionality:</p>
          <ol>
            <li><strong>Basic TTS</strong> - Uses &lt;Say&gt; verb (should work)</li>
            <li><strong>ConversationRelay Minimal</strong> - Tests ConversationRelay TTS</li>
            <li><strong>ConversationRelay Google TTS</strong> - Tests Google TTS provider</li>
          </ol>

          <input type="text" id="phoneNumber" placeholder="Phone number (e.g., +919649770017)" value="+919649770017" style="width: 300px; padding: 8px; margin: 10px 0;">
          <br>
          <button class="button" onclick="runTest()">🚀 Run TTS Tests</button>

          <div id="result"></div>

          <script>
            async function runTest() {
              const phoneNumber = document.getElementById('phoneNumber').value;
              const resultDiv = document.getElementById('result');

              resultDiv.innerHTML = '<div class="loading">🔄 Running TTS tests... This will take about 15 seconds.</div>';

              try {
                const response = await fetch('/api/test-tts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to: phoneNumber })
                });

                const data = await response.json();

                let html = '<div class="result"><h3>📋 Test Results:</h3>';

                if (data.success) {
                  html += '<p>✅ Tests completed successfully!</p>';
                  html += '<h4>Test Results:</h4><ul>';

                  data.results.tests.forEach(test => {
                    const icon = test.status === 'success' ? '✅' : '❌';
                    html += \`<li>\${icon} <strong>\${test.test}</strong>: \${test.status}\`;
                    if (test.callSid) html += \` (Call: \${test.callSid})\`;
                    if (test.error) html += \` - Error: \${test.error}\`;
                    if (test.expected) html += \`<br><em>\${test.expected}</em>\`;
                    html += '</li>';
                  });

                  html += '</ul><h4>📞 Next Steps:</h4><ul>';
                  data.nextSteps.forEach(step => {
                    html += \`<li>\${step}</li>\`;
                  });
                  html += '</ul>';
                } else {
                  html += \`<p>❌ Test failed: \${data.error}</p>\`;
                  if (data.details) html += \`<p>Details: \${data.details}</p>\`;
                }

                html += '</div>';
                resultDiv.innerHTML = html;

              } catch (error) {
                resultDiv.innerHTML = \`<div class="result">❌ Error running tests: \${error.message}</div>\`;
              }
            }
          </script>
        </body>
        </html>
      `);
    }

    const client = twilio(accountSid, authToken);
    const toNumber = req.body.to || req.query.to || '+919649770017';

    console.log(`[TTS-Test] Using credentials: ${accountSid.substring(0, 10)}...`);
    console.log(`[TTS-Test] Testing TTS to: ${toNumber}`);
    
    const results = {
      timestamp: new Date().toISOString(),
      accountSid: accountSid,
      tests: []
    };
    
    // Test 1: Basic TTS with <Say>
    console.log('[TTS-Test] Test 1: Basic TTS with <Say> verb...');
    try {
      const basicCall = await client.calls.create({
        to: toNumber,
        from: fromNumber,
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is Test 1: Basic TTS using the Say verb. Can you hear me clearly?</Say>
    <Pause length="2"/>
    <Say voice="alice">If you can hear this, basic Twilio TTS is working on your account.</Say>
</Response>`
      });
      
      results.tests.push({
        test: 'Basic TTS (<Say>)',
        status: 'success',
        callSid: basicCall.sid,
        expected: 'Should hear clear TTS audio with alice voice'
      });
      
      console.log(`[TTS-Test] ✅ Basic TTS call created: ${basicCall.sid}`);
    } catch (error) {
      results.tests.push({
        test: 'Basic TTS (<Say>)',
        status: 'failed',
        error: error.message
      });
      console.log(`[TTS-Test] ❌ Basic TTS failed: ${error.message}`);
    }
    
    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: ConversationRelay Minimal
    console.log('[TTS-Test] Test 2: Minimal ConversationRelay...');
    try {
      const crCall = await client.calls.create({
        to: toNumber,
        from: fromNumber,
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://echo.websocket.org"
            welcomeGreeting="Hello! This is Test 2: Minimal ConversationRelay test. Can you hear this welcome greeting?"
            voice="alice"
            language="en-US"
        />
    </Connect>
</Response>`
      });
      
      results.tests.push({
        test: 'ConversationRelay Minimal',
        status: 'success',
        callSid: crCall.sid,
        expected: 'Should hear welcome greeting only (no WebSocket responses)'
      });
      
      console.log(`[TTS-Test] ✅ ConversationRelay call created: ${crCall.sid}`);
    } catch (error) {
      results.tests.push({
        test: 'ConversationRelay Minimal',
        status: 'failed',
        error: error.message
      });
      console.log(`[TTS-Test] ❌ ConversationRelay failed: ${error.message}`);
    }
    
    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: ConversationRelay with Google TTS
    console.log('[TTS-Test] Test 3: ConversationRelay with Google TTS...');
    try {
      const googleCall = await client.calls.create({
        to: toNumber,
        from: fromNumber,
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://echo.websocket.org"
            welcomeGreeting="Hello! This is Test 3: Google TTS through ConversationRelay. Can you hear this message?"
            language="en-US"
        >
            <Language code="en-US" ttsProvider="google" voice="en-US-Standard-A" />
        </ConversationRelay>
    </Connect>
</Response>`
      });
      
      results.tests.push({
        test: 'ConversationRelay Google TTS',
        status: 'success',
        callSid: googleCall.sid,
        expected: 'Should hear Google TTS voice (different from alice)'
      });
      
      console.log(`[TTS-Test] ✅ Google TTS call created: ${googleCall.sid}`);
    } catch (error) {
      results.tests.push({
        test: 'ConversationRelay Google TTS',
        status: 'failed',
        error: error.message
      });
      console.log(`[TTS-Test] ❌ Google TTS failed: ${error.message}`);
    }
    
    // Return results
    console.log('[TTS-Test] All tests completed');
    
    res.json({
      success: true,
      message: 'TTS diagnostic tests completed',
      results: results,
      analysis: {
        'All tests successful': 'Issue is in WebSocket implementation',
        'Only Test 1 successful': 'ConversationRelay needs Twilio support',
        'No tests successful': 'Account has TTS restrictions',
        'Tests 1&2 successful, Test 3 failed': 'Google TTS provider not available'
      },
      nextSteps: [
        'Listen to the test calls to determine which TTS methods work',
        'If ConversationRelay tests fail, contact Twilio Support',
        'If all tests work, the issue is in your WebSocket message handling'
      ]
    });
    
  } catch (error) {
    console.error('[TTS-Test] Error running tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run TTS tests',
      details: error.message
    });
  }
}

module.exports = { testTTSEndpoint };
