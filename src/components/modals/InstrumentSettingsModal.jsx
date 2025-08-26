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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradingInstrument } from '@/api/entities';
import { Settings } from 'lucide-react';

export default function InstrumentSettingsModal({ isOpen, onClose, instrument, onSuccess, onFeedback }) {
  const [formData, setFormData] = useState({
    leverage_options: '1x,5x,10x,20x,50x,100x',
    market_hours: '24/7',
    spread_percentage: 0.1,
    min_trade_amount: 10,
    max_trade_amount: 100000,
    auto_stop_loss_percentage: 5,
    auto_take_profit_percentage: 10,
    trading_fee_percentage: 0.1,
    allows_short_selling: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && instrument) {
      setFormData({
        leverage_options: instrument.leverage_options || '1x,5x,10x,20x,50x,100x',
        market_hours: instrument.market_hours || '24/7',
        spread_percentage: instrument.spread_percentage || 0.1,
        min_trade_amount: instrument.min_trade_amount || 10,
        max_trade_amount: instrument.max_trade_amount || 100000,
        auto_stop_loss_percentage: instrument.auto_stop_loss_percentage || 5,
        auto_take_profit_percentage: instrument.auto_take_profit_percentage || 10,
        trading_fee_percentage: instrument.trading_fee_percentage || 0.1,
        allows_short_selling: instrument.allows_short_selling !== undefined ? instrument.allows_short_selling : true
      });
    }
  }, [isOpen, instrument]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instrument) return;

    setIsSubmitting(true);
    try {
      await TradingInstrument.update(instrument.id, formData);
      onFeedback('success', 'Settings Updated', 'Trading instrument settings have been updated successfully.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating instrument settings:', error);
      onFeedback('error', 'Update Failed', 'Failed to update instrument settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Trading Settings: {instrument?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="leverage" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leverage">Leverage</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="leverage" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="leverage-options">Available Leverage Options</Label>
                <Input
                  id="leverage-options"
                  value={formData.leverage_options}
                  onChange={(e) => handleChange('leverage_options', e.target.value)}
                  placeholder="1x,5x,10x,20x,50x,100x"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated leverage values</p>
              </div>

              <div>
                <Label htmlFor="market-hours">Market Trading Hours</Label>
                <Input
                  id="market-hours"
                  value={formData.market_hours}
                  onChange={(e) => handleChange('market_hours', e.target.value)}
                  placeholder="24/7 or Mon-Fri 9:30-16:00"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="short-selling"
                  checked={formData.allows_short_selling}
                  onCheckedChange={(checked) => handleChange('allows_short_selling', checked)}
                />
                <Label htmlFor="short-selling">Allow Short Selling (SELL without owning)</Label>
              </div>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-amount">Minimum Trade Amount ($)</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    value={formData.min_trade_amount}
                    onChange={(e) => handleChange('min_trade_amount', parseFloat(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="max-amount">Maximum Trade Amount ($)</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    value={formData.max_trade_amount}
                    onChange={(e) => handleChange('max_trade_amount', parseFloat(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="spread">Spread Configuration (%)</Label>
                <Input
                  id="spread"
                  type="number"
                  step="0.01"
                  value={formData.spread_percentage}
                  onChange={(e) => handleChange('spread_percentage', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Difference between buy and sell prices for profit margins</p>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stop-loss">Default Stop-Loss (%)</Label>
                  <Input
                    id="stop-loss"
                    type="number"
                    step="0.1"
                    value={formData.auto_stop_loss_percentage}
                    onChange={(e) => handleChange('auto_stop_loss_percentage', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-close position at this loss percentage</p>
                </div>
                <div>
                  <Label htmlFor="take-profit">Default Take-Profit (%)</Label>
                  <Input
                    id="take-profit"
                    type="number"
                    step="0.1"
                    value={formData.auto_take_profit_percentage}
                    onChange={(e) => handleChange('auto_take_profit_percentage', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-close position at this profit percentage</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="trading-fee">Trading Fee (%)</Label>
                <Input
                  id="trading-fee"
                  type="number"
                  step="0.01"
                  value={formData.trading_fee_percentage}
                  onChange={(e) => handleChange('trading_fee_percentage', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="5"
                />
                <p className="text-xs text-gray-500 mt-1">Fee charged per trade execution</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}