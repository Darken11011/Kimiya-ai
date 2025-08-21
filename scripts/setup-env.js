#!/usr/bin/env node

/**
 * Environment Setup Script for Kimiyi Call Flow Weaver
 * Helps users configure their environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env');
const examplePath = path.join(process.cwd(), '.env.example');

console.log('🚀 Kimiyi Call Flow Weaver - Environment Setup');
console.log('===============================================\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('This script will help you set up your environment variables.\n');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. You can manually edit your .env file.');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide the following information:\n');

  // Azure OpenAI Configuration
  console.log('🔵 Azure OpenAI Configuration:');
  const azureApiKey = await question('   Azure OpenAI API Key: ');
  const azureEndpoint = await question('   Azure OpenAI Endpoint (e.g., https://your-resource.openai.azure.com): ');

  // Twilio Configuration
  console.log('\n📞 Twilio Configuration:');
  const twilioSid = await question('   Twilio Account SID: ');
  const twilioToken = await question('   Twilio Auth Token: ');
  const twilioPhone = await question('   Twilio Phone Number (e.g., +1234567890): ');

  // Optional configurations
  console.log('\n⚙️  Optional Configuration:');
  const webhookUrl = await question('   Webhook Base URL (optional, press Enter to skip): ');

  // Performance settings
  console.log('\n🚀 Performance Settings (press Enter for defaults):');
  const targetLatency = await question('   Target Latency in ms (default: 300): ') || '300';
  const maxLatency = await question('   Max Latency in ms (default: 500): ') || '500';

  // Generate .env content
  const envContent = `# Kimiyi Call Flow Weaver Environment Variables
# Generated on ${new Date().toISOString()}

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=${azureApiKey}
AZURE_OPENAI_ENDPOINT=${azureEndpoint}

# Twilio Configuration
TWILIO_ACCOUNT_SID=${twilioSid}
TWILIO_AUTH_TOKEN=${twilioToken}
TWILIO_PHONE_NUMBER=${twilioPhone}

# Optional: Webhook Base URL for Twilio callbacks
${webhookUrl ? `WEBHOOK_BASE_URL=${webhookUrl}` : '# WEBHOOK_BASE_URL=https://your-domain.com'}

# Performance Optimization Settings
PERFORMANCE_TARGET_LATENCY=${targetLatency}
PERFORMANCE_MAX_LATENCY=${maxLatency}
PERFORMANCE_CACHE_ENABLED=true
PERFORMANCE_LANGUAGE_OPTIMIZATION=true
PERFORMANCE_FAILOVER_ENABLED=true

# Optional: Other API Keys (uncomment and fill if using different providers)
# OPENAI_API_KEY=your_openai_api_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
# DEEPGRAM_API_KEY=your_deepgram_api_key_here
# AZURE_SPEECH_API_KEY=your_azure_speech_api_key_here
# AZURE_SPEECH_REGION=eastus
# GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment configuration saved to .env');
    
    // Validate configuration
    console.log('\n🔍 Validating configuration...');
    
    const validation = validateConfig({
      azureApiKey,
      azureEndpoint,
      twilioSid,
      twilioToken,
      twilioPhone,
      targetLatency: parseInt(targetLatency),
      maxLatency: parseInt(maxLatency)
    });

    if (validation.isValid) {
      console.log('✅ Configuration is valid!');
      console.log('\n🎉 Setup complete! You can now run the performance demo:');
      console.log('   npm run demo:performance');
    } else {
      console.log('⚠️  Configuration warnings:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

  } catch (error) {
    console.error('❌ Failed to write .env file:', error.message);
  }

  rl.close();
}

function validateConfig(config) {
  const warnings = [];
  
  if (!config.azureApiKey) {
    warnings.push('Azure OpenAI API Key is required');
  }
  
  if (!config.azureEndpoint || config.azureEndpoint.includes('your-resource')) {
    warnings.push('Azure OpenAI Endpoint should be your actual endpoint');
  }
  
  if (!config.twilioSid) {
    warnings.push('Twilio Account SID is required');
  }
  
  if (!config.twilioToken) {
    warnings.push('Twilio Auth Token is required');
  }
  
  if (!config.twilioPhone || !config.twilioPhone.match(/^\+\d{10,15}$/)) {
    warnings.push('Twilio Phone Number should be in E.164 format (e.g., +1234567890)');
  }
  
  if (config.targetLatency >= config.maxLatency) {
    warnings.push('Max Latency should be greater than Target Latency');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user.');
  rl.close();
  process.exit(0);
});

// Run setup
setupEnvironment().catch(error => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
