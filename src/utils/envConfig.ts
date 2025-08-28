/**
 * Environment Configuration Utility
 * Handles environment variables with proper defaults and validation
 * Browser-compatible version using import.meta.env
 */

export interface EnvConfig {
  // Azure OpenAI
  azureOpenAI: {
    apiKey: string;
    endpoint: string;
    model: string;
    deploymentName: string;
    apiVersion: string;
  };
  
  // Twilio
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    webhookBaseUrl: string;
  };
  
  // Performance
  performance: {
    targetLatency: number;
    maxLatency: number;
    cacheEnabled: boolean;
    languageOptimization: boolean;
    failoverEnabled: boolean;
  };
  
  // Optional API Keys
  optional: {
    openaiApiKey?: string;
    elevenLabsApiKey?: string;
    deepgramApiKey?: string;
    azureSpeechApiKey?: string;
    azureSpeechRegion?: string;
    googleCloudApiKey?: string;
  };
}

/**
 * Browser-compatible environment variable access
 * In Vite, environment variables are available via import.meta.env
 * and must be prefixed with VITE_ to be exposed to the browser
 */
const getEnvVar = (key: string): string | undefined => {
  // Try Vite environment variables first (prefixed with VITE_)
  const viteKey = `VITE_${key}`;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }

  // Fallback for Node.js environment (server-side)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  return undefined;
};

/**
 * Get environment configuration with proper defaults
 */
export const getEnvConfig = (): EnvConfig => {
  // Helper function to get boolean from env
  const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
    const value = getEnvVar(key);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  };

  // Helper function to get number from env
  const getNumberEnv = (key: string, defaultValue: number): number => {
    const value = getEnvVar(key);
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    azureOpenAI: {
      apiKey: getEnvVar('AZURE_OPENAI_API_KEY') || '',
      endpoint: getEnvVar('AZURE_OPENAI_ENDPOINT') || 'https://your-resource.openai.azure.com',
      model: 'gpt-4o-mini',
      deploymentName: 'gpt-4o-mini',
      apiVersion: '2024-02-15-preview'
    },

    twilio: {
      accountSid: getEnvVar('TWILIO_ACCOUNT_SID') || '',
      authToken: getEnvVar('TWILIO_AUTH_TOKEN') || '',
      phoneNumber: getEnvVar('TWILIO_PHONE_NUMBER') || '',
      webhookBaseUrl: getEnvVar('WEBHOOK_BASE_URL') || 'https://your-domain.com'
    },

    performance: {
      targetLatency: getNumberEnv('PERFORMANCE_TARGET_LATENCY', 300),
      maxLatency: getNumberEnv('PERFORMANCE_MAX_LATENCY', 500),
      cacheEnabled: getBooleanEnv('PERFORMANCE_CACHE_ENABLED', true),
      languageOptimization: getBooleanEnv('PERFORMANCE_LANGUAGE_OPTIMIZATION', true),
      failoverEnabled: getBooleanEnv('PERFORMANCE_FAILOVER_ENABLED', true)
    },

    optional: {
      openaiApiKey: getEnvVar('OPENAI_API_KEY'),
      elevenLabsApiKey: getEnvVar('ELEVENLABS_API_KEY'),
      deepgramApiKey: getEnvVar('DEEPGRAM_API_KEY'),
      azureSpeechApiKey: getEnvVar('AZURE_SPEECH_API_KEY'),
      azureSpeechRegion: getEnvVar('AZURE_SPEECH_REGION') || 'eastus',
      googleCloudApiKey: getEnvVar('GOOGLE_CLOUD_API_KEY')
    }
  };
};

/**
 * Validate required environment variables
 */
export const validateEnvConfig = (config: EnvConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required Azure OpenAI configuration
  if (!config.azureOpenAI.apiKey) {
    errors.push('AZURE_OPENAI_API_KEY is required');
  }
  if (!config.azureOpenAI.endpoint || config.azureOpenAI.endpoint === 'https://your-resource.openai.azure.com') {
    errors.push('AZURE_OPENAI_ENDPOINT is required and must be your actual Azure OpenAI endpoint');
  }

  // Check required Twilio configuration
  if (!config.twilio.accountSid) {
    errors.push('TWILIO_ACCOUNT_SID is required');
  }
  if (!config.twilio.authToken) {
    errors.push('TWILIO_AUTH_TOKEN is required');
  }
  if (!config.twilio.phoneNumber) {
    errors.push('TWILIO_PHONE_NUMBER is required');
  }

  // Validate phone number format
  if (config.twilio.phoneNumber && !config.twilio.phoneNumber.match(/^\+\d{10,15}$/)) {
    errors.push('TWILIO_PHONE_NUMBER must be in E.164 format (e.g., +1234567890)');
  }

  // Validate performance settings
  if (config.performance.targetLatency <= 0 || config.performance.targetLatency > 10000) {
    errors.push('PERFORMANCE_TARGET_LATENCY must be between 1 and 10000 milliseconds');
  }
  if (config.performance.maxLatency <= config.performance.targetLatency) {
    errors.push('PERFORMANCE_MAX_LATENCY must be greater than PERFORMANCE_TARGET_LATENCY');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get configuration with validation
 */
export const getValidatedEnvConfig = (): { config: EnvConfig; validation: { isValid: boolean; errors: string[] } } => {
  const config = getEnvConfig();
  const validation = validateEnvConfig(config);
  
  if (!validation.isValid) {
    console.warn('Environment configuration validation failed:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
    console.warn('Please check your .env file and ensure all required variables are set.');
  }
  
  return { config, validation };
};

/**
 * Log configuration status (without sensitive data)
 */
export const logConfigStatus = (config: EnvConfig): void => {
  console.log('🔧 Environment Configuration Status:');
  console.log(`  Azure OpenAI: ${config.azureOpenAI.apiKey ? '✅ Configured' : '❌ Missing API Key'}`);
  console.log(`  Twilio: ${config.twilio.accountSid && config.twilio.authToken ? '✅ Configured' : '❌ Missing Credentials'}`);
  console.log(`  Performance Optimization: ${config.performance.cacheEnabled ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`  Target Latency: ${config.performance.targetLatency}ms`);
  console.log(`  Language Optimization: ${config.performance.languageOptimization ? '✅ Enabled' : '⚠️ Disabled'}`);
  
  // ConversationRelay handles all voice services natively
  console.log(`  Voice Services: ConversationRelay Native TTS/STT`);
};

// Export singleton instance
export const envConfig = getEnvConfig();
export const { config: validatedConfig, validation: configValidation } = getValidatedEnvConfig();

export default envConfig;
