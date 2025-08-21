import React, { useState, useMemo } from 'react';
import { Search, Globe, Check, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  LanguageOption,
  LanguageConfig
} from '../../../types/workflowConfig';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_CATEGORIES,
  CATEGORIZED_LANGUAGES,
  DEFAULT_LANGUAGE_CONFIG
} from '../../../types/workflowConfig';

interface LanguageSelectorProps {
  selectedLanguage: string;
  languageConfig?: LanguageConfig;
  onLanguageChange: (language: string) => void;
  onLanguageConfigChange: (config: LanguageConfig) => void;
  showAdvanced?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  languageConfig = DEFAULT_LANGUAGE_CONFIG,
  onLanguageChange,
  onLanguageConfigChange,
  showAdvanced = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get language details by code
  const getLanguageByCode = (code: string): LanguageOption | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  };

  // Filter languages based on search and category
  const filteredLanguages = useMemo(() => {
    let languages = SUPPORTED_LANGUAGES;

    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryLanguages = CATEGORIZED_LANGUAGES[selectedCategory as keyof typeof CATEGORIZED_LANGUAGES];
      languages = languages.filter(lang => categoryLanguages.includes(lang.code));
    }

    // Filter by search term
    if (searchTerm) {
      languages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return languages;
  }, [searchTerm, selectedCategory]);

  // Get popular languages for quick selection
  const popularLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    CATEGORIZED_LANGUAGES[LANGUAGE_CATEGORIES.POPULAR].includes(lang.code)
  );

  // Get Cantonese languages for special highlighting
  const cantoneseLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    CATEGORIZED_LANGUAGES[LANGUAGE_CATEGORIES.CHINESE].includes(lang.code) &&
    lang.code.startsWith('zh-H')
  );

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    
    // Update language config if it's a special language
    const selectedLang = getLanguageByCode(languageCode);
    if (selectedLang?.specialOptimizations) {
      const updatedConfig = {
        ...languageConfig,
        primary: languageCode
      };
      onLanguageConfigChange(updatedConfig);
    }
  };

  const handleAutoDetectionToggle = (enabled: boolean) => {
    onLanguageConfigChange({
      ...languageConfig,
      autoDetection: enabled
    });
  };

  const handleFallbackLanguageAdd = (fallbackLang: string) => {
    const currentFallbacks = languageConfig.fallback || [];
    if (!currentFallbacks.includes(fallbackLang)) {
      onLanguageConfigChange({
        ...languageConfig,
        fallback: [...currentFallbacks, fallbackLang]
      });
    }
  };

  const handleFallbackLanguageRemove = (fallbackLang: string) => {
    const currentFallbacks = languageConfig.fallback || [];
    onLanguageConfigChange({
      ...languageConfig,
      fallback: currentFallbacks.filter(lang => lang !== fallbackLang)
    });
  };

  const LanguageCard: React.FC<{ language: LanguageOption; isSelected: boolean }> = ({ 
    language, 
    isSelected 
  }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => handleLanguageSelect(language.code)}
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
            {language.specialOptimizations && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Star className="w-3 h-3 mr-1" />
                Optimized
              </Badge>
            )}
            {isSelected && (
              <Check className="w-5 h-5 text-blue-500" />
            )}
          </div>
        </div>
        {language.specialOptimizations && (
          <div className="mt-2 text-xs text-gray-600">
            Special optimizations: {language.specialOptimizations.dialectSupport?.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language Configuration
        </CardTitle>
        <CardDescription>
          Select the primary language for your voice agent and configure language settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection">Language Selection</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-6">
            {/* Current Selection */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Current Selection</Label>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-2xl">{getLanguageByCode(selectedLanguage)?.flag}</span>
                <div>
                  <div className="font-medium">{getLanguageByCode(selectedLanguage)?.name}</div>
                  <div className="text-sm text-gray-500">
                    {getLanguageByCode(selectedLanguage)?.nativeName}
                  </div>
                </div>
              </div>
            </div>

            {/* Cantonese Special Section */}
            {cantoneseLanguages.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-4 h-4 text-orange-500" />
                  <Label className="font-medium">Cantonese (Optimized)</Label>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Special Support
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cantoneseLanguages.map(language => (
                    <LanguageCard
                      key={language.code}
                      language={language}
                      isSelected={selectedLanguage === language.code}
                    />
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* Popular Languages */}
            <div>
              <Label className="font-medium mb-3 block">Popular Languages</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {popularLanguages.map(language => (
                  <Button
                    key={language.code}
                    variant={selectedLanguage === language.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLanguageSelect(language.code)}
                    className="justify-start"
                  >
                    <span className="mr-2">{language.flag}</span>
                    {language.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="language-search">Search Languages</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="language-search"
                      placeholder="Search by name, native name, or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {Object.values(LANGUAGE_CATEGORIES).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Language Grid */}
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredLanguages.map(language => (
                    <LanguageCard
                      key={language.code}
                      language={language}
                      isSelected={selectedLanguage === language.code}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* Auto Detection */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Automatic Language Detection</Label>
                <p className="text-sm text-gray-500">
                  Automatically detect the caller's language during the conversation
                </p>
              </div>
              <Switch
                checked={languageConfig.autoDetection || false}
                onCheckedChange={handleAutoDetectionToggle}
              />
            </div>

            {/* Fallback Languages */}
            <div>
              <Label className="font-medium mb-2 block">Fallback Languages</Label>
              <p className="text-sm text-gray-500 mb-3">
                Languages to try if the primary language fails or isn't detected
              </p>
              
              {/* Current Fallbacks */}
              {languageConfig.fallback && languageConfig.fallback.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {languageConfig.fallback.map(langCode => {
                      const lang = getLanguageByCode(langCode);
                      return lang ? (
                        <Badge key={langCode} variant="secondary" className="flex items-center gap-1">
                          <span>{lang.flag}</span>
                          {lang.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleFallbackLanguageRemove(langCode)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Add Fallback */}
              <Select onValueChange={handleFallbackLanguageAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Add fallback language..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES
                    .filter(lang => 
                      lang.code !== selectedLanguage && 
                      !languageConfig.fallback?.includes(lang.code)
                    )
                    .map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;
