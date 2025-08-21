import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageSelector from './LanguageSelector';
import { LanguageConfig, DEFAULT_LANGUAGE_CONFIG, SUPPORTED_LANGUAGES } from '../../../types/workflowConfig';

const LanguageSelectorDemo: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [languageConfig, setLanguageConfig] = useState<LanguageConfig>(DEFAULT_LANGUAGE_CONFIG);
  const [showDemo, setShowDemo] = useState(false);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    console.log('Language changed to:', language);
  };

  const handleLanguageConfigChange = (config: LanguageConfig) => {
    setLanguageConfig(config);
    console.log('Language config changed:', config);
  };

  const getLanguageDetails = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  };

  const selectedLangDetails = getLanguageDetails(selectedLanguage);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Language Selection UI Demo</CardTitle>
          <CardDescription>
            Test the new Language Selection component with Cantonese specialization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Button onClick={() => setShowDemo(!showDemo)}>
              {showDemo ? 'Hide' : 'Show'} Language Selector
            </Button>
            
            {selectedLangDetails && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Current:</span>
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>{selectedLangDetails.flag}</span>
                  <span>{selectedLangDetails.name}</span>
                </Badge>
              </div>
            )}
          </div>

          {showDemo && (
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              languageConfig={languageConfig}
              onLanguageChange={handleLanguageChange}
              onLanguageConfigChange={handleLanguageConfigChange}
              showAdvanced={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            View the current language selection and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selected Language */}
            <div>
              <h4 className="font-medium mb-2">Selected Language</h4>
              {selectedLangDetails && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{selectedLangDetails.flag}</span>
                    <div>
                      <div className="font-medium">{selectedLangDetails.name}</div>
                      <div className="text-sm text-gray-500">{selectedLangDetails.nativeName}</div>
                      <div className="text-xs text-gray-400">{selectedLangDetails.code}</div>
                    </div>
                  </div>
                  {selectedLangDetails.specialOptimizations && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Special Optimizations Available
                      </Badge>
                      <div className="text-xs text-gray-600 mt-1">
                        Dialect support: {selectedLangDetails.specialOptimizations.dialectSupport?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Configuration */}
            <div>
              <h4 className="font-medium mb-2">Language Configuration</h4>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Primary Language:</span>
                  <span className="text-sm font-medium">{languageConfig.primary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auto Detection:</span>
                  <span className="text-sm font-medium">
                    {languageConfig.autoDetection ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {languageConfig.fallback && languageConfig.fallback.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Fallback Languages:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {languageConfig.fallback.map(langCode => {
                        const lang = getLanguageDetails(langCode);
                        return lang ? (
                          <Badge key={langCode} variant="outline" className="text-xs">
                            {lang.flag} {lang.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Language Configurations */}
          {languageConfig.specialLanguages && Object.keys(languageConfig.specialLanguages).length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Special Language Configurations</h4>
              <div className="space-y-2">
                {Object.entries(languageConfig.specialLanguages).map(([langCode, config]) => {
                  const lang = getLanguageDetails(langCode);
                  return lang ? (
                    <div key={langCode} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span>{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Optimized
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">STT Provider:</span>
                          <span className="ml-2 font-medium">{config.sttProvider}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">TTS Provider:</span>
                          <span className="ml-2 font-medium">{config.ttsProvider}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Voice ID:</span>
                          <span className="ml-2 font-medium">{config.voiceId}</span>
                        </div>
                        {config.optimizations?.dialectSupport && (
                          <div>
                            <span className="text-gray-600">Dialects:</span>
                            <span className="ml-2 font-medium">
                              {config.optimizations.dialectSupport.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Output */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Configuration</CardTitle>
          <CardDescription>
            Raw JSON output for debugging and integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify({
              selectedLanguage,
              languageConfig
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelectorDemo;
