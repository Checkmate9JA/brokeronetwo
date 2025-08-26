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
import { Card } from "@/components/ui/card";
import { DollarSign } from 'lucide-react';
import { AdminSetting } from '@/api/entities';
import FeedbackModal from './FeedbackModal';

export default function MinimumInvestmentModal({ isOpen, onClose }) {
  const [regularTradeMin, setRegularTradeMin] = useState(10);
  const [copyTradeMin, setCopyTradeMin] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    setIsLoading(true);
    try {
      const settings = await AdminSetting.list();
      
      const regularTradeSetting = settings.find(s => s.setting_key === 'min_regular_trade_amount');
      const copyTradeSetting = settings.find(s => s.setting_key === 'min_copy_trade_amount');
      
      if (regularTradeSetting) {
        setRegularTradeMin(parseFloat(regularTradeSetting.setting_value) || 10);
      }
      if (copyTradeSetting) {
        setCopyTradeMin(parseFloat(copyTradeSetting.setting_value) || 50);
      }
    } catch (error) {
      console.error('Error loading minimum investment settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if settings exist and update or create them
      const existingSettings = await AdminSetting.list();
      
      const regularTradeSetting = existingSettings.find(s => s.setting_key === 'min_regular_trade_amount');
      const copyTradeSetting = existingSettings.find(s => s.setting_key === 'min_copy_trade_amount');
      
      if (regularTradeSetting) {
        await AdminSetting.update(regularTradeSetting.id, {
          setting_value: regularTradeMin.toString()
        });
      } else {
        await AdminSetting.create({
          setting_key: 'min_regular_trade_amount',
          setting_value: regularTradeMin.toString()
        });
      }
      
      if (copyTradeSetting) {
        await AdminSetting.update(copyTradeSetting.id, {
          setting_value: copyTradeMin.toString()
        });
      } else {
        await AdminSetting.create({
          setting_key: 'min_copy_trade_amount',
          setting_value: copyTradeMin.toString()
        });
      }
      
      showFeedback('success', 'Settings Saved!', 'Minimum investment amounts have been updated successfully.');
    } catch (error) {
      console.error('Error saving minimum investment settings:', error);
      showFeedback('error', 'Save Failed', 'Failed to save minimum investment settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <DialogTitle>Minimum Investment Settings</DialogTitle>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <div className="py-4 space-y-6">
              <Card className="p-4">
                <Label htmlFor="regular-trade-min" className="text-base font-semibold">
                  Regular Trading Minimum
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Minimum amount required for manual trades (BUY/SELL)
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="regular-trade-min"
                    type="number"
                    min="1"
                    step="1"
                    value={regularTradeMin}
                    onChange={(e) => setRegularTradeMin(parseFloat(e.target.value) || 1)}
                    className="pl-8"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <Label htmlFor="copy-trade-min" className="text-base font-semibold">
                  Copy Trading Minimum
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Minimum amount required for copy trading with expert traders
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="copy-trade-min"
                    type="number"
                    min="1"
                    step="1"
                    value={copyTradeMin}
                    onChange={(e) => setCopyTradeMin(parseFloat(e.target.value) || 1)}
                    className="pl-8"
                  />
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}
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