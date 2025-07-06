import React, { useState } from 'react';
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
import { AlertCircle, Phone, Brain, Mic, Volume2, Settings, Eye, EyeOff } from 'lucide-react';
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
  DEFAULT_ELEVEN_LABS_CONFIG,
  DEFAULT_DEEPGRAM_CONFIG,
  LLM_MODELS,
  POPULAR_VOICES
} from '../../../types/workflowConfig';
import { validateRequiredFields } from '../../../utils/configValidation';

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
  
  // Twilio Configuration
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: initialConfig?.twilio?.accountSid || '',
    authToken: initialConfig?.twilio?.authToken || '',
    phoneNumber: initialConfig?.twilio?.phoneNumber || '',
    webhookUrl: initialConfig?.twilio?.webhookUrl || '',
    recordCalls: initialConfig?.twilio?.recordCalls ?? true,
    callTimeout: initialConfig?.twilio?.callTimeout || 300
  });

  // LLM Configuration
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(
    initialConfig?.llm?.provider || LLMProvider.OPENAI
  );
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: llmProvider,
    openAI: {
      apiKey: initialConfig?.llm?.openAI?.apiKey || '',
      model: initialConfig?.llm?.openAI?.model || DEFAULT_OPENAI_CONFIG.model!,
      temperature: initialConfig?.llm?.openAI?.temperature || DEFAULT_OPENAI_CONFIG.temperature,
      maxTokens: initialConfig?.llm?.openAI?.maxTokens || DEFAULT_OPENAI_CONFIG.maxTokens,
      systemPrompt: initialConfig?.llm?.openAI?.systemPrompt || DEFAULT_OPENAI_CONFIG.systemPrompt
    }
  });

  // Voice Configuration
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(
    initialConfig?.voice?.provider || VoiceProvider.ELEVEN_LABS
  );
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    provider: voiceProvider,
    elevenLabs: {
      apiKey: initialConfig?.voice?.elevenLabs?.apiKey || '',
      voiceId: initialConfig?.voice?.elevenLabs?.voiceId || 'pNInz6obpgDQGcFmaJgB',
      ...DEFAULT_ELEVEN_LABS_CONFIG
    }
  });

  // Transcription Configuration
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>(
    initialConfig?.transcription?.provider || TranscriptionProvider.DEEPGRAM
  );
  const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig>({
    provider: transcriptionProvider,
    deepgram: {
      apiKey: initialConfig?.transcription?.deepgram?.apiKey || '',
      ...DEFAULT_DEEPGRAM_CONFIG
    }
  });

  // Global Settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    ...DEFAULT_GLOBAL_SETTINGS,
    ...initialConfig?.globalSettings
  });

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const isFormValid = () => {
    return (
      workflowName.trim() !== '' &&
      twilioConfig.accountSid !== '' &&
      twilioConfig.authToken !== '' &&
      twilioConfig.phoneNumber !== '' &&
      llmConfig.openAI?.apiKey !== '' &&
      voiceConfig.elevenLabs?.apiKey !== '' &&
      transcriptionConfig.deepgram?.apiKey !== ''
    );
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
          className="mt-1"
        />
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
        <div>
          <Label>Voice Provider</Label>
          <Select
            value={voiceProvider}
            onValueChange={(value) => {
              setVoiceProvider(value as VoiceProvider);
              setVoiceConfig({ ...voiceConfig, provider: value as VoiceProvider });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VoiceProvider.ELEVEN_LABS}>ElevenLabs</SelectItem>
              <SelectItem value={VoiceProvider.AZURE}>Azure Speech</SelectItem>
              <SelectItem value={VoiceProvider.GOOGLE_CLOUD}>Google Cloud</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {voiceProvider === VoiceProvider.ELEVEN_LABS && (
          <>
            <div>
              <Label htmlFor="elevenLabsKey">ElevenLabs API Key *</Label>
              <Input
                id="elevenLabsKey"
                type={showApiKeys ? 'text' : 'password'}
                value={voiceConfig.elevenLabs?.apiKey || ''}
                onChange={(e) => setVoiceConfig({
                  ...voiceConfig,
                  elevenLabs: { ...voiceConfig.elevenLabs!, apiKey: e.target.value }
                })}
                placeholder="your_elevenlabs_api_key"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Voice</Label>
              <Select
                value={voiceConfig.elevenLabs?.voiceId}
                onValueChange={(value) => setVoiceConfig({
                  ...voiceConfig,
                  elevenLabs: { ...voiceConfig.elevenLabs!, voiceId: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_VOICES[VoiceProvider.ELEVEN_LABS].map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
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
        <div>
          <Label>Transcription Provider</Label>
          <Select
            value={transcriptionProvider}
            onValueChange={(value) => {
              setTranscriptionProvider(value as TranscriptionProvider);
              setTranscriptionConfig({ ...transcriptionConfig, provider: value as TranscriptionProvider });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TranscriptionProvider.DEEPGRAM}>Deepgram</SelectItem>
              <SelectItem value={TranscriptionProvider.ASSEMBLY_AI}>AssemblyAI</SelectItem>
              <SelectItem value={TranscriptionProvider.WHISPER}>OpenAI Whisper</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {transcriptionProvider === TranscriptionProvider.DEEPGRAM && (
          <div>
            <Label htmlFor="deepgramKey">Deepgram API Key *</Label>
            <Input
              id="deepgramKey"
              type={showApiKeys ? 'text' : 'password'}
              value={transcriptionConfig.deepgram?.apiKey || ''}
              onChange={(e) => setTranscriptionConfig({
                ...transcriptionConfig,
                deepgram: { ...transcriptionConfig.deepgram!, apiKey: e.target.value }
              })}
              placeholder="your_deepgram_api_key"
              className="mt-1"
            />
          </div>
        )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="voice">Voice & Speech</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
        </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            {(validationErrors.length > 0 || !isFormValid()) && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {validationErrors.length > 0
                    ? validationErrors[0]
                    : 'Please fill in all required fields'
                  }
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid()}>
              Create Workflow
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

};

export default WorkflowSetupModal;
