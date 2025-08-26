
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WalletNotConnected({ isOpen, onClose }) {
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
            
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <div className="font-medium text-red-700">Wallet Not Connected - Please connect your wallet first</div>
              </div>
            </div>
          </div>

          <Link to={createPageUrl('ConnectWallet')} className="w-full">
            <Button 
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
