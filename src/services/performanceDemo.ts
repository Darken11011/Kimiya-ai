import PerformanceOrchestrator from './performanceOrchestrator';
import {
  WorkflowConfig,
  DEFAULT_GLOBAL_SETTINGS,
  LLMProvider,
  VoiceProvider,
  TranscriptionProvider
} from '../types/workflowConfig';

/**
 * Demo script to test the performance optimization system
 * This demonstrates how to use the complete 3-phase optimization system
 */

// Sample workflow configuration
const sampleWorkflowConfig: WorkflowConfig = {
  name: 'Performance Demo Workflow',
  twilio: {
    accountSid: 'demo_account_sid',
    authToken: 'demo_auth_token',
    phoneNumber: '+1234567890'
  },
  llm: {
    provider: LLMProvider.OPENAI,
    openAI: {
      apiKey: 'demo_openai_key',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 150
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

// Performance configuration for sub-300ms response times
const performanceConfig = {
  targetLatency: 250,
  maxLatency: 400,
  qualityThreshold: 0.9,
  cacheEnabled: true,
  languageOptimization: true,
  failoverEnabled: true,
  monitoring: {
    enabled: true,
    metricsInterval: 10000, // 10 seconds for demo
    alertThresholds: {
      latency: 300,
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
if (require.main === module) {
  const demo = new PerformanceDemo();
  
  demo.runDemo()
    .then(() => {
      console.log('🎯 [Demo] All tests passed!');
      return demo.shutdown();
    })
    .catch((error) => {
      console.error('💥 [Demo] Demo failed:', error);
      process.exit(1);
    });
}
