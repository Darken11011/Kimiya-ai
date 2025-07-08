// Twilio Service for making phone calls
import { TwilioConfig } from '../types/workflowConfig';

export interface CallOptions {
  to: string; // Phone number to call
  from: string; // Twilio phone number
  url?: string; // TwiML URL for call instructions
  method?: 'GET' | 'POST';
  statusCallback?: string; // Webhook URL for call status updates
  statusCallbackMethod?: 'GET' | 'POST';
  record?: boolean;
  timeout?: number;
  // Workflow data for dynamic call processing
  workflowId?: string;
  nodes?: any[];
  edges?: any[];
  config?: any;
  globalPrompt?: string;
}

export interface CallResponse {
  success: boolean;
  callSid?: string;
  error?: string;
  message?: string;
}

export class TwilioService {
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  /**
   * Get the current Twilio configuration
   */
  getConfig(): TwilioConfig {
    return this.config;
  }

  /**
   * Make a phone call using Twilio REST API
   * Note: This is a demo implementation. In production, you would need a backend server
   * to make Twilio API calls due to CORS restrictions.
   */
  async makeCall(options: CallOptions): Promise<CallResponse> {
    try {
      // Normalize and validate phone number
      const normalizedNumber = this.normalizePhoneNumber(options.to);
      if (!normalizedNumber) {
        return {
          success: false,
          error: 'Invalid phone number. Please enter a valid phone number.'
        };
      }

      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const API_BASE_URL = this.getApiBaseUrl();

        // If we have a backend API available, use real calls
        if (API_BASE_URL.includes('kimiyi-ai.onrender.com') || API_BASE_URL.includes('localhost')) {
          return this.makeRealCall(normalizedNumber, options);
        } else {
          // Demo mode - simulate a successful call for testing purposes
          return this.simulateCall(normalizedNumber, options);
        }
      }

      // Server-side implementation (would work in Node.js environment)
      return this.makeRealCall(normalizedNumber, options);
    } catch (error) {
      console.error('Twilio call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Simulate a call for demo purposes (browser environment)
   */
  private async simulateCall(normalizedNumber: string, _options: CallOptions): Promise<CallResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a fake call SID
    const fakeCallSid = `CA${Math.random().toString(36).substring(2, 34)}`;

    return {
      success: true,
      callSid: fakeCallSid,
      message: `Demo call initiated to ${normalizedNumber}. In production, this would make a real call using Twilio.`
    };
  }

  /**
   * Make a real call using backend API
   */
  private async makeRealCall(normalizedNumber: string, options: CallOptions): Promise<CallResponse> {
    // Determine API base URL
    const API_BASE_URL = this.getApiBaseUrl();

    try {
      const response = await fetch(`${API_BASE_URL}/api/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: normalizedNumber,
          from: options.from || this.config.phoneNumber,
          record: options.record ?? this.config.recordCalls,
          timeout: options.timeout || this.config.callTimeout || 30,
          twimlUrl: options.url,
          // Include Twilio credentials
          twilioAccountSid: this.config.accountSid,
          twilioAuthToken: this.config.authToken,
          // Include workflow data for dynamic call processing
          workflowId: options.workflowId,
          nodes: options.nodes,
          edges: options.edges,
          config: options.config,
          globalPrompt: options.globalPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`
        };
      }

      const result = await response.json();
      return {
        success: result.success,
        callSid: result.callSid,
        message: result.message || `Call initiated successfully to ${normalizedNumber}`,
        error: result.error
      };

    } catch (error) {
      console.error('Backend API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to backend API'
      };
    }
  }

  /**
   * Get the API base URL based on environment
   */
  private getApiBaseUrl(): string {
    // Check if we have a custom API URL set
    if (typeof window !== 'undefined' && (window as any).CALL_FLOW_API_URL) {
      return (window as any).CALL_FLOW_API_URL;
    }

    // Default URLs based on environment
    if (typeof window !== 'undefined') {
      // Browser environment
      const hostname = window.location.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development - use Render backend for reliable TwiML endpoints
        // (You can change this to 'http://localhost:3000' if running backend locally)
        return 'https://kimiyi-ai.onrender.com';
      } else {
        // Production - use Render backend URL
        return 'https://kimiyi-ai.onrender.com';
      }
    }

    // Server environment fallback
    return process.env.API_BASE_URL || 'https://kimiyi-ai.onrender.com';
  }



  /**
   * Normalize phone number to E.164 format
   * Accepts various formats and converts them to E.164
   */
  private normalizePhoneNumber(phone: string): string | null {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If it's already in E.164 format, validate and return
    if (cleaned.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(cleaned)) {
      return cleaned;
    }

    // Remove any leading + if present
    cleaned = cleaned.replace(/^\+/, '');

    // If it's empty after cleaning, return null
    if (!cleaned) {
      return null;
    }

    // Handle different number formats
    if (cleaned.length === 10) {
      // Assume US number if 10 digits (e.g., 1234567890)
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US number with country code (e.g., 11234567890)
      return `+${cleaned}`;
    } else if (cleaned.length >= 7 && cleaned.length <= 15) {
      // International number without country code
      // For most international numbers, we'll assume they need a + prefix
      return `+${cleaned}`;
    }

    // If we can't determine the format, return null
    return null;
  }



  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<any> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // Check if we should use real API or demo mode
        const API_BASE_URL = this.getApiBaseUrl();

        if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('vercel.app')) {
          // Use real backend API
          const response = await fetch(`${API_BASE_URL}/api/call-status?callSid=${callSid}`);

          if (response.ok) {
            const result = await response.json();
            return result.call;
          } else {
            throw new Error('Failed to get call status from backend');
          }
        } else {
          // Return mock call status for demo
          return {
            sid: callSid,
            status: 'in-progress',
            direction: 'outbound-api',
            from: this.config.phoneNumber,
            to: '+1234567890', // Mock number
            duration: null,
            price: null
          };
        }
      }

      // Server environment fallback (shouldn't be reached in browser)
      throw new Error('Server environment not supported in browser');
    } catch (error) {
      console.error('Error getting call status:', error);
      throw error;
    }
  }

  /**
   * Hang up a call
   */
  async hangupCall(callSid: string): Promise<CallResponse> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const API_BASE_URL = this.getApiBaseUrl();

        if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('vercel.app')) {
          // Use real backend API
          const response = await fetch(`${API_BASE_URL}/api/end-call?callSid=${callSid}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            const result = await response.json();
            return {
              success: result.success,
              message: result.message || 'Call ended successfully'
            };
          } else {
            const errorData = await response.json().catch(() => ({}));
            return {
              success: false,
              error: errorData.error || 'Failed to end call'
            };
          }
        } else {
          // Simulate hanging up the call for demo
          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            success: true,
            message: 'Demo call ended successfully'
          };
        }
      }

      // Server environment fallback (shouldn't be reached in browser)
      return {
        success: false,
        error: 'Server environment not supported in browser'
      };
    } catch (error) {
      console.error('Error hanging up call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Default Twilio configuration with the provided credentials
export const DEFAULT_TWILIO_CONFIG: TwilioConfig = {
  accountSid: 'AC64208c7087a03b475ea7fa9337b692f8',
  authToken: '587e27a4553570edb09656c15a03d0e8',
  phoneNumber: '+17077433838',
  recordCalls: true,
  callTimeout: 30
};

// Create a default Twilio service instance
export const defaultTwilioService = new TwilioService(DEFAULT_TWILIO_CONFIG);
