
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WithdrawalOptionModal({ isOpen, onClose, onUpdate }) {
  const [selectedOption, setSelectedOption] = useState('withdrawal_code');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSetting();
    }
  }, [isOpen]);

  const loadCurrentSetting = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading current withdrawal option from Supabase...');
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'withdrawal_option');
      
      if (error) {
        console.error('Error loading withdrawal option:', error);
        setSelectedOption('withdrawal_code'); // Fallback to default
      } else if (settings && settings.length > 0) {
        console.log('✅ Current withdrawal option loaded:', settings[0].setting_value);
        setSelectedOption(settings[0].setting_value || 'withdrawal_code');
      } else {
        console.log('📝 No withdrawal option found, using default');
        setSelectedOption('withdrawal_code'); // Default
      }
    } catch (error) {
      console.error('Error loading withdrawal option:', error);
      setSelectedOption('withdrawal_code'); // Fallback to default
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving withdrawal option to Supabase:', selectedOption);
      
      // Check if setting already exists
      const { data: existingSettings, error: fetchError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'withdrawal_option');
      
      if (fetchError) {
        console.error('Error checking existing settings:', fetchError);
        throw fetchError;
      }
      
      if (existingSettings && existingSettings.length > 0) {
        // Update existing setting
        console.log('🔄 Updating existing withdrawal option...');
        const { error: updateError } = await supabase
          .from('admin_settings')
          .update({ setting_value: selectedOption })
          .eq('id', existingSettings[0].id);
        
        if (updateError) {
          console.error('Error updating withdrawal option:', updateError);
          throw updateError;
        }
        console.log('✅ Withdrawal option updated successfully');
      } else {
        // Create new setting
        console.log('🆕 Creating new withdrawal option...');
        const { error: insertError } = await supabase
          .from('admin_settings')
          .insert({
            setting_key: 'withdrawal_option',
            setting_value: selectedOption
          });
        
        if (insertError) {
          console.error('Error creating withdrawal option:', insertError);
          throw insertError;
        }
        console.log('✅ Withdrawal option created successfully');
      }
      
      onUpdate?.(selectedOption);
      onClose();
    } catch (error) {
      console.error('Error saving withdrawal option:', error);
      alert('Failed to save withdrawal option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-lg font-bold">Withdrawal Options</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-6">
            Choose how users should verify their identity before making withdrawals.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="withdrawal_code" id="withdrawal_code" />
                <Label htmlFor="withdrawal_code" className="flex-1 cursor-pointer">
                  <div className="font-medium">Withdrawal Code</div>
                  <div className="text-sm text-gray-500">Users need to enter their unique withdrawal code</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="wallet_connect" id="wallet_connect" />
                <Label htmlFor="wallet_connect" className="flex-1 cursor-pointer">
                  <div className="font-medium">Wallet Connection</div>
                  <div className="text-sm text-gray-500">Users must connect and validate their wallet first</div>
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
