import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle, X } from 'lucide-react';

export default function WalletValidated({ isOpen, onClose, onProceed }) {
  const handleProceedToWithdraw = () => {
    onClose();
    onProceed();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Activate Withdrawal</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-6">
            Verify your withdrawal eligibility before proceeding
          </p>
        
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Wallet Connection Status</h3>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-700">Submitted wallet validated successfully!</div>
                  <div className="text-sm text-green-600">You can now proceed with withdrawal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button 
            onClick={handleProceedToWithdraw}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Proceed to Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}