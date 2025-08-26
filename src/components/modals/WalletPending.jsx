
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Clock, X } from 'lucide-react';

export default function WalletPending({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Activate Withdrawal</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <p className="text-sm text-gray-500 pt-2">
            Verify your withdrawal eligibility before proceeding
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Wallet Connection Status</h3>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="w-6 h-6 text-orange-600" />
              <div>
                <div className="font-medium text-gray-700">Submitted wallet pending validation</div>
                <div className="text-sm text-gray-600">Please wait for admin approval</div>
              </div>
            </div>
          </div>

          <Button 
            disabled
            className="w-full bg-gray-400 text-white py-3 cursor-not-allowed"
          >
            Proceed to Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
