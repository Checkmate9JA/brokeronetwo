
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
import { AdminSetting } from '@/api/entities';

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
      const settings = await AdminSetting.filter({ setting_key: 'withdrawal_option' });
      if (settings.length > 0) {
        setSelectedOption(settings[0].setting_value || 'withdrawal_code');
      } else {
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
      // Check if setting already exists
      const existingSettings = await AdminSetting.filter({ setting_key: 'withdrawal_option' });
      
      if (existingSettings.length > 0) {
        // Update existing setting
        await AdminSetting.update(existingSettings[0].id, {
          setting_value: selectedOption
        });
      } else {
        // Create new setting
        await AdminSetting.create({
          setting_key: 'withdrawal_option',
          setting_value: selectedOption
        });
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
