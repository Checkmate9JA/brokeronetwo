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
import { ChatSetting } from '@/api/entities';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function WhatsAppLiveChatModal({ isOpen, onClose }) {
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
      showFeedback('error', 'Error', 'Failed to load chat settings');
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      const settings = await ChatSetting.list();
      const existingWhatsApp = settings.find(s => s.setting_type === 'whatsapp');

      if (existingWhatsApp) {
        await ChatSetting.update(existingWhatsApp.id, {
          setting_type: 'whatsapp',
          is_enabled: isWhatsAppEnabled,
          value: whatsAppNumber
        });
      } else {
        await ChatSetting.create({
          setting_type: 'whatsapp',
          is_enabled: isWhatsAppEnabled,
          value: whatsAppNumber
        });
      }

      showFeedback('success', 'Success!', 'WhatsApp settings saved successfully!');
    } catch (error) {
      console.error('Failed to save WhatsApp settings:', error);
      showFeedback('error', 'Error', 'Failed to save WhatsApp settings');
    }
  };
  
  const handleSaveLiveChat = async () => {
    try {
      const settings = await ChatSetting.list();
      const existingLiveChat = settings.find(s => s.setting_type === 'livechat');

      if (existingLiveChat) {
        await ChatSetting.update(existingLiveChat.id, {
          setting_type: 'livechat',
          is_enabled: isLiveChatEnabled,
          value: liveChatScript
        });
      } else {
        await ChatSetting.create({
          setting_type: 'livechat',
          is_enabled: isLiveChatEnabled,
          value: liveChatScript
        });
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
        <DialogContent className="max-w-2xl max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
          <DialogHeader>
            <DialogTitle>WhatsApp/LiveChat Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="whatsapp" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="livechat">LiveChat</TabsTrigger>
            </TabsList>
            <TabsContent value="whatsapp" className="mt-6">
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                      <div>
                          <Label htmlFor="whatsapp-status" className="font-semibold">WhatsApp Status</Label>
                          <p className="text-sm text-gray-500">Current WhatsApp integration status</p>
                      </div>
                      <Switch id="whatsapp-status" checked={isWhatsAppEnabled} onCheckedChange={setIsWhatsAppEnabled} />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="whatsapp-number" className="font-semibold text-base">Phone Number Configuration</Label>
                  <p className="text-sm text-gray-500 mb-4">Set the active WhatsApp number for customer support</p>
                  <Input id="whatsapp-number" value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} placeholder="+1234567890" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveWhatsApp} className="bg-green-600 hover:bg-green-700">Save Settings</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="livechat" className="mt-6">
              <div className="space-y-6">
                 <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                      <div>
                          <Label htmlFor="livechat-status" className="font-semibold">LiveChat Status</Label>
                          <p className="text-sm text-gray-500">Current live chat widget status</p>
                      </div>
                      <Switch id="livechat-status" checked={isLiveChatEnabled} onCheckedChange={setIsLiveChatEnabled} />
                  </div>
                </div>
                 <div className="p-4 border rounded-lg">
                  <Label htmlFor="livechat-script" className="font-semibold text-base">Live Chat Script</Label>
                   <p className="text-sm text-gray-500 mb-4">Configure the live chat widget script (Tawk.to, Zendesk, etc.)</p>
                  <Textarea
                    id="livechat-script"
                    value={liveChatScript}
                    onChange={(e) => setLiveChatScript(e.target.value)}
                    placeholder='<script src="..."></script>'
                    rows={6}
                  />
                   <Alert className="mt-4 bg-yellow-50 border-yellow-200 text-yellow-800 hidden md:block">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                          Only paste scripts from trusted providers. Malicious scripts can compromise your website security.
                      </AlertDescription>
                  </Alert>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveLiveChat}>Save Settings</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}