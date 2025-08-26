import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Wallet } from 'lucide-react';

export default function WithdrawalModalConnect({ isOpen, onClose, onProceed }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Activate Withdrawal</DialogTitle>
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
            
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-700">Wallet Connected Successfully</span>
            </div>
          </div>

          <Button 
            onClick={onProceed}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Proceed to Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}