import React, { useState } from 'react';
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
import { TradingPosition } from '@/api/entities';

export default function ModifyPositionModal({ isOpen, onClose, position, onSuccess, onFeedback }) {
  const [formData, setFormData] = useState({
    stop_loss_percentage: 5,
    take_profit_percentage: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (position) {
      // Calculate percentages from current prices
      const entryPrice = position.entry_price || 0;
      const stopLossPercentage = entryPrice > 0 ? 
        Math.abs(((position.stop_loss_price || entryPrice) - entryPrice) / entryPrice * 100) : 5;
      const takeProfitPercentage = entryPrice > 0 ? 
        Math.abs(((position.take_profit_price || entryPrice) - entryPrice) / entryPrice * 100) : 10;
      
      setFormData({
        stop_loss_percentage: stopLossPercentage,
        take_profit_percentage: takeProfitPercentage
      });
    }
  }, [position]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;

    setIsSubmitting(true);
    try {
      const entryPrice = position.entry_price || 0;
      const stopLossPrice = entryPrice * (1 - formData.stop_loss_percentage / 100);
      const takeProfitPrice = entryPrice * (1 + formData.take_profit_percentage / 100);

      await TradingPosition.update(position.id, {
        stop_loss_price: stopLossPrice,
        take_profit_price: takeProfitPrice
      });

      onFeedback('success', 'Position Updated', 'Your position has been successfully modified.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error modifying position:', error);
      onFeedback('error', 'Modification Failed', 'Failed to modify position. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!position) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-gray-900 dark:text-white">Modify Position - {position.symbol_code}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Entry Price:</span>
                <div className="font-semibold dark:text-white">{formatCurrency(position.entry_price)}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Investment:</span>
                <div className="font-semibold dark:text-white">{formatCurrency(position.investment_amount)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stop-loss" className="text-gray-900 dark:text-white">Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.1"
                value={formData.stop_loss_percentage}
                onChange={(e) => handleChange('stop_loss_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="50"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Price: {formatCurrency((position.entry_price || 0) * (1 - formData.stop_loss_percentage / 100))}
              </div>
            </div>
            <div>
              <Label htmlFor="take-profit" className="text-gray-900 dark:text-white">Take Profit (%)</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.1"
                value={formData.take_profit_percentage}
                onChange={(e) => handleChange('take_profit_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="1000"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Price: {formatCurrency((position.entry_price || 0) * (1 + formData.take_profit_percentage / 100))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Updating...' : 'Update Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}