import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FeedbackModal from './FeedbackModal';

export default function WhatsAppLiveChatModal({ isOpen, onClose, onSettingsSaved }) {
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(true);
  const [liveChatScript, setLiveChatScript] = useState('');
  const [isLiveChatEnabled, setIsLiveChatEnabled] = useState(true);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('chat_settings')
        .select('*');

      if (error) throw error;

      const whatsAppSetting = settings?.find(s => s.setting_type === 'whatsapp');
      const liveChatSetting = settings?.find(s => s.setting_type === 'livechat');

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
      showFeedback('error', 'Error', 'Failed to load chat settings');
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      // Validate phone number format
      if (whatsAppNumber && !/^\+?[\d\s\-\(\)]+$/.test(whatsAppNumber)) {
        showFeedback('error', 'Invalid Format', 'Please enter a valid phone number (e.g., +1234567890)');
        return;
      }

      const { data: settings, error: fetchError } = await supabase
        .from('chat_settings')
        .select('*');

      if (fetchError) throw fetchError;

      const existingWhatsApp = settings?.find(s => s.setting_type === 'whatsapp');

      if (existingWhatsApp) {
        const { error } = await supabase
          .from('chat_settings')
          .update({
            is_enabled: isWhatsAppEnabled,
            value: whatsAppNumber
          })
          .eq('id', existingWhatsApp.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_settings')
          .insert({
            setting_type: 'whatsapp',
            is_enabled: isWhatsAppEnabled,
            value: whatsAppNumber
          });

        if (error) throw error;
      }

      // Reload settings to confirm save
      await loadSettings();
      
      // Notify parent component to refresh
      if (onSettingsSaved) {
        onSettingsSaved();
      }
      
      showFeedback('success', 'Success!', 'WhatsApp settings saved successfully!');
    } catch (error) {
      console.error('Failed to save WhatsApp settings:', error);
      showFeedback('error', 'Error', 'Failed to save WhatsApp settings');
    }
  };
  
  const handleSaveLiveChat = async () => {
    try {
      const { data: settings, error: fetchError } = await supabase
        .from('chat_settings')
        .select('*');

      if (fetchError) throw fetchError;

      const existingLiveChat = settings?.find(s => s.setting_type === 'livechat');

      if (existingLiveChat) {
        const { error } = await supabase
          .from('chat_settings')
          .update({
            is_enabled: isLiveChatEnabled,
            value: liveChatScript
          })
          .eq('id', existingLiveChat.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_settings')
          .insert({
            setting_type: 'livechat',
            is_enabled: isLiveChatEnabled,
            value: liveChatScript
          });

        if (error) throw error;
      }

      // Notify parent component to refresh
      if (onSettingsSaved) {
        onSettingsSaved();
      }
      
      showFeedback('success', 'Success!', 'LiveChat settings saved successfully!');
    } catch (error) {
      console.error('Failed to save LiveChat settings:', error);
      showFeedback('error', 'Error', 'Failed to save LiveChat settings');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-gray-900 dark:text-white">WhatsApp/LiveChat Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="whatsapp" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="livechat" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">LiveChat</span>
              </TabsTrigger>
            </TabsList>
            
            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="mt-6">
              <div className="space-y-6">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                      <div>
                          <Label htmlFor="whatsapp-status" className="font-semibold text-gray-900 dark:text-white">WhatsApp Status</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Current WhatsApp integration status</p>
                      </div>
                      <Switch id="whatsapp-status" checked={isWhatsAppEnabled} onCheckedChange={setIsWhatsAppEnabled} />
                  </div>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <Label htmlFor="whatsapp-number" className="font-semibold text-base text-gray-900 dark:text-white">Phone Number Configuration</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set the active WhatsApp number for customer support</p>
                  <Input id="whatsapp-number" value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} placeholder="+1234567890" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">Save Settings</Button>
                </div>
              </div>
            </TabsContent>
            
            {/* LiveChat Tab */}
            <TabsContent value="livechat" className="mt-6">
              <div className="space-y-6">
                 <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                      <div>
                          <Label htmlFor="livechat-status" className="font-semibold text-gray-900 dark:text-white">LiveChat Status</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Current live chat widget status</p>
                      </div>
                      <Switch id="livechat-status" checked={isLiveChatEnabled} onCheckedChange={setIsLiveChatEnabled} />
                  </div>
                </div>
                 <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <Label htmlFor="livechat-script" className="font-semibold text-base text-gray-900 dark:text-white">Live Chat Script</Label>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Configure the live chat widget script (Tawk.to, Zendesk, etc.)</p>
                  <Textarea
                    id="livechat-script"
                    value={liveChatScript}
                    onChange={(e) => setLiveChatScript(e.target.value)}
                    placeholder='<script src="..."></script>'
                    rows={6}
                  />
                   <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 hidden md:block">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription>
                          Only paste scripts from trusted providers. Malicious scripts can compromise your website security.
                      </AlertDescription>
                  </Alert>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveLiveChat} className="bg-blue-600 hover:bg-blue-700 text-white">Save Settings</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
      />
    </>
  );
}