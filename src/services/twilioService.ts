
import { toast } from "sonner";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// Default Twilio configuration with the provided credentials
export const defaultTwilioConfig: TwilioConfig = {
  accountSid: "AC4aea4e1116bb6c5991749aaa0323073d",
  authToken: "6bef332334903b42fd16715db3dd53d8",
  fromNumber: "+18576785216"
};

interface CallResponse {
  success: boolean;
  callSid?: string;
  error?: string;
}

/**
 * Initiates a phone call using Twilio API
 * @param toNumber The phone number to call
 * @param workflowId The ID of the workflow to execute during the call
 * @param config Optional Twilio configuration
 */
export async function initiateCall(
  toNumber: string,
  workflowId: string,
  config: TwilioConfig = defaultTwilioConfig
): Promise<CallResponse> {
  try {
    // In a real implementation, we would call the Twilio API directly
    // For now, we'll simulate the API call
    console.log(`Initiating call to ${toNumber} using workflow ${workflowId}`);
    console.log(`Using Twilio account: ${config.accountSid}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, create a fake call SID
    const callSid = `CA${Math.random().toString(36).substring(2, 15)}`;
    
    toast.success(`Call initiated to ${toNumber}`);
    
    return {
      success: true,
      callSid
    };
  } catch (error) {
    console.error("Error initiating Twilio call:", error);
    toast.error("Failed to initiate call");
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Updates Twilio configuration
 * @param config New Twilio configuration
 */
export function updateTwilioConfig(config: Partial<TwilioConfig>): TwilioConfig {
  const updatedConfig = {
    ...defaultTwilioConfig,
    ...config
  };
  
  // In a real app, you might want to save this to localStorage or your backend
  console.log("Updated Twilio config:", updatedConfig);
  
  return updatedConfig;
}
