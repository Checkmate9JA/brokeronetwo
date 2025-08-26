
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  // DialogClose is no longer directly used for the custom close button,
  // relying on the default one provided by DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, DollarSign } from 'lucide-react';

export default function ActivationFeeModal({ isOpen, onClose, currentFee = 100, onSave }) {
  const [fee, setFee] = useState(currentFee.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const feeAmount = parseFloat(fee);
    if (isNaN(feeAmount) || feeAmount <= 0) {
      alert('Please enter a valid activation fee amount.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(feeAmount);
      onClose();
    } catch (error) {
      console.error('Error saving activation fee:', error);
      alert('Failed to save activation fee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <DialogTitle className="text-xl font-bold">Set Activation Fee</DialogTitle>
          </div>
          {/* Removed the custom DialogClose button as DialogContent provides one by default */}
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="activation-fee">Activation Fee Amount ($)</Label>
            <Input
              id="activation-fee"
              type="number"
              placeholder="100"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="mt-2"
              min="1"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-2">
              This amount will be displayed to users as the required deposit for wallet activation.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !fee || parseFloat(fee) <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? 'Saving...' : 'Save Fee'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
