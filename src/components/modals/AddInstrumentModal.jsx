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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

const iconOptions = [
  '📈', '💰', '₿', '💱', '🌍', '📊', '🏢', '💹', '📉', '🔼', '🔽'
];

export default function AddInstrumentModal({ isOpen, onClose, onSuccess, onFeedback }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    market_type: 'spot',
    leverage_options: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Creating trading instrument with data:', formData);
      
      // Insert the trading instrument into Supabase
      const { data, error } = await supabase
        .from('trading_instruments')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon || null,
          market_type: formData.market_type,
          leverage_options: formData.leverage_options || null,
          is_active: formData.is_active
        }])
        .select();

      if (error) {
        console.error('❌ Error creating trading instrument:', error);
        throw new Error(`Failed to create trading instrument: ${error.message}`);
      }

      console.log('✅ Trading instrument created successfully:', data);
      
      // Show success feedback
      onFeedback('success', 'Success!', 'Trading instrument created successfully.');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: '',
        market_type: 'spot',
        leverage_options: '',
        is_active: true
      });
      
      // Close modal and refresh data
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating instrument:', error);
      onFeedback('error', 'Creation Failed', error.message || 'Failed to create trading instrument.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      market_type: 'spot',
      leverage_options: '',
      is_active: true
    });
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Add Trading Instrument
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Instrument Name *</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleChange('name', e.target.value)} 
              required 
              placeholder="e.g., Bitcoin, EUR/USD, Apple Stock"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => handleChange('description', e.target.value)} 
              placeholder="Describe the trading instrument..."
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Select value={formData.icon} onValueChange={(value) => handleChange('icon', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="market_type">Market Type</Label>
             <Select value={formData.market_type} onValueChange={(value) => handleChange('market_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select market type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="futures">Futures</SelectItem>
                <SelectItem value="options">Options</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leverage">Leverage Options</Label>
            <Input 
              id="leverage" 
              value={formData.leverage_options} 
              onChange={(e) => handleChange('leverage_options', e.target.value)} 
              placeholder="e.g., 1x, 5x, 10x"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="active" 
              checked={formData.is_active} 
              onCheckedChange={(checked) => handleChange('is_active', checked)} 
            />
            <Label htmlFor="active">Instrument is active</Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Instrument'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}