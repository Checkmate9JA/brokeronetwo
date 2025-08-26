
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, X } from 'lucide-react'; // X is no longer directly used in the header but might be used elsewhere or kept for future use.
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

export default function TransferModal({ 
  isOpen, 
  onClose, 
  fromWallet, 
  toWallet = "Trading Wallet",
  user,
  onSuccess,
  onFeedback
}) {
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const walletSourceMap = {
    'Deposit Wallet': 'deposit_wallet',
    'Profit Wallet': 'profit_wallet',
  };

  const walletKey = walletSourceMap[fromWallet];
  const availableAmount = user ? (user[walletKey] || 0) : 0;

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      onFeedback('error', 'Invalid Amount', 'Please enter a valid amount to transfer.');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount > availableAmount) {
      onFeedback('error', 'Insufficient Funds', 'You do not have enough funds to make this transfer.');
      return;
    }

    setIsTransferring(true);
    try {
      const updatedUserData = {
        [walletKey]: availableAmount - transferAmount,
        trading_wallet: (user.trading_wallet || 0) + transferAmount,
        total_balance: user.total_balance // Total balance doesn't change
      };

      await User.update(user.id, updatedUserData);

      await Transaction.create({
        user_email: user.email,
        type: 'transfer',
        amount: transferAmount,
        status: 'completed',
        description: `Transfer from ${fromWallet} to ${toWallet}`
      });
      
      onFeedback('success', 'Transfer Successful', `${formatCurrency(transferAmount)} has been transferred to your Trading Wallet.`);
      onSuccess(); // Refresh dashboard data
      onClose();

    } catch (error) {
      console.error('Transfer failed:', error);
      onFeedback('error', 'Transfer Failed', 'An error occurred during the transfer. Please try again.');
    } finally {
      setIsTransferring(false);
      setAmount('');
    }
  };

  const handleMaxClick = () => {
    setAmount(availableAmount.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Transfer Funds</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-6">
          Transfer funds from your {fromWallet} to {toWallet}
        </p>

        <div className="flex items-center justify-around mb-6 text-center">
          <div>
            <div className="text-sm text-gray-500">{fromWallet}</div>
            <div className="text-2xl font-bold">{formatCurrency(availableAmount)}</div>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">{toWallet}</div>
            <div className="text-2xl font-bold text-green-500">
              + {formatCurrency(parseFloat(amount) || 0)}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="transfer-amount" className="text-sm font-medium text-gray-700">
            Transfer Amount
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input
              id="transfer-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                type="button"
                variant="ghost"
                className="text-blue-600 h-full"
                onClick={handleMaxClick}
              >
                Max
              </Button>
            </div>
          </div>
           <p className="text-xs text-gray-500 mt-1">Available: {formatCurrency(availableAmount)}</p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleTransfer} disabled={isTransferring} className="bg-gray-800 hover:bg-gray-900">
            {isTransferring ? 'Transferring...' : 'Transfer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
