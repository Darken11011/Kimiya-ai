import { WorkflowConfig } from '../types/workflowConfig';

// API Base URL configuration
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Browser environment - always use Render backend for reliability
    // This ensures TwiML endpoints are accessible to Twilio webhooks
    return 'https://kimiyi-ai.onrender.com';
  }
  // Server-side rendering fallback
  return 'https://kimiyi-ai.onrender.com';
};

// API Response interfaces
export interface OptimizedCallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  to?: string;
  from?: string;
  optimization?: {
    enabled: boolean;
    trackingId: string;
    expectedLatency: string;
    features: {
      conversationRelay: boolean;
      predictiveCache: boolean;
      languageOptimization: boolean;
      providerFailover: boolean;
    };
  };
  message?: string;
  error?: string;
}

export interface PerformanceMetrics {
  success: boolean;
  trackingId?: string;
  metrics?: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    cacheHitRate: number;
    languageOptimizationRate: number;
    providerFailoverRate: number;
    totalProcessedRequests: number;
    uptime: number;
    currentThroughput: number;
  };
  callData?: any;
  optimization?: {
    enabled: boolean;
    features: Record<string, boolean>;
  };
  error?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  optimization?: {
    enabled: boolean;
    features: Record<string, string>;
  };
  performance?: {
    targetLatency: string;
    maxLatency: string;
    expectedImprovement: string;
  };
  environment?: {
    nodeVersion: string;
    uptime: number;
    memoryUsage: any;
  };
}

// Call Management API
export class CallAPI {
  private static baseUrl = getApiBaseUrl();

  /**
   * Make an optimized call with 150-250ms response times
   */
  static async makeOptimizedCall(callData: {
    to: string;
    from?: string;
    workflowId?: string;
    nodes?: any[];
    edges?: any[];
    globalPrompt?: string;
    config?: WorkflowConfig;
    record?: boolean;
    timeout?: number;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twimlUrl?: string;
  }): Promise<OptimizedCallResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/make-call-optimized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Optimized call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        optimization: {
          enabled: false,
          trackingId: '',
          expectedLatency: 'N/A',
          features: {
            conversationRelay: false,
            predictiveCache: false,
            languageOptimization: false,
            providerFailover: false
          }
        }
      };
    }
  }

  /**
   * Make a traditional call (fallback)
   */
  static async makeTraditionalCall(callData: {
    to: string;
    from?: string;
    workflowId?: string;
    nodes?: any[];
    edges?: any[];
    globalPrompt?: string;
    record?: boolean;
    timeout?: number;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData)
      });

      return await response.json();
    } catch (error) {
      console.error('Traditional call failed:', error);
      throw error;
    }
  }

  /**
   * End a call
   */
  static async endCall(callSid: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/end-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callSid })
      });

      return await response.json();
    } catch (error) {
      console.error('End call failed:', error);
      throw error;
    }
  }
}

// Performance Monitoring API
export class PerformanceAPI {
  private static baseUrl = getApiBaseUrl();

  /**
   * Get performance metrics for a specific call or all calls
   */
  static async getMetrics(trackingId?: string): Promise<PerformanceMetrics> {
    try {
      const url = trackingId 
        ? `${this.baseUrl}/api/performance-metrics/${trackingId}`
        : `${this.baseUrl}/api/performance-metrics`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get optimized system health status
   */
  static async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health-optimized`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw error;
    }
  }

  /**
   * Test the optimization system
   */
  static async testOptimization(testData: {
    message: string;
    language?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test-optimization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      return await response.json();
    } catch (error) {
      console.error('Optimization test failed:', error);
      throw error;
    }
  }
}

// Configuration API
export class ConfigAPI {
  private static baseUrl = getApiBaseUrl();

  /**
   * Get Twilio configuration
   */
  static async getTwilioConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/twilio-config`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get Twilio config:', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }
}

// Convenience exports
export const api = {
  call: CallAPI,
  performance: PerformanceAPI,
  config: ConfigAPI
};

export default api;
