import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Phone, Brain, Mic, Volume2, Settings, Eye, EyeOff, Globe, Star, Check } from 'lucide-react';
import {
  WorkflowConfig,
  TwilioConfig,
  LLMConfig,
  VoiceConfig,
  TranscriptionConfig,
  GlobalSettings,
  LLMProvider,
  VoiceProvider,
  TranscriptionProvider,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_OPENAI_CONFIG,
  LLM_MODELS,
  LanguageConfig,
  DEFAULT_LANGUAGE_CONFIG
} from '../../../types/workflowConfig';
import { validateRequiredFields } from '../../../utils/configValidation';
import PerformanceOptimizationPanel, { PerformanceConfig } from './PerformanceOptimizationPanel';
import { getEnvConfig } from '../../../utils/envConfig';

// Simple language options for the language selector
const SIMPLE_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English (United States)', flag: '🇺🇸' },
  { code: 'zh-HK', name: 'Cantonese (Hong Kong)', nativeName: '廣東話 (香港)', flag: '🇭🇰', special: true },
  { code: 'zh-MO', name: 'Cantonese (Macau)', nativeName: '廣東話 (澳門)', flag: '🇲🇴', special: true },
  { code: 'zh-CN', name: 'Mandarin (Simplified)', nativeName: '普通话 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Mandarin (Traditional)', nativeName: '國語 (繁體)', flag: '🇹🇼' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'Arabic (Saudi)', nativeName: 'العربية (السعودية)', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' }
];

interface WorkflowSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WorkflowConfig) => void;
  initialConfig?: Partial<WorkflowConfig>;
}

const WorkflowSetupModal: React.FC<WorkflowSetupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [workflowName, setWorkflowName] = useState(initialConfig?.name || '');
  const [description, setDescription] = useState(initialConfig?.description || '');

  // Get environment configuration
  const envConfig = getEnvConfig();

  // Helper function to check if a value is a placeholder
  const isPlaceholder = (value: string | undefined): boolean => {
    if (!value) return true;
    return value.includes('YOUR_') || value.includes('your_') || value.includes('_here');
  };

  // Twilio Configuration - ignore placeholder values from saved workflows
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: !isPlaceholder(initialConfig?.twilio?.accountSid)
      ? initialConfig!.twilio!.accountSid
      : (envConfig.twilio.accountSid || ''),
    authToken: !isPlaceholder(initialConfig?.twilio?.authToken)
      ? initialConfig!.twilio!.authToken
      : (envConfig.twilio.authToken || ''),
    phoneNumber: !isPlaceholder(initialConfig?.twilio?.phoneNumber)
      ? initialConfig!.twilio!.phoneNumber
      : (envConfig.twilio.phoneNumber || ''),
    webhookUrl: initialConfig?.twilio?.webhookUrl || '',
    recordCalls: initialConfig?.twilio?.recordCalls ?? true,
    callTimeout: initialConfig?.twilio?.callTimeout || 300
  });

  // LLM Configuration
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(
    initialConfig?.llm?.provider || LLMProvider.AZURE_OPENAI
  );
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: llmProvider,
    openAI: {
      apiKey: initialConfig?.llm?.openAI?.apiKey || '',
      model: initialConfig?.llm?.openAI?.model || DEFAULT_OPENAI_CONFIG.model!,
      temperature: initialConfig?.llm?.openAI?.temperature || DEFAULT_OPENAI_CONFIG.temperature,
      maxTokens: initialConfig?.llm?.openAI?.maxTokens || DEFAULT_OPENAI_CONFIG.maxTokens,
      systemPrompt: initialConfig?.llm?.openAI?.systemPrompt || DEFAULT_OPENAI_CONFIG.systemPrompt
    },
    azure: {
      apiKey: initialConfig?.llm?.azure?.apiKey || envConfig.azureOpenAI.apiKey || '',
      endpoint: initialConfig?.llm?.azure?.endpoint || envConfig.azureOpenAI.endpoint || '',
      deploymentName: initialConfig?.llm?.azure?.deploymentName || envConfig.azureOpenAI.deploymentName,
      model: initialConfig?.llm?.azure?.model || envConfig.azureOpenAI.model,
      temperature: initialConfig?.llm?.azure?.temperature || 0.7,
      maxTokens: initialConfig?.llm?.azure?.maxTokens || 150,
      apiVersion: initialConfig?.llm?.azure?.apiVersion || '2024-02-15-preview'
    }
  });

  // Voice Configuration - ConversationRelay Only
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(
    VoiceProvider.CONVERSATION_RELAY
  );
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    provider: VoiceProvider.CONVERSATION_RELAY,
    language: initialConfig?.voice?.language || 'en-US'
  });

  // Transcription Configuration - ConversationRelay Only
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>(
    TranscriptionProvider.CONVERSATION_RELAY
  );
  const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig>({
    provider: TranscriptionProvider.CONVERSATION_RELAY,
    language: initialConfig?.transcription?.language || 'en-US'
  });

  // Global Settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    ...DEFAULT_GLOBAL_SETTINGS,
    ...initialConfig?.globalSettings
  });

  // Language Configuration
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    initialConfig?.globalSettings?.defaultLanguage || DEFAULT_GLOBAL_SETTINGS.defaultLanguage
  );
  const [languageConfig, setLanguageConfig] = useState<LanguageConfig>(
    initialConfig?.globalSettings?.languageConfig || DEFAULT_LANGUAGE_CONFIG
  );

  // Performance Configuration
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig>({
    targetLatency: 300,
    maxLatency: 500,
    qualityThreshold: 0.85,
    cacheEnabled: true,
    languageOptimization: true,
    failoverEnabled: true,
    monitoring: {
      enabled: true,
      metricsInterval: 30000,
      alertThresholds: {
        latency: 400,
        errorRate: 0.05,
        cacheHitRate: 0.3
      }
    }
  });

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Track if we've already loaded the initial config to prevent overwriting user changes
  const [hasLoadedInitialConfig, setHasLoadedInitialConfig] = useState(false);

  // Update state when modal opens with initialConfig (only once per modal opening)
  useEffect(() => {
    if (isOpen && initialConfig && !hasLoadedInitialConfig) {
      console.log('Loading initial workflow config:', initialConfig.name);
      console.log('LLM Provider in config:', initialConfig.llm?.provider);
      console.log('Azure config:', initialConfig.llm?.azure);
      console.log('Full LLM config:', initialConfig.llm);
      setHasLoadedInitialConfig(true);

      // Update basic info
      setWorkflowName(initialConfig.name || '');
      setDescription(initialConfig.description || '');

      // Update Twilio config
      setTwilioConfig({
        accountSid: !isPlaceholder(initialConfig.twilio?.accountSid)
          ? initialConfig.twilio!.accountSid
          : (envConfig.twilio.accountSid || ''),
        authToken: !isPlaceholder(initialConfig.twilio?.authToken)
          ? initialConfig.twilio!.authToken
          : (envConfig.twilio.authToken || ''),
        phoneNumber: !isPlaceholder(initialConfig.twilio?.phoneNumber)
          ? initialConfig.twilio!.phoneNumber
          : (envConfig.twilio.phoneNumber || ''),
        webhookUrl: initialConfig.twilio?.webhookUrl || '',
        recordCalls: initialConfig.twilio?.recordCalls ?? true,
        callTimeout: initialConfig.twilio?.callTimeout || 300
      });

      // Update LLM provider and config
      const provider = initialConfig.llm?.provider || LLMProvider.AZURE_OPENAI;
      setLlmProvider(provider);
      setLlmConfig({
        provider: provider,
        openAI: {
          apiKey: initialConfig.llm?.openAI?.apiKey || '',
          model: initialConfig.llm?.openAI?.model || DEFAULT_OPENAI_CONFIG.model!,
          temperature: initialConfig.llm?.openAI?.temperature || DEFAULT_OPENAI_CONFIG.temperature,
          maxTokens: initialConfig.llm?.openAI?.maxTokens || DEFAULT_OPENAI_CONFIG.maxTokens,
          systemPrompt: initialConfig.llm?.openAI?.systemPrompt || DEFAULT_OPENAI_CONFIG.systemPrompt
        },
        azure: {
          apiKey: initialConfig.llm?.azure?.apiKey || envConfig.azureOpenAI.apiKey || '',
          endpoint: initialConfig.llm?.azure?.endpoint || envConfig.azureOpenAI.endpoint || '',
          deploymentName: initialConfig.llm?.azure?.deploymentName || envConfig.azureOpenAI.deploymentName,
          model: initialConfig.llm?.azure?.model || envConfig.azureOpenAI.model,
          temperature: initialConfig.llm?.azure?.temperature || 0.7,
          maxTokens: initialConfig.llm?.azure?.maxTokens || 4000,
          systemPrompt: initialConfig.llm?.azure?.systemPrompt || 'You are a helpful AI assistant.',
          apiVersion: initialConfig.llm?.azure?.apiVersion || '2024-02-15-preview'
        }
      });

      // Update voice provider and config - ConversationRelay Only
      setVoiceProvider(VoiceProvider.CONVERSATION_RELAY);
      setVoiceConfig({
        provider: VoiceProvider.CONVERSATION_RELAY,
        language: initialConfig.voice?.language || 'en-US'
      });

      // Update transcription provider and config - ConversationRelay Only
      setTranscriptionProvider(TranscriptionProvider.CONVERSATION_RELAY);
      setTranscriptionConfig({
        provider: TranscriptionProvider.CONVERSATION_RELAY,
        language: initialConfig.transcription?.language || 'en-US'
      });

      // Update global settings (preserve existing properties)
      setGlobalSettings(prev => ({
        ...prev,
        defaultLanguage: initialConfig.globalSettings?.defaultLanguage || DEFAULT_GLOBAL_SETTINGS.defaultLanguage,
        timezone: initialConfig.globalSettings?.timezone || DEFAULT_GLOBAL_SETTINGS.timezone,
        languageConfig: initialConfig.globalSettings?.languageConfig || DEFAULT_LANGUAGE_CONFIG
      }));

      // Update selected language
      setSelectedLanguage(initialConfig.globalSettings?.defaultLanguage || DEFAULT_GLOBAL_SETTINGS.defaultLanguage);

      // Clear validation errors when loading existing config
      setValidationErrors([]);
    } else if (isOpen && !initialConfig && !hasLoadedInitialConfig) {
      console.log('Creating new workflow - resetting to defaults');
      setHasLoadedInitialConfig(true);
      // Reset to defaults when creating new workflow
      setWorkflowName('');
      setDescription('');
      setValidationErrors([]);
    }
  }, [isOpen, initialConfig, envConfig, isPlaceholder, hasLoadedInitialConfig]);

  // Reset the loading flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedInitialConfig(false);
    }
  }, [isOpen]);

  // Language change handlers
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setGlobalSettings({
      ...globalSettings,
      defaultLanguage: language
    });
  };

  const handleLanguageConfigChange = (config: LanguageConfig) => {
    setLanguageConfig(config);
    setGlobalSettings({
      ...globalSettings,
      languageConfig: config
    });
  };

  const handlePerformanceConfigChange = (config: PerformanceConfig) => {
    setPerformanceConfig(config);
  };

  const handleSave = () => {
    const config: WorkflowConfig = {
      name: workflowName,
      description,
      twilio: twilioConfig,
      llm: llmConfig,
      voice: voiceConfig,
      transcription: transcriptionConfig,
      globalSettings,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Validate the configuration
    const errors = validateRequiredFields(config);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSave(config);
  };

  const getValidationErrors = (): Array<{message: string, tab: string, field: string}> => {
    const errors: Array<{message: string, tab: string, field: string}> = [];

    // Basic validation
    if (!workflowName.trim()) {
      errors.push({message: 'Workflow name is required', tab: 'basic', field: 'workflowName'});
    }

    // Twilio validation
    if (!twilioConfig.accountSid.trim()) {
      errors.push({message: 'Twilio Account SID is required', tab: 'services', field: 'twilioAccountSid'});
    }
    if (!twilioConfig.authToken.trim()) {
      errors.push({message: 'Twilio Auth Token is required', tab: 'services', field: 'twilioAuthToken'});
    }
    if (!twilioConfig.phoneNumber.trim()) {
      errors.push({message: 'Twilio Phone Number is required', tab: 'services', field: 'twilioPhoneNumber'});
    }

    // LLM validation based on provider
    if (llmProvider === LLMProvider.AZURE_OPENAI) {
      if (!llmConfig.azure?.apiKey?.trim()) {
        errors.push({message: 'Azure OpenAI API Key is required', tab: 'services', field: 'azureApiKey'});
      }
      if (!llmConfig.azure?.endpoint?.trim()) {
        errors.push({message: 'Azure OpenAI Endpoint is required', tab: 'services', field: 'azureEndpoint'});
      }
      if (!llmConfig.azure?.deploymentName?.trim()) {
        errors.push({message: 'Azure Deployment Name is required', tab: 'services', field: 'azureDeployment'});
      }
    } else if (llmProvider === LLMProvider.OPENAI) {
      if (!llmConfig.openAI?.apiKey?.trim()) {
        errors.push({message: 'OpenAI API Key is required', tab: 'services', field: 'openaiKey'});
      }
    }

    // Voice validation - ConversationRelay requires no API keys
    // ConversationRelay handles TTS/STT natively

    // Transcription validation - ConversationRelay requires no API keys
    // ConversationRelay handles STT natively

    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors().length === 0;
  };

  const getTabErrors = (tabName: string) => {
    return getValidationErrors().filter(error => error.tab === tabName);
  };

  const hasTabErrors = (tabName: string) => {
    return getTabErrors(tabName).length > 0;
  };

  const hasFieldError = (fieldName: string) => {
    return getValidationErrors().some(error => error.field === fieldName);
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="workflowName">Workflow Name *</Label>
        <Input
          id="workflowName"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="My Voice Agent Workflow"
          className={`mt-1 ${hasFieldError('workflowName') ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {hasFieldError('workflowName') && (
          <p className="text-sm text-red-600 mt-1">Workflow name is required</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this workflow does..."
          className="mt-1 min-h-[80px]"
        />
      </div>
    </div>
  );

  const renderTwilioConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Twilio Configuration
        </CardTitle>
        <CardDescription>
          Configure your Twilio account for making and receiving calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountSid">Account SID *</Label>
            <Input
              id="accountSid"
              type={showApiKeys ? 'text' : 'password'}
              value={twilioConfig.accountSid}
              onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="authToken">Auth Token *</Label>
            <Input
              id="authToken"
              type={showApiKeys ? 'text' : 'password'}
              value={twilioConfig.authToken}
              onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
              placeholder="your_auth_token"
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="phoneNumber">Twilio Phone Number *</Label>
          <Input
            id="phoneNumber"
            value={twilioConfig.phoneNumber}
            onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
            placeholder="+1234567890"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
          <Input
            id="webhookUrl"
            value={twilioConfig.webhookUrl}
            onChange={(e) => setTwilioConfig({ ...twilioConfig, webhookUrl: e.target.value })}
            placeholder="https://your-domain.com/webhook"
            className="mt-1"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Record Calls</Label>
            <p className="text-sm text-muted-foreground">
              Automatically record all calls for quality and training
            </p>
          </div>
          <Switch
            checked={twilioConfig.recordCalls}
            onCheckedChange={(checked) => setTwilioConfig({ ...twilioConfig, recordCalls: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderLLMConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Model Configuration
        </CardTitle>
        <CardDescription>
          Configure the AI model that will power your voice agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>AI Provider</Label>
          <Select
            value={llmProvider}
            onValueChange={(value) => {
              setLlmProvider(value as LLMProvider);
              setLlmConfig({ ...llmConfig, provider: value as LLMProvider });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LLMProvider.AZURE_OPENAI}>Azure OpenAI</SelectItem>
              <SelectItem value={LLMProvider.OPENAI}>OpenAI</SelectItem>
              <SelectItem value={LLMProvider.ANTHROPIC}>Anthropic (Claude)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {llmProvider === LLMProvider.OPENAI && (
          <>
            <div>
              <Label htmlFor="openaiKey">OpenAI API Key *</Label>
              <Input
                id="openaiKey"
                type={showApiKeys ? 'text' : 'password'}
                value={llmConfig.openAI?.apiKey || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  openAI: { ...llmConfig.openAI!, apiKey: e.target.value }
                })}
                placeholder="sk-..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Model</Label>
              <Select
                value={llmConfig.openAI?.model}
                onValueChange={(value) => setLlmConfig({
                  ...llmConfig,
                  openAI: { ...llmConfig.openAI!, model: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODELS[LLMProvider.OPENAI].map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={llmConfig.openAI?.systemPrompt || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  openAI: { ...llmConfig.openAI!, systemPrompt: e.target.value }
                })}
                placeholder="You are a helpful AI assistant..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </>
        )}

        {llmProvider === LLMProvider.AZURE_OPENAI && (
          <>
            <div>
              <Label htmlFor="azureApiKey">Azure OpenAI API Key *</Label>
              <Input
                id="azureApiKey"
                type={showApiKeys ? 'text' : 'password'}
                value={llmConfig.azure?.apiKey || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  azure: { ...llmConfig.azure!, apiKey: e.target.value }
                })}
                placeholder="Your Azure OpenAI API key"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="azureEndpoint">Azure OpenAI Endpoint *</Label>
              <Input
                id="azureEndpoint"
                type="text"
                value={llmConfig.azure?.endpoint || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  azure: { ...llmConfig.azure!, endpoint: e.target.value }
                })}
                placeholder="https://your-resource.openai.azure.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="azureDeployment">Deployment Name *</Label>
              <Input
                id="azureDeployment"
                type="text"
                value={llmConfig.azure?.deploymentName || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  azure: { ...llmConfig.azure!, deploymentName: e.target.value }
                })}
                placeholder="gpt-4o-mini"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Model</Label>
              <Select
                value={llmConfig.azure?.model}
                onValueChange={(value) => setLlmConfig({
                  ...llmConfig,
                  azure: { ...llmConfig.azure!, model: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="azureSystemPrompt">System Prompt</Label>
              <Textarea
                id="azureSystemPrompt"
                value={llmConfig.azure?.systemPrompt || ''}
                onChange={(e) => setLlmConfig({
                  ...llmConfig,
                  azure: { ...llmConfig.azure!, systemPrompt: e.target.value }
                })}
                placeholder="You are a helpful AI assistant..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderVoiceConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Voice Configuration
        </CardTitle>
        <CardDescription>
          Configure text-to-speech for your voice agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">🎤 ConversationRelay Native TTS</h4>
          <p className="text-sm text-green-700">
            Uses Twilio ConversationRelay's built-in text-to-speech system.
            This provides the best compatibility for real-time phone conversations
            without external TTS provider conflicts.
          </p>
          <div className="mt-2 text-xs text-green-600">
            ✅ No API keys required<br/>
            ✅ Optimized for phone calls<br/>
            ✅ No additional costs<br/>
            ✅ Best ConversationRelay compatibility<br/>
            ✅ Eliminates Error 64101
          </div>
        </div>

        <div>
          <Label>Language</Label>
          <Select
            value={voiceConfig.language || 'en-US'}
            onValueChange={(value) => {
              setVoiceConfig({ ...voiceConfig, language: value });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
              <SelectItem value="de-DE">German</SelectItem>
              <SelectItem value="it-IT">Italian</SelectItem>
              <SelectItem value="pt-BR">Portuguese</SelectItem>
              <SelectItem value="zh-CN">Chinese (Mandarin)</SelectItem>
              <SelectItem value="ja-JP">Japanese</SelectItem>
              <SelectItem value="ko-KR">Korean</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            ConversationRelay will automatically handle voice synthesis for the selected language
          </p>
        </div>

        {/* All third-party voice providers removed - ConversationRelay only */}

        {/* All third-party voice providers removed - ConversationRelay handles TTS natively */}
      </CardContent>
    </Card>
  );

  const renderTranscriptionConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Transcription Configuration
        </CardTitle>
        <CardDescription>
          Configure speech-to-text for understanding user input
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">🎙️ ConversationRelay Native STT</h4>
          <p className="text-sm text-blue-700">
            Uses Twilio ConversationRelay's built-in speech-to-text system.
            This provides the best compatibility for real-time phone conversations
            without external STT provider conflicts.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            ✅ No API keys required<br/>
            ✅ Optimized for phone calls<br/>
            ✅ No additional costs<br/>
            ✅ Best ConversationRelay compatibility<br/>
            ✅ Real-time transcription
          </div>
        </div>

        <div>
          <Label>Language</Label>
          <Select
            value={transcriptionConfig.language || 'en-US'}
            onValueChange={(value) => {
              setTranscriptionConfig({ ...transcriptionConfig, language: value });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
              <SelectItem value="de-DE">German</SelectItem>
              <SelectItem value="it-IT">Italian</SelectItem>
              <SelectItem value="pt-BR">Portuguese</SelectItem>
              <SelectItem value="zh-CN">Chinese (Mandarin)</SelectItem>
              <SelectItem value="ja-JP">Japanese</SelectItem>
              <SelectItem value="ko-KR">Korean</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            ConversationRelay will automatically handle speech recognition for the selected language
          </p>
        </div>
        
        {/* All third-party transcription providers removed - ConversationRelay handles STT natively */}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Configure your voice agent workflow with Twilio, AI models, and other services.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>All API keys are stored securely and encrypted</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center gap-2"
            >
              {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showApiKeys ? 'Hide' : 'Show'} API Keys
            </Button>
          </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="relative">
              Basic Info
              {hasTabErrors('basic') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="relative">
              Services
              {hasTabErrors('services') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="voice" className="relative">
              Voice & Speech
              {hasTabErrors('voice') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="relative">
              Settings
              {hasTabErrors('settings') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance" className="relative">
              Performance
              {hasTabErrors('performance') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {renderBasicInfo()}
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            {renderTwilioConfig()}
            {renderLLMConfig()}
          </TabsContent>

          <TabsContent value="voice" className="space-y-6 mt-6">
            {renderVoiceConfig()}
            {renderTranscriptionConfig()}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Language Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language Configuration
                </CardTitle>
                <CardDescription>
                  Select the primary language for your voice agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Selection */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Current Selection</Label>
                  <div className="mt-2 flex items-center space-x-3">
                    <span className="text-2xl">
                      {SIMPLE_LANGUAGES.find(lang => lang.code === selectedLanguage)?.flag}
                    </span>
                    <div>
                      <div className="font-medium">
                        {SIMPLE_LANGUAGES.find(lang => lang.code === selectedLanguage)?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {SIMPLE_LANGUAGES.find(lang => lang.code === selectedLanguage)?.nativeName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cantonese Special Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="w-4 h-4 text-orange-500" />
                    <Label className="font-medium">Cantonese (Optimized)</Label>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Special Support
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SIMPLE_LANGUAGES.filter(lang => lang.special).map(language => (
                      <Card
                        key={language.code}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedLanguage === language.code ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => handleLanguageChange(language.code)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{language.flag}</span>
                              <div>
                                <div className="font-medium">{language.name}</div>
                                <div className="text-sm text-gray-500">{language.nativeName}</div>
                                <div className="text-xs text-gray-400">{language.code}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <Star className="w-3 h-3 mr-1" />
                                Optimized
                              </Badge>
                              {selectedLanguage === language.code && (
                                <Check className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Language Dropdown */}
                <div>
                  <Label className="font-medium mb-2 block">All Languages</Label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SIMPLE_LANGUAGES.map(language => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex items-center space-x-2">
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                            {language.special && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-2">
                                Optimized
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange('en-US')}
                    className={selectedLanguage === 'en-US' ? 'bg-blue-50 border-blue-300' : ''}
                  >
                    🇺🇸 English
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange('zh-HK')}
                    className={selectedLanguage === 'zh-HK' ? 'bg-blue-50 border-blue-300' : ''}
                  >
                    🇭🇰 Cantonese (HK)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange('zh-CN')}
                    className={selectedLanguage === 'zh-CN' ? 'bg-blue-50 border-blue-300' : ''}
                  >
                    🇨🇳 Mandarin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange('es-ES')}
                    className={selectedLanguage === 'es-ES' ? 'bg-blue-50 border-blue-300' : ''}
                  >
                    🇪🇸 Spanish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange('ja-JP')}
                    className={selectedLanguage === 'ja-JP' ? 'bg-blue-50 border-blue-300' : ''}
                  >
                    🇯🇵 Japanese
                  </Button>
                </div>

                {/* Info */}
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Note:</strong> Cantonese languages have special optimizations for Hong Kong and Macau dialects,
                  including enhanced voice synthesis and speech recognition accuracy.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Global Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxCallDuration">Max Call Duration (minutes)</Label>
                    <Input
                      id="maxCallDuration"
                      type="number"
                      value={globalSettings.maxCallDuration}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        maxCallDuration: parseInt(e.target.value) || 30
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="silenceTimeout">Silence Timeout (seconds)</Label>
                    <Input
                      id="silenceTimeout"
                      type="number"
                      value={globalSettings.silenceTimeout}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        silenceTimeout: parseInt(e.target.value) || 10
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Conversation Summary</Label>
                      <p className="text-sm text-muted-foreground">Generate AI summaries of conversations</p>
                    </div>
                    <Switch
                      checked={globalSettings.conversationSummary}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        conversationSummary: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Interruption Handling</Label>
                      <p className="text-sm text-muted-foreground">Allow users to interrupt the AI while speaking</p>
                    </div>
                    <Switch
                      checked={globalSettings.interruptionHandling}
                      onCheckedChange={(checked) => setGlobalSettings({
                        ...globalSettings,
                        interruptionHandling: checked
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <PerformanceOptimizationPanel
              workflowConfig={{
                name: workflowName || 'Workflow',
                twilio: twilioConfig,
                llm: llmConfig,
                voice: voiceConfig,
                transcription: transcriptionConfig,
                globalSettings: globalSettings
              }}
              onConfigChange={handlePerformanceConfigChange}
              isEnabled={true}
            />
          </TabsContent>
        </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            {!isFormValid() && (
              <div className="flex flex-col gap-1 text-sm text-red-600 max-w-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Missing required fields:</span>
                </div>
                <div className="ml-6 space-y-1">
                  {getValidationErrors().slice(0, 3).map((error, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>•</span>
                      <span>{error.message}</span>
                      <button
                        type="button"
                        onClick={() => setCurrentTab(error.tab)}
                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        Go to {error.tab === 'basic' ? 'Basic Info' :
                               error.tab === 'services' ? 'Services' :
                               error.tab === 'voice' ? 'Voice & Speech' :
                               error.tab === 'settings' ? 'Settings' :
                               error.tab === 'performance' ? 'Performance' : error.tab}
                      </button>
                    </div>
                  ))}
                  {getValidationErrors().length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... and {getValidationErrors().length - 3} more fields
                    </div>
                  )}
                </div>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors[0]}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid()}>
              {initialConfig ? 'Update Workflow' : 'Create Workflow'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

};

export default WorkflowSetupModal;
