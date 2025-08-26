
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, X } from 'lucide-react';

export default function WalletBreakdownModal({ isOpen, onClose, user }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-lg font-bold">Wallet Breakdown</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-gray-700">Deposit Wallet:</span>
            <span className="font-bold text-blue-600">{formatCurrency(user?.deposit_wallet)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-medium text-gray-700">Profit Wallet:</span>
            <span className="font-bold text-green-600">{formatCurrency(user?.profit_wallet)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <span className="font-medium text-gray-700">Trading Wallet:</span>
            <span className="font-bold text-purple-600">{formatCurrency(user?.trading_wallet)}</span>
          </div>

          <hr className="my-4" />

          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
            <span className="font-bold text-gray-800">Total Balance:</span>
            <span className="font-bold text-xl text-gray-900">{formatCurrency(user?.total_balance)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
