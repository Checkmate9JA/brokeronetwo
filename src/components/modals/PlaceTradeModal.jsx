
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function PlaceTradeModal({ isOpen, onClose, symbol, tradeDirection, user, onSuccess, onFeedback }) {
  const { user: authUser } = useAuth();
  console.log('🔍 PlaceTradeModal props:', { isOpen, symbol, tradeDirection, user: user ? { email: user.email, id: user.id } : null });
  console.log('🔍 Auth context user:', authUser ? { email: authUser.email, id: authUser.id } : null);
  
  const [formData, setFormData] = useState({
    investment_amount: 100,
    leverage: '1x',
    stop_loss_percentage: 5,
    take_profit_percentage: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minimumAmount, setMinimumAmount] = useState(10);

  useEffect(() => {
    if (isOpen) {
      loadMinimumAmount();
    }
  }, [isOpen]);

  const loadMinimumAmount = async () => {
    // Use default minimum amount since we're not loading from AdminSetting
    const minAmount = 10;
    setMinimumAmount(minAmount);
    setFormData(prev => ({
      ...prev,
      investment_amount: Math.max(prev.investment_amount, minAmount)
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculatePotentialProfit = () => {
    const leverageMultiplier = parseFloat(formData.leverage.replace('x', ''));
    const baseProfit = formData.investment_amount * 0.05; // 5% example profit
    return baseProfit * leverageMultiplier;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !user) {
      onFeedback('error', 'Missing Data', 'Symbol or user information is missing.');
      return;
    }

    if (!user.email) {
      onFeedback('error', 'User Error', 'User email is missing. Please log in again.');
      return;
    }

    if (!authUser || !authUser.email) {
      onFeedback('error', 'Authentication Error', 'You are not properly authenticated. Please log in again.');
      return;
    }

    // Use the authenticated user's email from the auth context
    const userEmail = authUser.email;

    if (!symbol.id) {
      onFeedback('error', 'Symbol Error', 'Symbol ID is missing. Please select a valid symbol.');
      return;
    }

    // Check minimum investment amount
    if (formData.investment_amount < minimumAmount) {
      onFeedback('error', 'Amount Too Low', `Minimum investment amount is ${formatCurrency(minimumAmount)}.`);
      return;
    }

    // Check if user has sufficient balance
    if (formData.investment_amount > user.trading_wallet) {
      onFeedback('error', 'Insufficient Balance', 'You do not have enough funds in your trading wallet.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create trading position
      const positionData = {
        user_email: userEmail, // Use authenticated user's email
        symbol_id: symbol.id,
        symbol_code: symbol.symbol,
        trade_direction: tradeDirection,
        investment_amount: formData.investment_amount,
        leverage: formData.leverage,
        entry_price: symbol.current_price || 100,
        current_price: symbol.current_price || 100,
        profit_loss_amount: 0,
        profit_loss_percentage: 0,
        status: 'open',
        stop_loss_price: (symbol.current_price || 100) * (1 - formData.stop_loss_percentage / 100),
        take_profit_price: (symbol.current_price || 100) * (1 + formData.take_profit_percentage / 100)
        // opened_date will be set automatically by the database
      };

      console.log('🔍 Creating trading position with data:', positionData);
      
      // First, test if we can read from the table (this will help debug RLS issues)
      const { data: testRead, error: testError } = await supabase
        .from('trading_positions')
        .select('id')
        .eq('user_email', userEmail)
        .limit(1);
      
      if (testError) {
        console.error('❌ Test read failed:', testError);
        throw new Error(`Cannot access trading_positions table: ${testError.message}`);
      }
      
      console.log('✅ Test read successful, existing positions:', testRead?.length || 0);
      
      // Check current Supabase session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session check failed:', sessionError);
      } else {
        console.log('🔍 Current session:', sessionData.session ? 'Authenticated' : 'No session');
      }
      
      // Create trading position using Supabase
      const { data: position, error: positionError } = await supabase
        .from('trading_positions')
        .insert(positionData)
        .select()
        .single();

      if (positionError) {
        console.error('Error creating position:', positionError);
        throw new Error(`Failed to create trading position: ${positionError.message}`);
      }

      // Deduct amount from trading wallet using Supabase
      const { error: userError } = await supabase
        .from('users')
        .update({
          trading_wallet: user.trading_wallet - formData.investment_amount,
          total_balance: user.total_balance - formData.investment_amount
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user wallet:', userError);
        throw new Error(`Failed to update user wallet: ${userError.message}`);
      }

      console.log('✅ Trading position created successfully:', position);
      console.log('✅ User wallet updated successfully');

      onFeedback('success', 'Trade Placed', `Your ${tradeDirection} order for ${symbol.symbol} has been placed successfully.`);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        investment_amount: Math.max(100, minimumAmount), // Ensure reset value respects minimum amount
        leverage: '1x',
        stop_loss_percentage: 5,
        take_profit_percentage: 10
      });
    } catch (error) {
      console.error('Error placing trade:', error);
      onFeedback('error', 'Trade Failed', 'Failed to place your trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!symbol) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            {tradeDirection === 'BUY' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            {tradeDirection} {symbol.symbol}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Current Price:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(symbol.current_price || 45230)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Available Balance:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(user?.trading_wallet || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Minimum Amount:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(minimumAmount)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="investment-amount" className="text-gray-900 dark:text-white">Investment Amount ($) *</Label>
            <Input
              id="investment-amount"
              type="number"
              step="1"
              value={formData.investment_amount}
              onChange={(e) => handleChange('investment_amount', parseFloat(e.target.value) || 0)}
              min={minimumAmount}
              max={user?.trading_wallet || 0}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum: {formatCurrency(minimumAmount)} • Maximum: {formatCurrency(user?.trading_wallet || 0)}
            </p>
          </div>

          <div>
            <Label htmlFor="leverage" className="text-gray-900 dark:text-white">Leverage</Label>
            <Select value={formData.leverage} onValueChange={(value) => handleChange('leverage', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1x">1x (No Leverage)</SelectItem>
                <SelectItem value="5x">5x Leverage</SelectItem>
                <SelectItem value="10x">10x Leverage</SelectItem>
                <SelectItem value="20x">20x Leverage</SelectItem>
                <SelectItem value="50x">50x Leverage</SelectItem>
                <SelectItem value="100x">100x Leverage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stop-loss" className="text-gray-900 dark:text-white">Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.1"
                value={formData.stop_loss_percentage}
                onChange={(e) => handleChange('stop_loss_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="take-profit" className="text-gray-900 dark:text-white">Take Profit (%)</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.1"
                value={formData.take_profit_percentage}
                onChange={(e) => handleChange('take_profit_percentage', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="1000"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-200">Potential Profit (5% move):</span>
              <span className="font-semibold text-blue-700 dark:text-blue-200">{formatCurrency(calculatePotentialProfit())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-200">Leverage Effect:</span>
              <Badge variant="outline" className="text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                {formData.leverage} multiplier
              </Badge>
            </div>
          </div>

                     <DialogFooter className="gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
             <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
               Cancel
             </Button>
             <Button 
               type="submit" 
               disabled={isSubmitting || formData.investment_amount > (user?.trading_wallet || 0) || formData.investment_amount < minimumAmount}
               className={tradeDirection === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
             >
               {isSubmitting ? 'Placing Trade...' : `${tradeDirection} ${symbol.symbol}`}
             </Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
