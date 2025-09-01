import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Comprehensive list of supported languages with their codes and names
const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Detect Language', flag: '🌐' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'hmn', name: 'Hmong', flag: '🇱🇦' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'jv', name: 'Javanese', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdish', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', flag: '🏛️' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'ny', name: 'Nyanja (Chichewa)', flag: '🇲🇼' },
  { code: 'or', name: 'Odia (Oriya)', flag: '🇮🇳' },
  { code: 'om', name: 'Oromo', flag: '🇪🇹' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala (Sinhalese)', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'tk', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ug', name: 'Uyghur', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 've', name: 'Venda', flag: '🇿🇦' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'cy', name: 'Welsh', flag: '🇬🇧' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' }
];

export default function GoogleTranslate({ variant = 'icon' }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateWidget, setTranslateWidget] = useState(null);
  const translateElementRef = useRef(null);

  useEffect(() => {
    // Initialize Google Translate
    const initGoogleTranslate = () => {
      // Wait for Google Translate to be available
      const checkGoogleTranslate = () => {
        if (window.google && window.google.translate) {
          // Create the translate widget
          try {
            const widget = new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            }, 'google_translate_element');
            
            setTranslateWidget(widget);
            console.log('Google Translate widget created successfully');
          } catch (error) {
            console.error('Error creating Google Translate widget:', error);
          }
          return;
        }
        
        // If not available yet, wait and try again
        setTimeout(checkGoogleTranslate, 100);
      };
      
      checkGoogleTranslate();
    };

    initGoogleTranslate();
  }, []);

  const handleLanguageChange = async (languageCode) => {
    console.log(`Attempting to translate to: ${languageCode}`);
    
    if (languageCode === 'auto') {
      // Reset to original language
      setCurrentLanguage('en');
      setIsTranslating(true);
      
      try {
        // Use Google Translate's restore function to reset to original
        if (window.google && window.google.translate) {
          // Find and click the restore button if it exists
          const restoreButton = document.querySelector('.goog-te-banner-frame .goog-te-button button');
          if (restoreButton) {
            restoreButton.click();
            console.log('Restore button clicked');
          } else {
            // Alternative: reload the page to reset
            console.log('No restore button found, reloading page');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error restoring original language:', error);
        // Fallback: reload page
        window.location.reload();
      }
      
      setTimeout(() => setIsTranslating(false), 1000);
      return;
    }

    setCurrentLanguage(languageCode);
    setIsTranslating(true);

    try {
      console.log('Google Translate available:', !!window.google?.translate);
      console.log('Translate widget:', !!translateWidget);
      
      // Method 1: Try to use the translate widget's methods
      if (translateWidget && translateWidget.translatePage) {
        console.log('Using widget.translatePage method');
        translateWidget.translatePage(languageCode);
      } else {
        // Method 2: Find the language selector and change it
        console.log('Looking for language selector');
        const languageSelect = document.querySelector('.goog-te-combo');
        if (languageSelect) {
          console.log('Found language selector, changing value');
          languageSelect.value = languageCode;
          languageSelect.dispatchEvent(new Event('change'));
        } else {
          // Method 3: Create a new translate element with the target language
          console.log('Creating new translate element');
          await createTemporaryTranslateElement(languageCode);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback: try to manually trigger Google Translate
      try {
        await createTemporaryTranslateElement(languageCode);
      } catch (fallbackError) {
        console.error('Fallback translation failed:', fallbackError);
      }
    }

    // Reset translating state
    setTimeout(() => {
      setIsTranslating(false);
    }, 3000);
  };

  const createTemporaryTranslateElement = async (languageCode) => {
    return new Promise((resolve) => {
      console.log('Creating temporary translate element for:', languageCode);
      
      // Create a temporary visible element to trigger translation
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp_translate_element';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '1px';
      tempDiv.style.height = '1px';
      tempDiv.style.overflow = 'hidden';
      document.body.appendChild(tempDiv);
      
      try {
        const tempWidget = new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: languageCode,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, 'temp_translate_element');
        
        // Wait a bit for the widget to initialize, then trigger translation
        setTimeout(() => {
          const select = tempDiv.querySelector('.goog-te-combo');
          if (select) {
            console.log('Found temporary language selector, triggering translation');
            select.value = languageCode;
            select.dispatchEvent(new Event('change'));
          } else {
            console.log('No temporary language selector found');
          }
          
          // Remove the temporary element after a delay
          setTimeout(() => {
            if (tempDiv.parentNode) {
              tempDiv.parentNode.removeChild(tempDiv);
            }
          }, 2000);
          
          resolve();
        }, 500);
      } catch (error) {
        console.error('Error creating temporary translate element:', error);
        if (tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
        }
        resolve();
      }
    });
  };

  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Translate page"
          >
            <Languages className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
          <div className="p-2 border-b">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Language</p>
          </div>
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-lg">{language.flag}</span>
              <span className="flex-1 text-left">{language.name}</span>
              {currentLanguage === language.code && (
                <span className="text-blue-600">✓</span>
              )}
              {isTranslating && currentLanguage === language.code && (
                <span className="text-gray-400 translate-loading">⟳</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
        {/* Hidden Google Translate element */}
        <div 
          ref={translateElementRef}
          id="google_translate_element" 
          className="hidden"
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        />
      </DropdownMenu>
    );
  }

  // Button variant for mobile
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 dark:text-gray-300 flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Translate</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
        <div className="p-2 border-b">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Language</p>
        </div>
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{language.flag}</span>
            <span className="flex-1 text-left">{language.name}</span>
            {currentLanguage === language.code && (
              <span className="text-blue-600">✓</span>
            )}
            {isTranslating && currentLanguage === language.code && (
              <span className="text-gray-400 translate-loading">⟳</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      {/* Hidden Google Translate element */}
      <div 
        ref={translateElementRef}
        id="google_translate_element" 
        className="hidden"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      />
    </DropdownMenu>
  );
}




