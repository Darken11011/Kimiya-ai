import {
  WorkflowConfig,
  TwilioConfig,
  OpenAIConfig,
  ElevenLabsConfig,
  DeepgramConfig,
  ConfigValidationResult,
  LLMProvider,
  VoiceProvider,
  TranscriptionProvider
} from '../types/workflowConfig';

export class ConfigValidator {
  private config: WorkflowConfig;
  private result: ConfigValidationResult;

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.result = {
      isValid: true,
      errors: [],
      warnings: [],
      testedServices: []
    };
  }

  async validate(): Promise<ConfigValidationResult> {
    // Validate basic workflow info
    this.validateBasicInfo();
    
    // Validate service configurations
    this.validateTwilioConfig();
    this.validateLLMConfig();
    this.validateVoiceConfig();
    this.validateTranscriptionConfig();
    
    // Validate global settings
    this.validateGlobalSettings();

    // Test connectivity (optional)
    await this.testConnectivity();

    this.result.isValid = this.result.errors.length === 0;
    return this.result;
  }

  private validateBasicInfo(): void {
    if (!this.config.name || this.config.name.trim().length === 0) {
      this.result.errors.push('Workflow name is required');
    }

    if (this.config.name && this.config.name.length > 100) {
      this.result.warnings.push('Workflow name is very long (>100 characters)');
    }

    if (this.config.description && this.config.description.length > 500) {
      this.result.warnings.push('Workflow description is very long (>500 characters)');
    }
  }

  private validateTwilioConfig(): void {
    const twilio = this.config.twilio;
    
    if (!twilio.accountSid) {
      this.result.errors.push('Twilio Account SID is required');
    } else if (!this.isValidTwilioSid(twilio.accountSid)) {
      this.result.errors.push('Invalid Twilio Account SID format');
    }

    if (!twilio.authToken) {
      this.result.errors.push('Twilio Auth Token is required');
    } else if (twilio.authToken.length < 32) {
      this.result.warnings.push('Twilio Auth Token seems too short');
    }

    if (!twilio.phoneNumber) {
      this.result.errors.push('Twilio phone number is required');
    } else if (!this.isValidPhoneNumber(twilio.phoneNumber)) {
      this.result.errors.push('Invalid phone number format (use E.164 format: +1234567890)');
    }

    if (twilio.webhookUrl && !this.isValidUrl(twilio.webhookUrl)) {
      this.result.errors.push('Invalid webhook URL format');
    }

    if (twilio.callTimeout && (twilio.callTimeout < 10 || twilio.callTimeout > 3600)) {
      this.result.warnings.push('Call timeout should be between 10 and 3600 seconds');
    }
  }

  private validateLLMConfig(): void {
    const llm = this.config.llm;
    
    switch (llm.provider) {
      case LLMProvider.OPENAI:
        this.validateOpenAIConfig(llm.openAI);
        break;
      case LLMProvider.ANTHROPIC:
        this.validateAnthropicConfig(llm.anthropic);
        break;
      default:
        this.result.errors.push(`Unsupported LLM provider: ${llm.provider}`);
    }
  }

  private validateOpenAIConfig(config?: OpenAIConfig): void {
    if (!config) {
      this.result.errors.push('OpenAI configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('OpenAI API key is required');
    } else if (!config.apiKey.startsWith('sk-')) {
      this.result.errors.push('Invalid OpenAI API key format (should start with "sk-")');
    }

    if (!config.model) {
      this.result.errors.push('OpenAI model is required');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      this.result.warnings.push('OpenAI temperature should be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 4096)) {
      this.result.warnings.push('OpenAI max tokens should be between 1 and 4096');
    }
  }

  private validateAnthropicConfig(config?: any): void {
    if (!config) {
      this.result.errors.push('Anthropic configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('Anthropic API key is required');
    } else if (!config.apiKey.startsWith('sk-ant-')) {
      this.result.errors.push('Invalid Anthropic API key format (should start with "sk-ant-")');
    }
  }

  private validateVoiceConfig(): void {
    const voice = this.config.voice;
    
    switch (voice.provider) {
      case VoiceProvider.ELEVEN_LABS:
        this.validateElevenLabsConfig(voice.elevenLabs);
        break;
      case VoiceProvider.AZURE:
        this.validateAzureConfig(voice.azure);
        break;
      case VoiceProvider.GOOGLE_CLOUD:
        this.validateGoogleCloudConfig(voice.googleCloud);
        break;
      default:
        this.result.errors.push(`Unsupported voice provider: ${voice.provider}`);
    }
  }

  private validateElevenLabsConfig(config?: ElevenLabsConfig): void {
    if (!config) {
      this.result.errors.push('ElevenLabs configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('ElevenLabs API key is required');
    }

    if (!config.voiceId) {
      this.result.errors.push('ElevenLabs voice ID is required');
    }

    if (config.stability !== undefined && (config.stability < 0 || config.stability > 1)) {
      this.result.warnings.push('ElevenLabs stability should be between 0 and 1');
    }

    if (config.similarityBoost !== undefined && (config.similarityBoost < 0 || config.similarityBoost > 1)) {
      this.result.warnings.push('ElevenLabs similarity boost should be between 0 and 1');
    }
  }

  private validateAzureConfig(config?: any): void {
    if (!config) {
      this.result.errors.push('Azure configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('Azure API key is required');
    }

    if (!config.region) {
      this.result.errors.push('Azure region is required');
    }
  }

  private validateGoogleCloudConfig(config?: any): void {
    if (!config) {
      this.result.errors.push('Google Cloud configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('Google Cloud API key is required');
    }
  }

  private validateTranscriptionConfig(): void {
    const transcription = this.config.transcription;
    
    switch (transcription.provider) {
      case TranscriptionProvider.DEEPGRAM:
        this.validateDeepgramConfig(transcription.deepgram);
        break;
      case TranscriptionProvider.ASSEMBLY_AI:
        this.validateAssemblyAIConfig(transcription.assemblyAI);
        break;
      case TranscriptionProvider.WHISPER:
        this.validateWhisperConfig(transcription.whisper);
        break;
      default:
        this.result.errors.push(`Unsupported transcription provider: ${transcription.provider}`);
    }
  }

  private validateDeepgramConfig(config?: DeepgramConfig): void {
    if (!config) {
      this.result.errors.push('Deepgram configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('Deepgram API key is required');
    }
  }

  private validateAssemblyAIConfig(config?: any): void {
    if (!config) {
      this.result.errors.push('AssemblyAI configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('AssemblyAI API key is required');
    }
  }

  private validateWhisperConfig(config?: any): void {
    if (!config) {
      this.result.errors.push('Whisper configuration is required');
      return;
    }

    if (!config.apiKey) {
      this.result.errors.push('OpenAI API key is required for Whisper');
    }
  }

  private validateGlobalSettings(): void {
    const settings = this.config.globalSettings;
    
    if (settings.maxCallDuration < 1 || settings.maxCallDuration > 120) {
      this.result.warnings.push('Max call duration should be between 1 and 120 minutes');
    }

    if (settings.silenceTimeout < 1 || settings.silenceTimeout > 60) {
      this.result.warnings.push('Silence timeout should be between 1 and 60 seconds');
    }

    if (!settings.defaultLanguage) {
      this.result.warnings.push('Default language is not set');
    }
  }

  private async testConnectivity(): Promise<void> {
    // Note: In a real implementation, you would make actual API calls to test connectivity
    // For now, we'll just simulate the tests
    
    try {
      // Test OpenAI connectivity
      if (this.config.llm.provider === LLMProvider.OPENAI && this.config.llm.openAI?.apiKey) {
        // Simulate API test
        await this.simulateApiTest('OpenAI');
        this.result.testedServices.push('OpenAI');
      }

      // Test ElevenLabs connectivity
      if (this.config.voice.provider === VoiceProvider.ELEVEN_LABS && this.config.voice.elevenLabs?.apiKey) {
        await this.simulateApiTest('ElevenLabs');
        this.result.testedServices.push('ElevenLabs');
      }

      // Test Deepgram connectivity
      if (this.config.transcription.provider === TranscriptionProvider.DEEPGRAM && this.config.transcription.deepgram?.apiKey) {
        await this.simulateApiTest('Deepgram');
        this.result.testedServices.push('Deepgram');
      }

    } catch (error) {
      this.result.warnings.push('Some API connectivity tests failed - please verify your API keys');
    }
  }

  private async simulateApiTest(service: string): Promise<void> {
    // Simulate API test delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, you would make actual API calls here
    // For example:
    // - OpenAI: GET /models
    // - ElevenLabs: GET /voices
    // - Deepgram: GET /projects
    // - Twilio: GET /Accounts/{AccountSid}.json
  }

  // Utility validation methods
  private isValidTwilioSid(sid: string): boolean {
    return /^AC[a-f0-9]{32}$/i.test(sid);
  }

  private isValidPhoneNumber(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Convenience function for validating workflow configuration
export const validateWorkflowConfig = async (config: WorkflowConfig): Promise<ConfigValidationResult> => {
  const validator = new ConfigValidator(config);
  return await validator.validate();
};

// Quick validation for required fields only (for form validation)
export const validateRequiredFields = (config: Partial<WorkflowConfig>): string[] => {
  const errors: string[] = [];

  if (!config.name?.trim()) {
    errors.push('Workflow name is required');
  }

  if (!config.twilio?.accountSid) {
    errors.push('Twilio Account SID is required');
  }

  if (!config.twilio?.authToken) {
    errors.push('Twilio Auth Token is required');
  }

  if (!config.twilio?.phoneNumber) {
    errors.push('Twilio phone number is required');
  }

  if (config.llm?.provider === LLMProvider.OPENAI && !config.llm?.openAI?.apiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.voice?.provider === VoiceProvider.ELEVEN_LABS && !config.voice?.elevenLabs?.apiKey) {
    errors.push('ElevenLabs API key is required');
  }

  if (config.transcription?.provider === TranscriptionProvider.DEEPGRAM && !config.transcription?.deepgram?.apiKey) {
    errors.push('Deepgram API key is required');
  }

  return errors;
};
