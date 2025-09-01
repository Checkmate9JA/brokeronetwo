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
import { Switch } from "@/components/ui/switch";
import { Settings, Activity, Users, Trash2, RefreshCw, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FeedbackModal from './FeedbackModal';

export default function SocialProofModal({ isOpen, onClose }) {
  // Social Proof Settings
  const [socialProofSettings, setSocialProofSettings] = useState({
    system_enabled: true,
    notification_frequency: '8-15',
    max_notifications: '3',
    auto_cleanup_days: '30',
    refresh_timestamps: false,
    deactivate_old_names_days: '90'
  });
  
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      loadSocialProofSettings();
    }
  }, [isOpen]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadSocialProofSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('social_proof_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = {};
      settings?.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
        if (setting.setting_key === 'refresh_timestamps') {
          settingsMap[setting.setting_key] = setting.setting_value === 'true';
        }
      });

      setSocialProofSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Failed to load social proof settings:', error);
    }
  };

  const handleSaveSocialProof = async () => {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(socialProofSettings)) {
        const { error } = await supabase.rpc('update_social_proof_setting', {
          setting_key_param: key,
          new_value: value.toString(),
          new_enabled: true
        });

        if (error) throw error;
      }

      showFeedback('success', 'Success!', 'Social Proof settings saved successfully!');
    } catch (error) {
      console.error('Failed to save social proof settings:', error);
      showFeedback('error', 'Error', 'Failed to save social proof settings');
    }
  };

  const handleSocialProofAction = async (action) => {
    try {
      let message = '';
      
      switch (action) {
        case 'cleanup':
          const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_old_social_proof_activities');
          if (cleanupError) throw cleanupError;
          message = `Cleaned up ${cleanupResult} old activities`;
          break;
          
        case 'refresh':
          const { error: refreshError } = await supabase
            .from('social_proof_activities')
            .update({ 
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('is_active', true);
          if (refreshError) throw refreshError;
          message = 'Activity timestamps refreshed successfully';
          break;
          
        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('social_proof_names')
            .update({ is_active: false })
            .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
          if (deactivateError) throw deactivateError;
          message = 'Old names deactivated successfully';
          break;
          
        default:
          return;
      }
      
      showFeedback('success', 'Success!', message);
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      showFeedback('error', 'Error', `Failed to execute ${action}`);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          {/* Sticky Header */}
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-6 h-6 text-blue-600" />
              Social Proof System Settings
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure social proof notifications, maintenance, and system controls
            </p>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
            <div className="space-y-6 pt-4">
              {/* Master Switch */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold text-lg">Social Proof System</Label>
                    <p className="text-sm text-gray-600">Master switch for social proof notifications</p>
                  </div>
                  <Switch 
                    checked={socialProofSettings.system_enabled} 
                    onCheckedChange={(checked) => setSocialProofSettings(prev => ({ ...prev, system_enabled: checked }))} 
                  />
                </div>
              </div>

              {/* Configuration Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="notification-frequency" className="font-semibold">Notification Frequency</Label>
                  <p className="text-sm text-gray-500 mb-2">Range in seconds (e.g., 8-15)</p>
                  <Input 
                    id="notification-frequency"
                    value={socialProofSettings.notification_frequency}
                    onChange={(e) => setSocialProofSettings(prev => ({ ...prev, notification_frequency: e.target.value }))}
                    placeholder="8-15"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <Label htmlFor="max-notifications" className="font-semibold">Max Notifications</Label>
                  <p className="text-sm text-gray-500 mb-2">Maximum notifications to show</p>
                  <Input 
                    id="max-notifications"
                    type="number"
                    value={socialProofSettings.max_notifications}
                    onChange={(e) => setSocialProofSettings(prev => ({ ...prev, max_notifications: e.target.value }))}
                    placeholder="3"
                    min="1"
                    max="10"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <Label htmlFor="auto-cleanup-days" className="font-semibold">Auto Cleanup Days</Label>
                  <p className="text-sm text-gray-500 mb-2">Days before activities are cleaned up</p>
                  <Input 
                    id="auto-cleanup-days"
                    type="number"
                    value={socialProofSettings.auto_cleanup_days}
                    onChange={(e) => setSocialProofSettings(prev => ({ ...prev, auto_cleanup_days: e.target.value }))}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <Label htmlFor="deactivate-names-days" className="font-semibold">Deactivate Names Days</Label>
                  <p className="text-sm text-gray-500 mb-2">Days before names are deactivated</p>
                  <Input 
                    id="deactivate-names-days"
                    type="number"
                    value={socialProofSettings.deactivate_old_names_days}
                    onChange={(e) => setSocialProofSettings(prev => ({ ...prev, deactivate_old_names_days: e.target.value }))}
                    placeholder="90"
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              {/* Auto Refresh Toggle */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold">Auto Refresh Timestamps</Label>
                    <p className="text-sm text-gray-500">Automatically refresh activity timestamps</p>
                  </div>
                  <Switch 
                    checked={socialProofSettings.refresh_timestamps} 
                    onCheckedChange={(checked) => setSocialProofSettings(prev => ({ ...prev, refresh_timestamps: checked }))} 
                  />
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <Label className="font-semibold mb-4 block text-lg">Maintenance Actions</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => handleSocialProofAction('cleanup')}
                    variant="outline"
                    className="h-20 bg-white hover:bg-gray-50"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Clean Old Activities</div>
                      <div className="text-sm text-muted-foreground">Remove activities older than {socialProofSettings.auto_cleanup_days} days</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => handleSocialProofAction('refresh')}
                    variant="outline"
                    className="h-20 bg-white hover:bg-gray-50"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Refresh Timestamps</div>
                      <div className="text-sm text-muted-foreground">Update all activities to appear recent</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => handleSocialProofAction('deactivate')}
                    variant="outline"
                    className="h-20 bg-white hover:bg-gray-50"
                  >
                    <EyeOff className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Deactivate Old Names</div>
                      <div className="text-sm text-muted-foreground">Deactivate names older than {socialProofSettings.deactivate_old_names_days} days</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveSocialProof} className="bg-blue-600 hover:bg-blue-700 px-8">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Social Proof Settings
                </Button>
              </div>
            </div>
          </div>
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
