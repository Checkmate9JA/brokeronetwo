
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
import { TradingPosition } from '@/api/entities';
import { User } from '@/api/entities';
import { AdminSetting } from '@/api/entities';

export default function PlaceTradeModal({ isOpen, onClose, symbol, tradeDirection, user, onSuccess, onFeedback }) {
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
    try {
      const settings = await AdminSetting.list();
      const minSetting = settings.find(s => s.setting_key === 'min_regular_trade_amount');
      if (minSetting) {
        const minAmount = parseFloat(minSetting.setting_value) || 10;
        setMinimumAmount(minAmount);
        setFormData(prev => ({
          ...prev,
          investment_amount: Math.max(prev.investment_amount, minAmount)
        }));
      }
    } catch (error) {
      console.error('Error loading minimum amount:', error);
      // Fallback to default minimum if loading fails
      setMinimumAmount(10);
    }
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
    if (!symbol || !user) return;

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
        user_email: user.email,
        symbol_id: symbol.id,
        symbol_code: symbol.symbol,
        trade_direction: tradeDirection,
        investment_amount: formData.investment_amount,
        leverage: formData.leverage,
        entry_price: symbol.current_price || 45230,
        current_price: symbol.current_price || 45230,
        profit_loss_amount: 0,
        profit_loss_percentage: 0,
        status: 'open',
        stop_loss_price: (symbol.current_price || 45230) * (1 - formData.stop_loss_percentage / 100),
        take_profit_price: (symbol.current_price || 45230) * (1 + formData.take_profit_percentage / 100),
        opened_date: new Date().toISOString()
      };

      await TradingPosition.create(positionData);

      // Deduct amount from trading wallet
      await User.update(user.id, {
        trading_wallet: user.trading_wallet - formData.investment_amount,
        total_balance: user.total_balance - formData.investment_amount
      });

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tradeDirection === 'BUY' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            {tradeDirection} {symbol.symbol}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Price:</span>
              <span className="font-semibold">{formatCurrency(symbol.current_price || 45230)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Available Balance:</span>
              <span className="font-semibold">{formatCurrency(user?.trading_wallet || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Minimum Amount:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(minimumAmount)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="investment-amount">Investment Amount ($) *</Label>
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
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {formatCurrency(minimumAmount)} • Maximum: {formatCurrency(user?.trading_wallet || 0)}
            </p>
          </div>

          <div>
            <Label htmlFor="leverage">Leverage</Label>
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
              <Label htmlFor="stop-loss">Stop Loss (%)</Label>
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
              <Label htmlFor="take-profit">Take Profit (%)</Label>
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700">Potential Profit (5% move):</span>
              <span className="font-semibold text-blue-700">{formatCurrency(calculatePotentialProfit())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Leverage Effect:</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {formData.leverage} multiplier
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
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
