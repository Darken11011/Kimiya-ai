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

export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string; // e.g., 'https://your-resource.openai.azure.com'
  deploymentName: string; // e.g., 'gpt-4o-mini'
  model: string; // e.g., 'gpt-4o-mini'
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiVersion?: string; // e.g., '2024-02-15-preview'
}

export interface AnthropicConfig {
  apiKey: string;
  model: string; // e.g., 'claude-3-sonnet', 'claude-3-haiku'
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// Removed all third-party voice/transcription provider configurations
// ConversationRelay handles TTS/STT natively without external API keys

// Voice Provider Types - ConversationRelay Only
export enum VoiceProvider {
  CONVERSATION_RELAY = 'conversation_relay'
}

// Transcription Provider Types - ConversationRelay Only
export enum TranscriptionProvider {
  CONVERSATION_RELAY = 'conversation_relay'
}

// LLM Provider Types
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai',
  GOOGLE_PALM = 'google_palm'
}

// Voice Configuration - ConversationRelay Only
export interface VoiceConfig {
  provider: VoiceProvider;
  language?: string; // Language code (e.g., 'en-US')
}

// Transcription Configuration - ConversationRelay Only
export interface TranscriptionConfig {
  provider: TranscriptionProvider;
  language?: string; // Language code (e.g., 'en-US')
}

// LLM Configuration
export interface LLMConfig {
  provider: LLMProvider;
  openAI?: OpenAIConfig;
  anthropic?: AnthropicConfig;
  azure?: AzureOpenAIConfig;
  googlePalm?: GoogleCloudConfig;
}

// Global Workflow Settings
export interface GlobalSettings {
  defaultLanguage: string;
  languageConfig?: LanguageConfig;
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

// Default language configurations for different providers
export const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  primary: 'en-US',
  fallback: ['en-GB', 'en-AU'],
  autoDetection: true
  // ConversationRelay handles all language-specific optimizations automatically
};

// Default configurations
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultLanguage: 'en-US',
  languageConfig: DEFAULT_LANGUAGE_CONFIG,
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

// Removed all third-party provider default configurations
// ConversationRelay uses built-in defaults

// Removed language-specific voice options
// ConversationRelay handles voice selection automatically
export const LANGUAGE_VOICES = {
  // ConversationRelay handles voice selection automatically
  // No third-party voice configurations needed
};

// Removed popular voice options - ConversationRelay handles voices automatically

// Helper function simplified for ConversationRelay
export const getVoicesForLanguage = (languageCode: string, provider: VoiceProvider) => {
  // ConversationRelay doesn't require voice selection
  return [];
};

// Language Support Types
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
  flag?: string;
  rtl?: boolean;
  specialOptimizations?: {
    dialectSupport?: string[];
    accentAdaptation?: boolean;
    contextualProcessing?: boolean;
  };
}

export interface LanguageConfig {
  primary: string;
  fallback?: string[];
  autoDetection?: boolean;
  // ConversationRelay handles language-specific optimizations automatically
}

// Comprehensive language support with Cantonese specialization
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // English variants
  { code: 'en-US', name: 'English (US)', nativeName: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (AU)', nativeName: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (CA)', nativeName: 'English (Canada)', flag: '🇨🇦' },

  // Chinese variants with Cantonese specialization
  {
    code: 'zh-HK',
    name: 'Cantonese (Hong Kong)',
    nativeName: '廣東話 (香港)',
    region: 'Hong Kong',
    flag: '🇭🇰',
    specialOptimizations: {
      dialectSupport: ['Hong Kong', 'Guangzhou', 'Macau'],
      accentAdaptation: true,
      contextualProcessing: true
    }
  },
  {
    code: 'zh-MO',
    name: 'Cantonese (Macau)',
    nativeName: '廣東話 (澳門)',
    region: 'Macau',
    flag: '🇲🇴',
    specialOptimizations: {
      dialectSupport: ['Macau', 'Hong Kong'],
      accentAdaptation: true,
      contextualProcessing: true
    }
  },
  { code: 'zh-CN', name: 'Mandarin (Simplified)', nativeName: '普通话 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Mandarin (Traditional)', nativeName: '國語 (繁體)', flag: '🇹🇼' },

  // Major European languages
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', flag: '🇲🇽' },
  { code: 'es-US', name: 'Spanish (US)', nativeName: 'Español (Estados Unidos)', flag: '🇺🇸' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', flag: '🇨🇦' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },

  // Asian languages
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },

  // Middle Eastern languages
  { code: 'ar-SA', name: 'Arabic (Saudi)', nativeName: 'العربية (السعودية)', flag: '🇸🇦', rtl: true },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', flag: '🇪🇬', rtl: true },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },

  // Nordic languages
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },

  // Other European languages
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },

  // Additional languages
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl-PH', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' }
];

// Language categories for better organization
export const LANGUAGE_CATEGORIES = {
  POPULAR: 'Popular Languages',
  CHINESE: 'Chinese Languages',
  EUROPEAN: 'European Languages',
  ASIAN: 'Asian Languages',
  MIDDLE_EASTERN: 'Middle Eastern Languages',
  NORDIC: 'Nordic Languages',
  OTHER: 'Other Languages'
} as const;

// Categorized languages for UI organization
export const CATEGORIZED_LANGUAGES = {
  [LANGUAGE_CATEGORIES.POPULAR]: [
    'en-US', 'zh-HK', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR'
  ],
  [LANGUAGE_CATEGORIES.CHINESE]: [
    'zh-HK', 'zh-MO', 'zh-CN', 'zh-TW'
  ],
  [LANGUAGE_CATEGORIES.EUROPEAN]: [
    'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'de-DE',
    'it-IT', 'pt-BR', 'pt-PT', 'ru-RU', 'nl-NL', 'pl-PL', 'cs-CZ', 'hu-HU',
    'ro-RO', 'bg-BG', 'hr-HR', 'sk-SK', 'sl-SI', 'et-EE', 'lv-LV', 'lt-LT',
    'tr-TR', 'el-GR', 'uk-UA'
  ],
  [LANGUAGE_CATEGORIES.ASIAN]: [
    'ja-JP', 'ko-KR', 'th-TH', 'vi-VN', 'hi-IN', 'id-ID', 'ms-MY', 'tl-PH'
  ],
  [LANGUAGE_CATEGORIES.MIDDLE_EASTERN]: [
    'ar-SA', 'ar-EG', 'he-IL'
  ],
  [LANGUAGE_CATEGORIES.NORDIC]: [
    'sv-SE', 'no-NO', 'da-DK', 'fi-FI'
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
