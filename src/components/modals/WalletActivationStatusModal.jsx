
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Wallet, XCircle, CheckCircle } from 'lucide-react';

export default function WalletActivationStatusModal({ isOpen, onClose, isActivated, activationFee = 100, onMakeDeposit }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Wallet Activation Status</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            {isActivated ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-green-600">Wallet Activated</h2>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-lg font-semibold text-red-600">Wallet Not Activated</h2>
              </>
            )}
          </div>
          
          {!isActivated && (
            <>
              <p className="text-gray-600 mb-6 leading-relaxed">
                To activate your wallet and unlock full functionality, you need to deposit <span className="font-bold">${activationFee}</span> worth of crypto to your wallet.
              </p>
              
              <Button 
                onClick={onMakeDeposit}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Make your Deposit
              </Button>
            </>
          )}
          
          {isActivated && (
            <p className="text-gray-600">
              Your wallet is fully activated and ready to use. You can now access all features and functionality.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
