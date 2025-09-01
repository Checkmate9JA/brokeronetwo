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
import { TrendingDown, AlertTriangle, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function TradingLossSettingsModal({ isOpen, onClose }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    userLossPercentage: 3,
    enforceUserLoss: true,
    globalLossControl: true
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
        .in('setting_key', ['user_loss_percentage', 'enforce_user_loss_percentage', 'global_loss_control']);

      if (error) throw error;

      const newSettings = {
        userLossPercentage: 3,
        enforceUserLoss: true,
        globalLossControl: true
      };

      data?.forEach(setting => {
        if (setting.setting_key === 'user_loss_percentage') {
          newSettings.userLossPercentage = parseFloat(setting.setting_value) || 3;
        } else if (setting.setting_key === 'enforce_user_loss_percentage') {
          newSettings.enforceUserLoss = setting.setting_value === 'true';
        } else if (setting.setting_key === 'global_loss_control') {
          newSettings.globalLossControl = setting.setting_value === 'true';
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading trading loss settings:', error);
      toast({
        title: "Error",
        description: "Failed to load trading loss settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Attempting to save trading loss settings:', settings);
      
      // First, check if admin_settings table exists and has the right structure
      const { data: tableCheck, error: tableError } = await supabase
        .from('admin_settings')
        .select('setting_key')
        .limit(1);
      
      if (tableError) {
        console.error('Table check error:', tableError);
        throw new Error(`Database table error: ${tableError.message}`);
      }
      
      console.log('Table check successful, proceeding with save...');
      
      // Update user loss percentage setting
      const { error: percentageError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'user_loss_percentage',
          setting_value: settings.userLossPercentage.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (percentageError) {
        console.error('Percentage save error:', percentageError);
        throw new Error(`Failed to save loss percentage: ${percentageError.message}`);
      }

      console.log('Loss percentage saved successfully');

      // Update enforce user loss setting
      const { error: enforceError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'enforce_user_loss_percentage',
          setting_value: settings.enforceUserLoss.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (enforceError) {
        console.error('Enforce save error:', enforceError);
        throw new Error(`Failed to save enforce setting: ${enforceError.message}`);
      }

      console.log('Enforce setting saved successfully');

      // Update global loss control setting
      const { error: globalError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'global_loss_control',
          setting_value: settings.globalLossControl.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (globalError) {
        console.error('Global control save error:', globalError);
        throw new Error(`Failed to save global control: ${globalError.message}`);
      }

      console.log('Global control saved successfully');

      // Verify the save by reloading settings
      await loadSettings();

      toast({
        title: "Success",
        description: "Trading loss settings saved successfully",
        variant: "success"
      });

      // Don't close the modal immediately, let user see the success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving trading loss settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save trading loss settings",
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10 py-4 px-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Trading Loss Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Warning Alert */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Loss Control Active</span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              These settings control how much money users lose in trades. Use responsibly.
            </p>
          </div>

          {/* Global Loss Control Switch */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Global Loss Control</Label>
              <p className="text-xs text-gray-500 mt-1">
                Master switch for admin-controlled trading losses
              </p>
            </div>
            <Switch
              checked={settings.globalLossControl}
              onCheckedChange={(checked) => handleChange('globalLossControl', checked)}
            />
          </div>

          {/* Enforce User Loss Switch */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enforce User Loss Percentage</Label>
              <p className="text-xs text-gray-500 mt-1">
                Force users to lose the specified percentage
              </p>
            </div>
            <Switch
              checked={settings.enforceUserLoss}
              onCheckedChange={(checked) => handleChange('enforceUserLoss', checked)}
              disabled={!settings.globalLossControl}
            />
          </div>

          {/* User Loss Percentage Setting */}
          <div>
            <Label htmlFor="loss-percentage" className="text-sm font-medium">
              User Loss Percentage (%)
            </Label>
            <Input
              id="loss-percentage"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={settings.userLossPercentage}
              onChange={(e) => handleChange('userLossPercentage', parseFloat(e.target.value) || 3)}
              className="mt-2"
              disabled={!settings.globalLossControl || !settings.enforceUserLoss}
            />
            <p className="text-xs text-gray-500 mt-1">
              Users will lose this percentage of their investment amount over time
            </p>
          </div>

          {/* Current Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Status:</span>
              <Badge variant={settings.globalLossControl && settings.enforceUserLoss ? "destructive" : "secondary"}>
                {settings.globalLossControl && settings.enforceUserLoss ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              Loss control: {settings.globalLossControl ? 'ON' : 'OFF'} | 
              Enforcement: {settings.enforceUserLoss ? 'ON' : 'OFF'} | 
              Loss %: {settings.userLossPercentage}%
            </p>
          </div>

          {/* How It Works */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">How It Works:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• When enabled, users automatically lose money over time</li>
              <li>• Loss is calculated as: Investment × Loss% × Leverage</li>
              <li>• Loss accumulates gradually (0.02% per minute)</li>
              <li>• Maximum loss is capped at your set percentage</li>
              <li>• Users get remaining balance back when closing positions</li>
            </ul>
          </div>

          {/* Save Settings Button - Non-sticky, positioned under content */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
