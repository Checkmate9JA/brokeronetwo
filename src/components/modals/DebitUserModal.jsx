
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownCircle } from 'lucide-react';
import { User } from '@/api/entities';
import { Transaction } from '@/api/entities';

export default function DebitUserModal({ isOpen, onClose, user, onUpdate, onFeedback }) {
  const [walletType, setWalletType] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!walletType || !amount || !user) {
      return onFeedback('error', 'Invalid Input', 'Please select a wallet type and enter an amount.');
    }

    const debitAmount = parseFloat(amount);
    if (isNaN(debitAmount) || debitAmount <= 0) {
      return onFeedback('error', 'Invalid Amount', 'Please enter a valid positive amount.');
    }

    setIsSubmitting(true);
    try {
      const currentBalance = user[walletType] || 0;
      if (currentBalance < debitAmount) {
        setIsSubmitting(false);
        return onFeedback('error', 'Insufficient Funds', 'Debit amount cannot exceed wallet balance.');
      }
      
      const updatedBalances = {
        [walletType]: currentBalance - debitAmount,
        total_balance: (user.total_balance || 0) - debitAmount,
      };

      await User.update(user.id, updatedBalances);

      await Transaction.create({
        user_email: user.email,
        type: 'withdrawal',
        amount: debitAmount,
        status: 'completed',
        description: `Debited by admin: ${reason || 'No reason provided'}`,
      });

      onUpdate();
      onClose();
      onFeedback('success', 'Success!', 'User debited successfully.');
    } catch (error) {
      console.error('Error debiting user:', error);
      onFeedback('error', 'Error', 'Failed to debit user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
            <DialogTitle className="text-xl font-bold">Debit User - {user?.full_name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet-type">From Wallet</Label>
            <Select value={walletType} onValueChange={setWalletType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select wallet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading_wallet">Trading Wallet (${(user?.trading_wallet || 0).toLocaleString()})</SelectItem>
                <SelectItem value="profit_wallet">Profit (${(user?.profit_wallet || 0).toLocaleString()})</SelectItem>
                <SelectItem value="deposit_wallet">Deposit (${(user?.deposit_wallet || 0).toLocaleString()})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for debit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 h-20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !walletType || !amount}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Processing...' : 'Debit User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
