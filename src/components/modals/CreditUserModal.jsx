
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose // Keep DialogClose import for other contexts if needed, but not used in Header anymore
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CreditUserModal({ isOpen, onClose, user, onUpdate, onFeedback }) {
  const [walletType, setWalletType] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!walletType || !amount || !user) {
      return onFeedback('error', 'Invalid Input', 'Please select a wallet type and enter an amount.');
    }

    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return onFeedback('error', 'Invalid Amount', 'Please enter a valid positive amount.');
    }

    setIsSubmitting(true);
    try {
      // Calculate new balances
      const updatedBalances = {
        [walletType]: parseFloat(user[walletType] || 0) + creditAmount,
        total_balance: parseFloat(user.total_balance || 0) + creditAmount,
      };

      // Update user balances in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update(updatedBalances)
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to update user balances: ${updateError.message}`);
      }

      // Create transaction record in Supabase (if transactions table exists)
      try {
        const transactionTypeMap = {
          deposit_wallet: 'deposit',
          profit_wallet: 'profit',
          trading_wallet: 'transfer',
        };

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_email: user.email,
            user_id: user.id,
            type: transactionTypeMap[walletType] || 'deposit',
            amount: creditAmount,
            status: 'completed',
            description: `Credited by admin: ${reason || 'No reason provided'}`,
            created_at: new Date().toISOString(),
          });

        if (transactionError) {
          console.warn('Transaction record creation failed:', transactionError);
          // Don't fail the credit operation if transaction logging fails
        }
      } catch (transactionErr) {
        console.warn('Transactions table not available, skipping transaction log:', transactionErr);
        // Don't fail the credit operation if transaction logging fails
      }
      
      onUpdate();
      onClose();
      onFeedback('success', 'Success!', 'User credited successfully.');
      // Reset form fields after successful submission and close
      setWalletType('');
      setAmount('');
      setReason('');
    } catch (error) {
      console.error('Error crediting user:', error);
      onFeedback('error', 'Error', 'Failed to credit user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <DialogTitle className="text-xl font-bold">Credit User - {user?.full_name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet-type">To Wallet</Label>
            <Select value={walletType} onValueChange={setWalletType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select wallet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading_wallet">Trading Wallet</SelectItem>
                <SelectItem value="profit_wallet">Profit</SelectItem>
                <SelectItem value="deposit_wallet">Deposit</SelectItem>
                {/* Referrer Bonus removed as per outline */}
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
              placeholder="Enter reason for credit..."
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
              disabled={isSubmitting || !walletType || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Processing...' : 'Credit User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
