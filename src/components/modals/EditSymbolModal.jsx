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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabase';
import { Edit } from 'lucide-react';

export default function EditSymbolModal({ isOpen, onClose, symbol, onSuccess, onFeedback }) {
  const [formData, setFormData] = useState({
    instrument_id: '',
    symbol: '',
    name: '',
    current_price: 0,
    admin_controlled_outcome: 'auto',
    profit_percentage: 5,
    loss_percentage: 3,
    price_volatility: 2,
    is_active: true
  });
  const [instruments, setInstruments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInstruments();
      if (symbol) {
        setFormData({
          instrument_id: symbol.instrument_id || '',
          symbol: symbol.symbol || '',
          name: symbol.name || '',
          current_price: symbol.current_price || 0,
          admin_controlled_outcome: symbol.admin_controlled_outcome || 'auto',
          profit_percentage: symbol.profit_percentage || 5,
          loss_percentage: symbol.loss_percentage || 3,
          price_volatility: symbol.price_volatility || 2,
          is_active: symbol.is_active !== undefined ? symbol.is_active : true,
        });
      }
    }
  }, [isOpen, symbol]);

  const loadInstruments = async () => {
    try {
      console.log('🔍 Loading trading instruments...');
      
      const { data: fetchedInstruments, error } = await supabase
        .from('trading_instruments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error loading instruments:', error);
        throw new Error(`Failed to load instruments: ${error.message}`);
      }

      console.log('✅ Instruments loaded:', fetchedInstruments?.length || 0);
      setInstruments(fetchedInstruments || []);
      
    } catch (error) {
      console.error('❌ Error loading instruments:', error);
      onFeedback('error', 'Load Failed', error.message || 'Could not load trading instruments.');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol) return;

    setIsSubmitting(true);
    try {
      console.log('🔍 Updating trading symbol with data:', formData);
      
      // Update the trading symbol in Supabase
      const { data, error } = await supabase
        .from('trading_symbols')
        .update({
          instrument_id: formData.instrument_id,
          symbol: formData.symbol,
          name: formData.name,
          current_price: formData.current_price,
          admin_controlled_outcome: formData.admin_controlled_outcome,
          profit_percentage: formData.profit_percentage,
          loss_percentage: formData.loss_percentage,
          price_volatility: formData.price_volatility,
          is_active: formData.is_active
        })
        .eq('id', symbol.id)
        .select();

      if (error) {
        console.error('❌ Error updating trading symbol:', error);
        throw new Error(`Failed to update trading symbol: ${error.message}`);
      }

      console.log('✅ Trading symbol updated successfully:', data);
      
      // Show success feedback
      onFeedback('success', 'Symbol Updated', 'Trading symbol has been updated successfully.');
      
      // Close modal and refresh data
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('❌ Error updating symbol:', error);
      onFeedback('error', 'Update Failed', error.message || 'Failed to update trading symbol.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Trading Symbol
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instrument">Trading Instrument *</Label>
            <Select value={formData.instrument_id} onValueChange={(value) => handleChange('instrument_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.icon} {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol Code *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                placeholder="e.g., BTCUSD"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Symbol Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Bitcoin/USD"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="current-price">Current Price ($)</Label>
            <Input
              id="current-price"
              type="number"
              step="0.01"
              value={formData.current_price}
              onChange={(e) => handleChange('current_price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="admin-outcome">Admin Trade Outcome Control</Label>
            <Select value={formData.admin_controlled_outcome} onValueChange={(value) => handleChange('admin_controlled_outcome', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Natural Market)</SelectItem>
                <SelectItem value="force_profit">Force Profit (Users Always Win)</SelectItem>
                <SelectItem value="force_loss">Force Loss (Users Always Lose)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Control whether trades on this symbol always profit or lose</p>
          </div>

          {formData.admin_controlled_outcome === 'force_profit' && (
            <div>
              <Label htmlFor="profit-percentage">Fixed Profit Percentage (%)</Label>
              <Input
                id="profit-percentage"
                type="number"
                step="0.1"
                value={formData.profit_percentage}
                onChange={(e) => handleChange('profit_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="100"
              />
            </div>
          )}

          {formData.admin_controlled_outcome === 'force_loss' && (
            <div>
              <Label htmlFor="loss-percentage">Fixed Loss Percentage (%)</Label>
              <Input
                id="loss-percentage"
                type="number"
                step="0.1"
                value={formData.loss_percentage}
                onChange={(e) => handleChange('loss_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="100"
              />
            </div>
          )}

          <div>
            <Label htmlFor="volatility">Price Volatility (%)</Label>
            <Input
              id="volatility"
              type="number"
              step="0.1"
              value={formData.price_volatility}
              onChange={(e) => handleChange('price_volatility', parseFloat(e.target.value) || 0)}
              min="0.1"
              max="20"
            />
            <p className="text-xs text-gray-500 mt-1">How much the price fluctuates during natural trading</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="active">Symbol is active</Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Symbol'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}