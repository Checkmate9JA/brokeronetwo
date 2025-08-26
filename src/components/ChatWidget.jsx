import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatSetting } from '@/api/entities';

export default function ChatWidget() {
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(false);
  const [liveChatScript, setLiveChatScript] = useState('');
  const [isLiveChatEnabled, setIsLiveChatEnabled] = useState(false);

  useEffect(() => {
    loadChatSettings();
  }, []);

  useEffect(() => {
    if (isLiveChatEnabled && liveChatScript) {
      injectLiveChatScript();
    }
  }, [isLiveChatEnabled, liveChatScript]);

  const loadChatSettings = async () => {
    try {
      const settings = await ChatSetting.list();
      const whatsAppSetting = settings.find(s => s.setting_type === 'whatsapp');
      const liveChatSetting = settings.find(s => s.setting_type === 'livechat');

      if (whatsAppSetting) {
        setWhatsAppNumber(whatsAppSetting.value || '');
        setIsWhatsAppEnabled(whatsAppSetting.is_enabled);
      }

      if (liveChatSetting) {
        setLiveChatScript(liveChatSetting.value || '');
        setIsLiveChatEnabled(liveChatSetting.is_enabled);
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error);
    }
  };

  const injectLiveChatScript = () => {
    const scriptId = 'livechat-injected-script';
    
    // Prevent re-injecting the script if it already exists
    if (document.getElementById(scriptId)) {
      return;
    }

    try {
      // Extract the script src from the script tag in the string
      const srcMatch = liveChatScript.match(/src=["'](.*?)["']/);
      if (srcMatch && srcMatch[1]) {
        const scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.src = srcMatch[1];
        scriptElement.async = true;
        
        // Append to head for better compatibility
        document.head.appendChild(scriptElement);
        
        console.log('LiveChat script injected successfully');
      } else {
        // If no src found, try to execute the entire script content
        const scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.innerHTML = liveChatScript.replace(/<script[^>]*>|<\/script>/gi, '');
        document.head.appendChild(scriptElement);
        
        console.log('LiveChat inline script injected successfully');
      }
    } catch (error) {
      console.error('Failed to inject LiveChat script:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (whatsAppNumber) {
      const message = encodeURIComponent("Hi! I need assistance with my account.");
      const whatsappUrl = `https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <>
      {/* WhatsApp Floating Button (Bottom-Left) */}
      {isWhatsAppEnabled && whatsAppNumber && (
        <button
          onClick={handleWhatsAppClick}
          className="fixed bottom-5 left-5 z-50 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-transform hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/452df2564_WhatsAppWhite.png"
            alt="WhatsApp"
            className="w-8 h-8"
          />
        </button>
      )}

      {/* LiveChat script will be injected by useEffect and will position itself */}
    </>
  );
}