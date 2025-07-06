# Workflow Setup System

This document explains the new comprehensive workflow setup system that collects all necessary API keys and configuration details when creating a new workflow.

## Overview

When creating a new workflow, users are now prompted to configure all the essential services and settings upfront, including:

- **Twilio Configuration**: For making and receiving phone calls
- **AI Model Configuration**: OpenAI, Anthropic, or other LLM providers
- **Voice Configuration**: ElevenLabs, Azure Speech, or Google Cloud TTS
- **Transcription Configuration**: Deepgram, AssemblyAI, or Whisper STT
- **Global Settings**: Call duration, timeouts, and feature toggles

## Workflow Setup Modal

### Basic Information Tab
- **Workflow Name**: Required name for the workflow
- **Description**: Optional description of what the workflow does

### Services Tab
#### Twilio Configuration
- **Account SID**: Your Twilio Account SID (format: ACxxxxxxxx...)
- **Auth Token**: Your Twilio authentication token
- **Phone Number**: Twilio phone number in E.164 format (+1234567890)
- **Webhook URL**: Optional webhook endpoint for call events
- **Record Calls**: Toggle to enable/disable call recording
- **Call Timeout**: Maximum call duration in seconds

#### AI Model Configuration
- **Provider Selection**: Choose between OpenAI, Anthropic, etc.
- **API Key**: Provider-specific API key
- **Model Selection**: Choose specific model (GPT-4, Claude-3, etc.)
- **System Prompt**: Default system prompt for the AI
- **Temperature & Max Tokens**: Model parameters

### Voice & Speech Tab
#### Voice Configuration
- **Provider Selection**: ElevenLabs, Azure Speech, Google Cloud
- **API Key**: Provider-specific API key
- **Voice Selection**: Choose from popular voice options
- **Voice Parameters**: Stability, similarity boost, etc. (ElevenLabs)

#### Transcription Configuration
- **Provider Selection**: Deepgram, AssemblyAI, Whisper
- **API Key**: Provider-specific API key
- **Language Settings**: Default language and regional settings
- **Transcription Features**: Punctuation, formatting, etc.

### Settings Tab
#### Global Settings
- **Max Call Duration**: Maximum call length in minutes (1-120)
- **Silence Timeout**: Timeout for user silence in seconds (1-60)
- **Conversation Summary**: Enable AI-generated call summaries
- **Interruption Handling**: Allow users to interrupt the AI
- **Default Language**: Primary language for the workflow
- **Timezone**: Timezone for scheduling and logging

## API Key Security

### Storage
- All API keys are stored securely and encrypted
- Keys are never logged or exposed in plain text
- Local storage encryption for development
- Production environments should use secure key management

### Validation
- Real-time format validation for API keys
- Provider-specific format checking (e.g., OpenAI keys start with "sk-")
- Optional connectivity testing to verify keys work
- Clear error messages for invalid configurations

### Show/Hide Toggle
- API keys are masked by default for security
- Toggle button to show/hide keys during configuration
- Visual indicators for sensitive information

## Configuration Validation

### Required Fields
The system validates that all required fields are filled:
- Workflow name
- Twilio Account SID, Auth Token, and Phone Number
- AI provider API key and model selection
- Voice provider API key and voice selection
- Transcription provider API key

### Format Validation
- **Twilio SID**: Must match format `AC[a-f0-9]{32}`
- **Phone Numbers**: Must be in E.164 format (`+1234567890`)
- **URLs**: Must be valid HTTP/HTTPS URLs
- **API Keys**: Provider-specific format validation

### Range Validation
- **Call Duration**: 1-120 minutes
- **Silence Timeout**: 1-60 seconds
- **Temperature**: 0-2 for most models
- **Voice Parameters**: 0-1 for stability/similarity settings

### Connectivity Testing
Optional API connectivity tests to verify:
- OpenAI: Test model access
- ElevenLabs: Test voice access
- Deepgram: Test transcription access
- Twilio: Test account access

## Supported Providers

### LLM Providers
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Azure OpenAI**: Enterprise OpenAI models
- **Google PaLM**: Google's language models

### Voice Providers
- **ElevenLabs**: High-quality AI voices with emotion
- **Azure Speech**: Microsoft's neural voices
- **Google Cloud TTS**: Google's WaveNet voices
- **OpenAI TTS**: OpenAI's text-to-speech models

### Transcription Providers
- **Deepgram**: Real-time speech recognition
- **AssemblyAI**: Advanced speech-to-text with features
- **OpenAI Whisper**: OpenAI's speech recognition
- **Azure Speech**: Microsoft's speech services
- **Google Cloud STT**: Google's speech recognition

## Usage Examples

### Customer Service Workflow
```
Name: "Customer Support Bot"
Twilio: Business phone number
AI: GPT-4 with customer service prompt
Voice: Professional female voice (ElevenLabs)
Transcription: Deepgram for real-time processing
Settings: 30-min calls, 10-sec silence timeout
```

### Appointment Scheduling
```
Name: "Appointment Scheduler"
Twilio: Dedicated scheduling line
AI: Claude-3 with scheduling prompts
Voice: Friendly conversational voice
Transcription: AssemblyAI with calendar integration
Settings: 15-min calls, conversation summaries enabled
```

### Lead Qualification
```
Name: "Sales Lead Qualifier"
Twilio: Sales team number
AI: GPT-4 Turbo for quick responses
Voice: Professional sales voice
Transcription: Deepgram with sentiment analysis
Settings: 20-min calls, interruption handling enabled
```

## Best Practices

### Security
- Use environment variables for API keys in production
- Rotate API keys regularly
- Monitor API usage and costs
- Implement rate limiting and usage quotas

### Configuration
- Test all configurations before deploying
- Use descriptive workflow names and descriptions
- Set appropriate timeouts for your use case
- Enable call recording for quality assurance

### Performance
- Choose appropriate models for your latency requirements
- Configure voice settings for natural speech
- Set reasonable token limits to control costs
- Use regional endpoints when available

### Monitoring
- Monitor API usage across all providers
- Track call quality and success rates
- Review conversation summaries for insights
- Set up alerts for configuration issues

## Troubleshooting

### Common Issues

1. **Invalid API Key Errors**
   - Verify key format matches provider requirements
   - Check that keys haven't expired or been revoked
   - Ensure sufficient credits/quota available

2. **Connectivity Issues**
   - Verify network connectivity to provider APIs
   - Check firewall and proxy settings
   - Validate webhook URLs are accessible

3. **Voice Quality Problems**
   - Adjust voice parameters (stability, similarity)
   - Try different voice models or providers
   - Check audio encoding settings

4. **Transcription Accuracy**
   - Verify language settings match call language
   - Enable punctuation and formatting features
   - Consider noise reduction settings

### Debug Tips
- Use the configuration validation system
- Test individual services before full workflow
- Check browser console for detailed error messages
- Monitor API provider dashboards for usage and errors

## Migration from Previous Versions

If you have existing workflows without configuration:
1. Open the workflow in the editor
2. Go to Settings → Workflow Configuration
3. Fill in the required service details
4. Save and test the updated configuration

The system will prompt for missing configuration when trying to execute workflows that lack proper setup.

## Future Enhancements

Planned improvements include:
- Automatic API key testing and validation
- Configuration templates for common use cases
- Bulk configuration import/export
- Advanced monitoring and analytics integration
- Multi-environment configuration management
