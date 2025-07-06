// Workflow Configuration Types

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Twilio phone number to use for calls
  webhookUrl?: string; // Optional webhook URL for call events
  recordCalls?: boolean;
  callTimeout?: number; // Call timeout in seconds
}

export interface OpenAIConfig {
  apiKey: string;
  model: string; // e.g., 'gpt-4', 'gpt-3.5-turbo'
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string; // e.g., 'claude-3-sonnet', 'claude-3-haiku'
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model?: string; // e.g., 'eleven_monolingual_v1'
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface AzureConfig {
  apiKey: string;
  region: string;
  voiceName: string; // e.g., 'en-US-JennyNeural'
  speechRate?: string;
  speechPitch?: string;
}

export interface GoogleCloudConfig {
  apiKey: string;
  projectId?: string;
  voiceName: string;
  languageCode: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface DeepgramConfig {
  apiKey: string;
  model?: string; // e.g., 'nova-2', 'enhanced'
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smartFormat?: boolean;
}

export interface AssemblyAIConfig {
  apiKey: string;
  languageCode?: string;
  punctuate?: boolean;
  formatText?: boolean;
  dualChannel?: boolean;
}

export interface WhisperConfig {
  apiKey: string; // OpenAI API key for Whisper
  model?: string; // e.g., 'whisper-1'
  language?: string;
  temperature?: number;
}

// Voice Provider Types
export enum VoiceProvider {
  ELEVEN_LABS = 'eleven_labs',
  AZURE = 'azure',
  GOOGLE_CLOUD = 'google_cloud',
  OPENAI_TTS = 'openai_tts'
}

// Transcription Provider Types
export enum TranscriptionProvider {
  DEEPGRAM = 'deepgram',
  ASSEMBLY_AI = 'assembly_ai',
  WHISPER = 'whisper',
  AZURE = 'azure',
  GOOGLE_CLOUD = 'google_cloud'
}

// LLM Provider Types
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai',
  GOOGLE_PALM = 'google_palm'
}

// Voice Configuration
export interface VoiceConfig {
  provider: VoiceProvider;
  elevenLabs?: ElevenLabsConfig;
  azure?: AzureConfig;
  googleCloud?: GoogleCloudConfig;
  openAI?: OpenAIConfig; // For OpenAI TTS
}

// Transcription Configuration
export interface TranscriptionConfig {
  provider: TranscriptionProvider;
  deepgram?: DeepgramConfig;
  assemblyAI?: AssemblyAIConfig;
  whisper?: WhisperConfig;
  azure?: AzureConfig;
  googleCloud?: GoogleCloudConfig;
}

// LLM Configuration
export interface LLMConfig {
  provider: LLMProvider;
  openAI?: OpenAIConfig;
  anthropic?: AnthropicConfig;
  azure?: AzureConfig;
  googlePalm?: GoogleCloudConfig;
}

// Global Workflow Settings
export interface GlobalSettings {
  defaultLanguage: string;
  timezone: string;
  callRecording: boolean;
  transcriptionEnabled: boolean;
  sentimentAnalysis: boolean;
  conversationSummary: boolean;
  maxCallDuration: number; // in minutes
  silenceTimeout: number; // in seconds
  interruptionHandling: boolean;
}

// Complete Workflow Configuration
export interface WorkflowConfig {
  id?: string;
  name: string;
  description?: string;
  
  // Core Services
  twilio: TwilioConfig;
  llm: LLMConfig;
  voice: VoiceConfig;
  transcription: TranscriptionConfig;
  
  // Global Settings
  globalSettings: GlobalSettings;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  version?: string;
}

// Configuration Validation Result
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  testedServices: string[];
}

// Default configurations
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultLanguage: 'en-US',
  timezone: 'UTC',
  callRecording: true,
  transcriptionEnabled: true,
  sentimentAnalysis: false,
  conversationSummary: true,
  maxCallDuration: 30,
  silenceTimeout: 10,
  interruptionHandling: true
};

export const DEFAULT_OPENAI_CONFIG: Partial<OpenAIConfig> = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful AI assistant. Be professional, friendly, and concise in your responses.'
};

export const DEFAULT_ELEVEN_LABS_CONFIG: Partial<ElevenLabsConfig> = {
  model: 'eleven_monolingual_v1',
  stability: 0.5,
  similarityBoost: 0.5,
  style: 0.0,
  useSpeakerBoost: true
};

export const DEFAULT_DEEPGRAM_CONFIG: Partial<DeepgramConfig> = {
  model: 'nova-2',
  language: 'en-US',
  punctuate: true,
  diarize: false,
  smartFormat: true
};

// Popular voice options
export const POPULAR_VOICES = {
  [VoiceProvider.ELEVEN_LABS]: [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Deep Male)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Soft Female)' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Confident Male)' },
    { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya (Young Female)' }
  ],
  [VoiceProvider.AZURE]: [
    { id: 'en-US-JennyNeural', name: 'Jenny (US Female)' },
    { id: 'en-US-GuyNeural', name: 'Guy (US Male)' },
    { id: 'en-US-AriaNeural', name: 'Aria (US Female)' },
    { id: 'en-US-DavisNeural', name: 'Davis (US Male)' }
  ],
  [VoiceProvider.GOOGLE_CLOUD]: [
    { id: 'en-US-Wavenet-D', name: 'Wavenet D (US Male)' },
    { id: 'en-US-Wavenet-F', name: 'Wavenet F (US Female)' },
    { id: 'en-US-Standard-B', name: 'Standard B (US Male)' },
    { id: 'en-US-Standard-C', name: 'Standard C (US Female)' }
  ]
};

// Model options
export const LLM_MODELS = {
  [LLMProvider.OPENAI]: [
    { id: 'gpt-4', name: 'GPT-4 (Most Capable)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Fast & Capable)' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fast & Affordable)' }
  ],
  [LLMProvider.ANTHROPIC]: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Most Capable)' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet (Balanced)' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast)' }
  ]
};
