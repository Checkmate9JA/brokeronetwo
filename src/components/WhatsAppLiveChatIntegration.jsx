import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minimize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WhatsAppLiveChatIntegration() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    whatsapp: { enabled: false, number: '' },
    livechat: { enabled: false, script: '' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadChatSettings();
  }, [refreshKey]);

  // Function to refresh settings
  const refreshSettings = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Expose refresh function to parent components
  useEffect(() => {
    window.refreshWhatsAppLiveChat = refreshSettings;
    return () => {
      delete window.refreshWhatsAppLiveChat;
    };
  }, []);

  const loadChatSettings = async () => {
    try {
      console.log('Loading chat settings...');
      const { data: settings, error } = await supabase
        .from('chat_settings')
        .select('*');

      if (error) throw error;

      console.log('Chat settings loaded:', settings);

      const whatsAppSetting = settings?.find(s => s.setting_type === 'whatsapp');
      const liveChatSetting = settings?.find(s => s.setting_type === 'livechat');

      console.log('WhatsApp setting:', whatsAppSetting);
      console.log('LiveChat setting:', liveChatSetting);

      setChatSettings({
        whatsapp: {
          enabled: whatsAppSetting?.is_enabled || false,
          number: whatsAppSetting?.value || ''
        },
        livechat: {
          enabled: liveChatSetting?.is_enabled || false,
          script: liveChatSetting?.value || ''
        }
      });

      console.log('Chat settings state updated:', {
        whatsapp: {
          enabled: whatsAppSetting?.is_enabled || false,
          number: whatsAppSetting?.value || ''
        },
        livechat: {
          enabled: liveChatSetting?.is_enabled || false,
          script: liveChatSetting?.value || ''
        }
      });
    } catch (error) {
      console.error('Failed to load chat settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (chatSettings.whatsapp.enabled && chatSettings.whatsapp.number) {
      const phoneNumber = chatSettings.whatsapp.number.replace(/\s/g, '');
      const message = encodeURIComponent('Hello! I need assistance with my trading account.');
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Function to inject LiveChat script dynamically
  const injectLiveChatScript = (scriptContent) => {
    if (!scriptContent) return;

    try {
      // Extract the src URL from the script tag
      const srcMatch = scriptContent.match(/src="([^"]+)"/);
      if (!srcMatch) return;

      const scriptUrl = srcMatch[1];
      
      // Check if script is already loaded to prevent duplicates
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existingScript) return;

      // Create new script element
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      
      // Append to document head
      document.head.appendChild(script);
      
      console.log('LiveChat script injected successfully:', scriptUrl);
    } catch (error) {
      console.error('Failed to inject LiveChat script:', error);
    }
  };

  // Inject LiveChat script when component mounts and settings are loaded
  useEffect(() => {
    if (chatSettings.livechat.enabled && chatSettings.livechat.script) {
      injectLiveChatScript(chatSettings.livechat.script);
    }
  }, [chatSettings.livechat.enabled, chatSettings.livechat.script]);

  // Don't render anything if no chat options are enabled
  console.log('Render check:', { isLoading, whatsappEnabled: chatSettings.whatsapp.enabled, livechatEnabled: chatSettings.livechat.enabled });
  
  if (isLoading || (!chatSettings.whatsapp.enabled && !chatSettings.livechat.enabled)) {
    console.log('Not rendering - no chat options enabled or still loading');
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg"
          title="Open chat"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </Button>
      </div>
    );
  }

  if (isExpanded && chatSettings.livechat.enabled && chatSettings.livechat.script) {
    return (
      <>
        {/* WhatsApp Button - Always visible, even when LiveChat is expanded */}
        {chatSettings.whatsapp.enabled && chatSettings.whatsapp.number && (
          <div className="fixed bottom-4 right-10 lg:right-40 z-50">
            <Button
              onClick={handleWhatsAppClick}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
              title="WhatsApp Support"
            >
              {/* WhatsApp white logo - using img tag for official logo */}
              <img 
                src="/whatsapp-white.png" 
                alt="WhatsApp" 
                className="w-8 h-8"
              />
            </Button>
          </div>
        )}

        {/* LiveChat Expanded Modal */}
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat Support</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="w-6 h-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 flex-1">
            <div 
              className="w-full h-80"
              dangerouslySetInnerHTML={{ __html: chatSettings.livechat.script }}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* WhatsApp Button - Right side of page, close to LiveChat */}
      {chatSettings.whatsapp.enabled && chatSettings.whatsapp.number ? (
        <div className="fixed bottom-5 right-10 lg:right-40 z-50">
          <Button
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            title="WhatsApp Support"
          >
            {/* WhatsApp white logo - using img tag for official logo */}
            <img 
              src="/whatsapp-white.png" 
              alt="WhatsApp" 
              className="w-8 h-8"
            />
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-5 right-10 lg:right-40 z-50 text-xs text-gray-500 bg-white p-2 rounded border">
          Debug: WhatsApp {chatSettings.whatsapp.enabled ? 'enabled' : 'disabled'}, Number: {chatSettings.whatsapp.number || 'none'}
        </div>
      )}

      {/* LiveChat Button - Right side of page */}
      {/* Note: This button is now rendered by the third-party LiveChat service */}
      {/* The injectLiveChatScript function handles the injection */}
      {/* No custom button needed - the service provides its own branded UI */}

      {/* Debug: Manual refresh button */}
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          onClick={refreshSettings}
          className="bg-gray-500 hover:bg-gray-600 text-white rounded-full w-12 h-12 shadow-lg"
          title="Refresh Settings"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </Button>
      </div>
    </>
  );
}
