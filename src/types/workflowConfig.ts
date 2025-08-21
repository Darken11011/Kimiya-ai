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
  autoDetection: true,
  specialLanguages: {
    'zh-HK': {
      sttProvider: 'azure',
      ttsProvider: 'azure',
      voiceId: 'zh-HK-HiuGaaiNeural',
      optimizations: {
        dialectSupport: ['Hong Kong', 'Guangzhou', 'Macau'],
        accentAdaptation: true,
        contextualProcessing: true
      }
    },
    'zh-MO': {
      sttProvider: 'azure',
      ttsProvider: 'azure',
      voiceId: 'zh-HK-HiuMaanNeural',
      optimizations: {
        dialectSupport: ['Macau', 'Hong Kong'],
        accentAdaptation: true,
        contextualProcessing: true
      }
    },
    'zh-CN': {
      sttProvider: 'azure',
      ttsProvider: 'azure',
      voiceId: 'zh-CN-XiaoxiaoNeural'
    },
    'zh-TW': {
      sttProvider: 'azure',
      ttsProvider: 'azure',
      voiceId: 'zh-TW-HsiaoChenNeural'
    }
  }
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

// Language-specific voice options
export const LANGUAGE_VOICES = {
  // English voices
  'en-US': {
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
  },

  // Cantonese voices (Hong Kong)
  'zh-HK': {
    [VoiceProvider.AZURE]: [
      { id: 'zh-HK-HiuGaaiNeural', name: 'HiuGaai (Hong Kong Female)', recommended: true },
      { id: 'zh-HK-HiuMaanNeural', name: 'HiuMaan (Hong Kong Male)', recommended: true },
      { id: 'zh-HK-WanLungNeural', name: 'WanLung (Hong Kong Male)' }
    ],
    [VoiceProvider.GOOGLE_CLOUD]: [
      { id: 'yue-HK-Standard-A', name: 'Standard A (Hong Kong Female)' },
      { id: 'yue-HK-Standard-B', name: 'Standard B (Hong Kong Male)' },
      { id: 'yue-HK-Standard-C', name: 'Standard C (Hong Kong Female)' },
      { id: 'yue-HK-Standard-D', name: 'Standard D (Hong Kong Male)' }
    ]
  },

  // Cantonese voices (Macau)
  'zh-MO': {
    [VoiceProvider.AZURE]: [
      { id: 'zh-HK-HiuMaanNeural', name: 'HiuMaan (Macau Male)', recommended: true },
      { id: 'zh-HK-HiuGaaiNeural', name: 'HiuGaai (Macau Female)', recommended: true }
    ]
  },

  // Mandarin voices
  'zh-CN': {
    [VoiceProvider.AZURE]: [
      { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (Female)', recommended: true },
      { id: 'zh-CN-YunxiNeural', name: 'Yunxi (Male)', recommended: true },
      { id: 'zh-CN-YunyangNeural', name: 'Yunyang (Male)' },
      { id: 'zh-CN-XiaochenNeural', name: 'Xiaochen (Female)' }
    ],
    [VoiceProvider.GOOGLE_CLOUD]: [
      { id: 'cmn-CN-Wavenet-A', name: 'Wavenet A (Female)' },
      { id: 'cmn-CN-Wavenet-B', name: 'Wavenet B (Male)' },
      { id: 'cmn-CN-Wavenet-C', name: 'Wavenet C (Male)' },
      { id: 'cmn-CN-Wavenet-D', name: 'Wavenet D (Female)' }
    ]
  },

  // Spanish voices
  'es-ES': {
    [VoiceProvider.AZURE]: [
      { id: 'es-ES-ElviraNeural', name: 'Elvira (Spain Female)' },
      { id: 'es-ES-AlvaroNeural', name: 'Alvaro (Spain Male)' }
    ],
    [VoiceProvider.GOOGLE_CLOUD]: [
      { id: 'es-ES-Wavenet-B', name: 'Wavenet B (Spain Female)' },
      { id: 'es-ES-Wavenet-C', name: 'Wavenet C (Spain Male)' }
    ]
  },

  // French voices
  'fr-FR': {
    [VoiceProvider.AZURE]: [
      { id: 'fr-FR-DeniseNeural', name: 'Denise (France Female)' },
      { id: 'fr-FR-HenriNeural', name: 'Henri (France Male)' }
    ],
    [VoiceProvider.GOOGLE_CLOUD]: [
      { id: 'fr-FR-Wavenet-A', name: 'Wavenet A (France Female)' },
      { id: 'fr-FR-Wavenet-B', name: 'Wavenet B (France Male)' }
    ]
  },

  // Japanese voices
  'ja-JP': {
    [VoiceProvider.AZURE]: [
      { id: 'ja-JP-NanamiNeural', name: 'Nanami (Japan Female)' },
      { id: 'ja-JP-KeitaNeural', name: 'Keita (Japan Male)' }
    ],
    [VoiceProvider.GOOGLE_CLOUD]: [
      { id: 'ja-JP-Wavenet-A', name: 'Wavenet A (Japan Female)' },
      { id: 'ja-JP-Wavenet-C', name: 'Wavenet C (Japan Male)' }
    ]
  }
};

// Popular voice options (backward compatibility)
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

// Helper function to get voices for a specific language and provider
export const getVoicesForLanguage = (languageCode: string, provider: VoiceProvider) => {
  return LANGUAGE_VOICES[languageCode]?.[provider] || POPULAR_VOICES[provider] || [];
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
  specialLanguages?: {
    [key: string]: {
      sttProvider: 'azure' | 'google' | 'deepgram';
      ttsProvider: 'azure' | 'google' | 'elevenlabs';
      voiceId: string;
      optimizations?: {
        dialectSupport?: string[];
        accentAdaptation?: boolean;
        contextualProcessing?: boolean;
      };
    };
  };
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
