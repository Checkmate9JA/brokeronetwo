import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function CopyTradeSettingsModal({ isOpen, onClose }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    minCopyTradeAmount: 50,
    copyTradeEnabled: true
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['min_copy_trade_amount', 'copy_trade_enabled']);

      if (error) throw error;

      const newSettings = {
        minCopyTradeAmount: 50,
        copyTradeEnabled: true
      };

      data?.forEach(setting => {
        if (setting.setting_key === 'min_copy_trade_amount') {
          newSettings.minCopyTradeAmount = parseInt(setting.setting_value) || 50;
        } else if (setting.setting_key === 'copy_trade_enabled') {
          newSettings.copyTradeEnabled = setting.setting_value === 'true';
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading copy trade settings:', error);
      toast({
        title: "Error",
        description: "Failed to load copy trade settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update minimum copy trade amount
      const { error: amountError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'min_copy_trade_amount',
          setting_value: settings.minCopyTradeAmount.toString(),
          updated_at: new Date().toISOString()
        });

      if (amountError) throw amountError;

      // Update copy trade enabled setting
      const { error: enabledError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'copy_trade_enabled',
          setting_value: settings.copyTradeEnabled.toString(),
          updated_at: new Date().toISOString()
        });

      if (enabledError) throw enabledError;

      toast({
        title: "Success",
        description: "Copy trade settings saved successfully",
        variant: "success"
      });

      onClose();
    } catch (error) {
      console.error('Error saving copy trade settings:', error);
      toast({
        title: "Error",
        description: "Failed to save copy trade settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CopyIcon className="w-5 h-5 text-blue-600" />
            Copy Trade Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Copy Trade Enabled Switch */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Copy Trading</Label>
              <p className="text-xs text-gray-500 mt-1">
                Allow users to copy expert trader positions
              </p>
            </div>
            <Switch
              checked={settings.copyTradeEnabled}
              onCheckedChange={(checked) => handleChange('copyTradeEnabled', checked)}
            />
          </div>

          {/* Minimum Amount Setting */}
          <div>
            <Label htmlFor="min-amount" className="text-sm font-medium">
              Minimum Copy Trade Amount (USD)
            </Label>
            <Input
              id="min-amount"
              type="number"
              min="10"
              step="10"
              value={settings.minCopyTradeAmount}
              onChange={(e) => handleChange('minCopyTradeAmount', parseInt(e.target.value) || 50)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Users must invest at least this amount when copying trades
            </p>
          </div>

          {/* Current Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Status:</span>
              <Badge variant={settings.copyTradeEnabled ? "default" : "secondary"}>
                {settings.copyTradeEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              Minimum amount: ${settings.minCopyTradeAmount}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
