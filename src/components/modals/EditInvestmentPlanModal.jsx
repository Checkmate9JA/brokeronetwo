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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabase';
import { Edit } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function EditInvestmentPlanModal({ isOpen, onClose, plan, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    roi_percentage: '',
    duration_days: '',
    min_deposit: '',
    max_deposit: '',
    risk_level: 'medium',
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    if (plan && isOpen) {
      setFormData({
        name: plan.name || '',
        roi_percentage: plan.roi_percentage?.toString() || '',
        duration_days: plan.duration_days?.toString() || '',
        min_deposit: plan.min_deposit?.toString() || '',
        max_deposit: plan.max_deposit?.toString() || '',
        risk_level: plan.risk_level || 'medium',
        description: plan.description || '',
        is_active: plan.is_active !== undefined ? plan.is_active : true
      });
    }
  }, [plan, isOpen]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plan) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        roi_percentage: parseFloat(formData.roi_percentage),
        duration_days: parseInt(formData.duration_days),
        min_deposit: parseFloat(formData.min_deposit),
        max_deposit: parseFloat(formData.max_deposit)
      };

      const { data, error } = await supabase
        .from('investment_plans')
        .update(payload)
        .eq('id', plan.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update investment plan: ${error.message}`);
      }
      showFeedback('success', 'Success!', 'Investment plan updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating investment plan:', error);
      showFeedback('error', 'Update Failed', 'Failed to update investment plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Investment Plan
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Premium Growth Plan"
                  required
                />
              </div>
              <div>
                <Label htmlFor="roi">ROI Percentage *</Label>
                <Input
                  id="roi"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.roi_percentage}
                  onChange={(e) => handleChange('roi_percentage', e.target.value)}
                  placeholder="e.g., 15.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => handleChange('duration_days', e.target.value)}
                  placeholder="e.g., 30"
                  required
                />
              </div>
              <div>
                <Label htmlFor="risk">Risk Level</Label>
                <Select value={formData.risk_level} onValueChange={(value) => handleChange('risk_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min">Minimum Deposit ($)</Label>
                <Input
                  id="min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_deposit}
                  onChange={(e) => handleChange('min_deposit', e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <Label htmlFor="max">Maximum Deposit ($)</Label>
                <Input
                  id="max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.max_deposit}
                  onChange={(e) => handleChange('max_deposit', e.target.value)}
                  placeholder="e.g., 10000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the investment plan..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
              <Label htmlFor="active">Plan is active</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Plan'}
              </Button>
            </DialogFooter>
          </form>
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