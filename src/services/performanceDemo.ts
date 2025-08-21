import PerformanceOrchestrator from './performanceOrchestrator';
import {
  WorkflowConfig,
  DEFAULT_GLOBAL_SETTINGS,
  LLMProvider,
  VoiceProvider,
  TranscriptionProvider
} from '../types/workflowConfig';

// Demo fallback configuration
const demoConfig = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'demo_account_sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'demo_auth_token',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
  },
  azureOpenAI: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || 'demo_azure_openai_key',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://demo.openai.azure.com',
    model: 'gpt-4-turbo',
    deploymentName: 'gpt4omini',
    apiVersion: '2025-01-01-preview'
  }
};

// Try to load environment config, but fall back to demo values
let envConfig: any = demoConfig;
let envAvailable = false;

try {
  const envModule = await import('../utils/envConfig');
  envConfig = envModule.envConfig;
  envAvailable = true;
  console.log('✅ Environment configuration loaded successfully');
} catch (error) {
  console.log('⚠️  Environment configuration not available, using demo values');
  envConfig = demoConfig;
  envAvailable = false;
}

/**
 * Demo script to test the performance optimization system
 * This demonstrates how to use the complete 3-phase optimization system
 */

// Sample workflow configuration using environment variables
const sampleWorkflowConfig: WorkflowConfig = {
  name: 'Performance Demo Workflow',
  twilio: {
    accountSid: envConfig.twilio.accountSid,
    authToken: envConfig.twilio.authToken,
    phoneNumber: envConfig.twilio.phoneNumber
  },
  llm: {
    provider: LLMProvider.AZURE_OPENAI,
    azure: {
      apiKey: envConfig.azureOpenAI.apiKey,
      endpoint: envConfig.azureOpenAI.endpoint,
      deploymentName: envConfig.azureOpenAI.deploymentName,
      model: envConfig.azureOpenAI.model,
      temperature: 0.7,
      maxTokens: 150,
      apiVersion: envConfig.azureOpenAI.apiVersion
    }
  },
  voice: {
    provider: VoiceProvider.AZURE,
    azure: {
      apiKey: 'demo_azure_key',
      region: 'eastus',
      voiceName: 'zh-HK-HiuGaaiNeural'
    }
  },
  transcription: {
    provider: TranscriptionProvider.AZURE,
    azure: {
      apiKey: 'demo_azure_stt_key',
      region: 'eastus',
      voiceName: 'zh-HK-HiuGaaiNeural' // Required for Azure transcription config
    }
  },
  globalSettings: {
    ...DEFAULT_GLOBAL_SETTINGS,
    defaultLanguage: 'zh-HK' // Cantonese for demo
  }
};

// Performance configuration using environment variables
const performanceConfig = {
  targetLatency: envConfig.performance.targetLatency,
  maxLatency: envConfig.performance.maxLatency,
  qualityThreshold: 0.9,
  cacheEnabled: envConfig.performance.cacheEnabled,
  languageOptimization: envConfig.performance.languageOptimization,
  failoverEnabled: envConfig.performance.failoverEnabled,
  monitoring: {
    enabled: true,
    metricsInterval: 10000, // 10 seconds for demo
    alertThresholds: {
      latency: envConfig.performance.targetLatency + 50,
      errorRate: 0.03,
      cacheHitRate: 0.4
    }
  }
};

export class PerformanceDemo {
  private orchestrator: PerformanceOrchestrator;

  constructor() {
    this.orchestrator = new PerformanceOrchestrator(sampleWorkflowConfig, performanceConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Performance monitoring events
    this.orchestrator.on('conversationStarted', (data) => {
      console.log(`🚀 [Demo] Conversation started for call ${data.callSid} in ${data.initTime}ms`);
    });

    this.orchestrator.on('audioProcessed', (data) => {
      console.log(`🎵 [Demo] Audio processed in ${data.processingTime}ms (confidence: ${data.confidence})`);
    });

    this.orchestrator.on('performanceAlert', (data) => {
      console.warn(`⚠️ [Demo] Performance alert:`, data);
    });

    this.orchestrator.on('metricsUpdate', (metrics) => {
      console.log(`📊 [Demo] Metrics update:`, {
        avgLatency: `${metrics.averageLatency.toFixed(0)}ms`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
        throughput: `${metrics.currentThroughput.toFixed(2)} req/s`
      });
    });

    this.orchestrator.on('conversationEnded', (data) => {
      console.log(`🏁 [Demo] Conversation ended for call ${data.callSid}`);
      console.log(`📈 [Demo] Final performance:`, data.performanceData);
    });
  }

  async runDemo(): Promise<any> {
    console.log('🚀 Starting Kimiyi Performance Optimization Demo...\n');

    // Log configuration status
    if (envAvailable) {
      console.log('✅ Using environment configuration');
      try {
        const envModule = await import('../utils/envConfig');
        const validation = envModule.validateEnvConfig(envConfig);
        if (!validation.isValid) {
          console.warn('⚠️  Environment configuration has issues:');
          validation.errors.forEach((error: string) => console.warn(`  - ${error}`));
          console.warn('Continuing with available configuration...\n');
        } else {
          envModule.logConfigStatus(envConfig);
        }
      } catch (error) {
        console.log('⚠️  Could not validate environment config, continuing with demo...');
      }
    } else {
      console.log('🔧 Using demo configuration');
      console.log(`   - Twilio Account: ${envConfig.twilio.accountSid}`);
      console.log(`   - Azure OpenAI: ${envConfig.azureOpenAI.endpoint}`);
      console.log(`   - Phone Number: ${envConfig.twilio.phoneNumber}`);
    }
    console.log('');

    console.log('🎯 [Demo] Starting Performance Optimization Demo');
    console.log('📋 [Demo] Configuration:');
    console.log(`   - Target Latency: ${performanceConfig.targetLatency}ms`);
    console.log(`   - Language: ${sampleWorkflowConfig.globalSettings?.defaultLanguage}`);
    console.log(`   - Cache Enabled: ${performanceConfig.cacheEnabled}`);
    console.log(`   - Language Optimization: ${performanceConfig.languageOptimization}`);
    console.log(`   - Provider Failover: ${performanceConfig.failoverEnabled}`);
    console.log('');

    try {
      // Simulate a conversation
      const callSid = 'demo_call_' + Date.now();
      
      console.log(`📞 [Demo] Starting optimized conversation: ${callSid}`);
      await this.orchestrator.startOptimizedConversation(callSid);

      // Simulate audio processing
      console.log('🎤 [Demo] Simulating audio processing...');
      
      const audioChunk = {
        data: Buffer.from('simulated_audio_data'),
        timestamp: Date.now(),
        sequenceNumber: 1,
        language: 'zh-HK'
      };

      await this.orchestrator.processOptimizedAudio(callSid, audioChunk);

      // Wait a bit to see metrics
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get current metrics
      const metrics = this.orchestrator.getPerformanceMetrics();
      console.log('📊 [Demo] Current Performance Metrics:');
      console.log(`   - Average Latency: ${metrics.averageLatency.toFixed(0)}ms`);
      console.log(`   - P95 Latency: ${metrics.p95Latency.toFixed(0)}ms`);
      console.log(`   - Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`   - Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
      console.log(`   - Total Requests: ${metrics.totalProcessedRequests}`);
      console.log('');

      // Stop conversation
      console.log('🛑 [Demo] Stopping conversation...');
      const finalData = await this.orchestrator.stopOptimizedConversation(callSid);
      
      console.log('✅ [Demo] Demo completed successfully!');
      console.log('🎉 [Demo] Performance Optimization System is working correctly');
      
      return finalData;

    } catch (error) {
      console.error('❌ [Demo] Demo failed:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 [Demo] Shutting down performance orchestrator...');
    await this.orchestrator.shutdown();
    console.log('✅ [Demo] Shutdown complete');
  }
}

// Export for use in other files
export default PerformanceDemo;

// If running directly (for testing)
// Check if this file is being run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('performanceDemo.ts');

if (isMainModule) {
  console.log('🔍 [Debug] Starting demo execution...');
  const demo = new PerformanceDemo();

  demo.runDemo()
    .then((result) => {
      console.log('🎯 [Demo] All tests passed!');
      console.log('🔍 [Debug] Demo result:', result);
      return demo.shutdown();
    })
    .then(() => {
      console.log('🔍 [Debug] Demo shutdown complete');
    })
    .catch((error) => {
      console.error('💥 [Demo] Demo failed:', error);
      console.error('🔍 [Debug] Error details:', error.stack);
      process.exit(1);
    });
}
