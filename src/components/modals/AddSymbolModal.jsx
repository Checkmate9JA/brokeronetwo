
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
// The Switch component is not present in the provided outline for the new structure,
// implying it's removed. If it needs to be preserved, it should be re-added.
// import { Switch } from "@/components/ui/switch"; // Removed based on outline
import { TradingSymbol } from '@/api/entities';
import { TradingInstrument } from '@/api/entities'; // No longer needed for loading instruments, but might be useful for type hints if instrument prop is of this type.
import { Plus } from 'lucide-react'; // Plus icon removed from DialogTitle based on outline

export default function AddSymbolModal({ isOpen, onClose, instrument, onSuccess, onFeedback }) {
  const [formData, setFormData] = useState({
    instrument_id: instrument?.id || '', // Initialize with instrument.id if provided
    symbol: '',
    name: '',
    current_price: 0,
    admin_controlled_outcome: 'auto',
    profit_percentage: 5,
    loss_percentage: 3,
    price_volatility: 2,
    is_active: true // Preserving this property in state, though its control (Switch) is removed in outline
  });
  // instruments state and loadInstruments function are removed as instrument selection is no longer a feature in the outlined modal.
  // const [instruments, setInstruments] = useState([]); // Removed
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If modal opens and an instrument object is provided, update instrument_id in form data
    if (isOpen && instrument?.id) {
      setFormData(prev => ({
        ...prev,
        instrument_id: instrument.id
      }));
    }
    // No need to load instruments if the selection dropdown is removed.
  }, [isOpen, instrument]);

  // loadInstruments function removed

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for instrument_id if it's missing (should not happen if `instrument` prop is always provided)
    if (!formData.instrument_id) {
      onFeedback('error', 'Missing Instrument', 'Please provide a trading instrument.');
      return;
    }

    setIsSubmitting(true);
    try {
      await TradingSymbol.create(formData);
      onFeedback('success', 'Symbol Added', 'Trading symbol has been created successfully.');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        instrument_id: instrument?.id || '', // Reset with current instrument.id or empty
        symbol: '',
        name: '',
        current_price: 0,
        admin_controlled_outcome: 'auto',
        profit_percentage: 5,
        loss_percentage: 3,
        price_volatility: 2,
        is_active: true
      });
    } catch (error) {
      console.error('Error creating symbol:', error);
      onFeedback('error', 'Creation Failed', `Failed to create trading symbol: ${error.message || 'Unknown error'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] md:max-h-none flex flex-col">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b md:static md:border-b-0 md:pb-0">
          <DialogTitle>Add Trading Symbol</DialogTitle>
          {instrument && (
            <p className="text-sm text-gray-500">Adding symbol to {instrument.name}</p>
          )}
        </DialogHeader>

        {/* The form content is wrapped in a scrollable div */}
        <div className="flex-1 overflow-y-auto p-1 md:overflow-y-visible md:p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Instrument selection dropdown is removed as per outline */}

            <div>
              <Label htmlFor="symbol">Symbol Code *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                placeholder="e.g., BTC/USD"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Symbol Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Bitcoin to USD"
                required
              />
            </div>

            <div>
              <Label htmlFor="current_price">Current Price ($)</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.current_price}
                onChange={(e) => handleChange('current_price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="admin_controlled_outcome">Admin Control</Label>
              <Select value={formData.admin_controlled_outcome} onValueChange={(value) => handleChange('admin_controlled_outcome', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic (Natural Trading)</SelectItem>
                  <SelectItem value="force_profit">Force Profit (Always Win)</SelectItem>
                  <SelectItem value="force_loss">Force Loss (Always Lose)</SelectItem>
                </SelectContent>
              </Select>
              {/* <p className="text-xs text-gray-500 mt-1">Control whether trades on this symbol always profit or lose</p> Removed from outline */}
            </div>

            {/* Profit and Loss percentage fields are always visible as per outline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profit_percentage">Profit % (when forced)</Label>
                <Input
                  id="profit_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.profit_percentage}
                  onChange={(e) => handleChange('profit_percentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="loss_percentage">Loss % (when forced)</Label>
                <Input
                  id="loss_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.loss_percentage}
                  onChange={(e) => handleChange('loss_percentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price_volatility">Price Volatility %</Label>
              <Input
                id="price_volatility"
                type="number"
                step="0.1"
                min="0"
                value={formData.price_volatility}
                onChange={(e) => handleChange('price_volatility', parseFloat(e.target.value) || 0)}
              />
              {/* <p className="text-xs text-gray-500 mt-1">How much the price fluctuates during natural trading</p> Removed from outline */}
            </div>

            {/* is_active switch is removed from the outline. If it needs to be preserved, it should be added back here */}
            {/*
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
              <Label htmlFor="active">Symbol is active</Label>
            </div>
            */}
          </form>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 md:static md:border-t-0 md:pt-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {/* Submit button is now outside the form element, so onClick={handleSubmit} is necessary */}
          <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Adding...' : 'Add Symbol'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
