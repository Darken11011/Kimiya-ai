
import { toast } from "sonner";

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const defaultAzureConfig: AzureOpenAIConfig = {
  endpoint: "https://innochattemp.openai.azure.com/openai/deployments/gpt4omini",
  apiKey: "f6d564a83af3498c9beb46d7d3e3da96",
  deploymentName: "gpt4omini",
  apiVersion: "2025-01-01-preview"
};

/**
 * Calls Azure OpenAI API with the provided messages
 */
export async function callAzureOpenAI(
  messages: ChatMessage[],
  config: AzureOpenAIConfig = defaultAzureConfig
): Promise<string> {
  try {
    // Format the URL according to Azure OpenAI API requirements
    const url = `${config.endpoint}/chat/completions?api-version=${config.apiVersion}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No response generated from Azure OpenAI");
    }
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    toast.error("Failed to get response from Azure OpenAI");
    return "Error: Could not get a response from the AI service.";
  }
}
