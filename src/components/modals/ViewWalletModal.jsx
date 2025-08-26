import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wallet } from 'lucide-react';

export default function ViewWalletModal({ isOpen, onClose, walletAddress, cryptoType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy wallet address:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-lg font-bold">Wallet Details</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Cryptocurrency Type
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              {cryptoType || 'Not specified'}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
              {walletAddress || 'No wallet address provided'}
            </div>
          </div>

          {walletAddress && (
            <Button 
              onClick={handleCopy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Wallet Address
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}