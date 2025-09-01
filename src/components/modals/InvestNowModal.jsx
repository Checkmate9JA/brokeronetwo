import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function InvestNowModal({ isOpen, onClose, plan, user, onSuccess, onFeedback }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculated, setCalculated] = useState({ profit: 0, total: 0, maturity: '' });

  useEffect(() => {
    if (plan) {
      const minAmount = plan.min_deposit || 0;
      setAmount(minAmount.toString());
      calculateReturns(minAmount);
    }
  }, [plan]);

  useEffect(() => {
    if (amount) {
      calculateReturns(parseFloat(amount));
    } else {
      setCalculated({ profit: 0, total: 0, maturity: '' });
    }
  }, [amount, plan]);
  
  const calculateReturns = (investmentAmount) => {
    if (!plan || isNaN(investmentAmount) || investmentAmount <= 0) {
      setCalculated({ profit: 0, total: 0, maturity: '' });
      return;
    }
    const profit = investmentAmount * (plan.roi_percentage / 100);
    const total = investmentAmount + profit;
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + plan.duration_days);
    setCalculated({
      profit: profit,
      total: total,
      maturity: maturityDate.toLocaleDateString()
    });
  };

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('Please enter a valid number.');
      return;
    }
    if (numValue < plan.min_deposit) {
      setError(`Amount must be at least ${formatCurrency(plan.min_deposit)}.`);
      return;
    }
    if (numValue > plan.max_deposit) {
      setError(`Amount cannot exceed ${formatCurrency(plan.max_deposit)}.`);
      return;
    }
    if (user && numValue > user.trading_wallet) {
      setError('Insufficient funds in your trading wallet.');
      return;
    }
    setError('');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleSubmit = async () => {
    validateAmount(amount);
    if (error || !amount) {
      onFeedback('error', 'Invalid Amount', error || 'Please enter a valid investment amount.');
      return;
    }

    setIsSubmitting(true);
    const investmentAmount = parseFloat(amount);
    
    try {
      console.log('🔍 Starting investment process...', {
        userId: user.id,
        userEmail: user.email,
        currentTradingWallet: user.trading_wallet,
        investmentAmount,
        planId: plan.id,
        planName: plan.name
      });

      const newTradingBalance = user.trading_wallet - investmentAmount;
      const newTotalBalance = user.total_balance - investmentAmount;

      console.log('💰 Updating user balance...', {
        newTradingBalance,
        newTotalBalance
      });

      // Update user balance using Supabase
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          trading_wallet: newTradingBalance,
          total_balance: newTotalBalance
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('❌ User balance update failed:', userUpdateError);
        throw new Error(`Failed to update user balance: ${userUpdateError.message}`);
      }

      console.log('✅ User balance updated successfully');
      
      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + plan.duration_days);

      console.log('📊 Creating investment record...', {
        user_email: user.email,
        plan_id: plan.id,
        plan_name: plan.name,
        amount_invested: investmentAmount,
        roi_percentage: plan.roi_percentage,
        duration_days: plan.duration_days,
        expected_profit: calculated.profit,
        maturity_date: maturityDate.toISOString(),
        status: 'active'
      });

      // Create investment using Supabase
      const { error: investmentError } = await supabase
        .from('user_investments')
        .insert({
          user_email: user.email,
          plan_id: plan.id,
          plan_name: plan.name,
          amount_invested: investmentAmount,
          roi_percentage: plan.roi_percentage,
          duration_days: plan.duration_days,
          expected_profit: calculated.profit,
          maturity_date: maturityDate.toISOString(),
          status: 'active'
        });

      if (investmentError) {
        console.error('❌ Investment creation failed:', investmentError);
        throw new Error(`Failed to create investment: ${investmentError.message}`);
      }

      console.log('✅ Investment record created successfully');
      
      console.log('💳 Creating transaction record...', {
        type: 'transfer',
        amount: investmentAmount,
        status: 'completed',
        description: `Investment in ${plan.name}`,
        user_email: user.email,
        created_by: user.email,
      });

      // Create transaction using Supabase
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: 'transfer',
          amount: investmentAmount,
          status: 'completed',
          description: `Investment in ${plan.name}`,
          user_email: user.email,
        });

      if (transactionError) {
        console.error('❌ Transaction creation failed:', transactionError);
        throw new Error(`Failed to create transaction: ${transactionError.message}`);
      }

      console.log('✅ Transaction record created successfully');
      console.log('🎉 Investment completed successfully!');

      onSuccess();
    } catch (err) {
      console.error('❌ Investment failed:', err);
      onFeedback('error', 'Investment Failed', err.message || 'An unexpected error occurred. Please try again.');
      // Revert balance if investment fails - ideally in a backend transaction
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-gray-900 dark:text-white">Invest in {plan.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Investment amount will be deducted from your Trading Wallet: <strong>{formatCurrency(user?.trading_wallet || 0)}</strong>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between text-sm mb-2"><span className="text-gray-600 dark:text-gray-300">ROI:</span> <strong className="dark:text-white">{plan.roi_percentage}%</strong></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-gray-600 dark:text-gray-300">Duration:</span> <strong className="dark:text-white">{plan.duration_days} days</strong></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-300">Min - Max:</span> <strong className="dark:text-white">{formatCurrency(plan.min_deposit)} - {formatCurrency(plan.max_deposit)}</strong></div>
          </div>
          
          <div>
            <Label htmlFor="amount" className="text-gray-900 dark:text-white">Investment Amount ($)</Label>
            <Input id="amount" type="number" value={amount} onChange={handleAmountChange} placeholder="Enter amount" />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
             <div className="flex justify-between text-sm mb-2"><span className="text-gray-600 dark:text-gray-300">Expected Profit:</span> <strong className="text-green-600">+{formatCurrency(calculated.profit)}</strong></div>
             <div className="flex justify-between text-sm mb-2"><span className="text-gray-600 dark:text-gray-300">Total Return:</span> <strong className="dark:text-white">{formatCurrency(calculated.total)}</strong></div>
             <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-300">Maturity Date:</span> <strong className="dark:text-white">{calculated.maturity}</strong></div>
          </div>
        </div>

                 <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
           <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</Button>
           <Button onClick={handleSubmit} disabled={isSubmitting || !!error} className="bg-blue-600 hover:bg-blue-700">
             {isSubmitting ? 'Processing...' : 'Invest Now'}
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}