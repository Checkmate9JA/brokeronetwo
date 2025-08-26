
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Key, Copy, Check } from 'lucide-react';

export default function WithdrawalCodeModal({ isOpen, onClose, user }) {
  const [copyStatus, setCopyStatus] = useState(false);

  const handleCopyCode = () => {
    if (user?.withdrawal_code) {
      navigator.clipboard.writeText(user.withdrawal_code).then(() => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      }).catch(err => {
        console.error('Failed to copy withdrawal code:', err);
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Withdrawal Code</DialogTitle>
          </div>
          {/* The DialogClose button was removed as per the instruction */}
        </DialogHeader>
        
        <div className="py-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user?.full_name?.toUpperCase() || 'USER'}
            </h3>
            <p className="text-sm text-gray-500">
              Unique withdrawal code for this user
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Withdrawal Code</p>
                <p className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                  {user?.withdrawal_code || 'N/A'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="ml-4"
                disabled={!user?.withdrawal_code}
              >
                {copyStatus ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            This code is required for withdrawal verification
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
