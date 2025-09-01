import React from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';

const iconMap = {
  total: Wallet,
  deposit: DollarSign,
  profit: TrendingUp,
  trading: BarChart3
};

export default function WalletCard({ type, title, amount, subtitle, isProfit = false, userCurrency = 'USD' }) {
  const Icon = iconMap[type];
  
  return (
    <Card className={`p-6 hover:shadow-md transition-all duration-300 border-gray-100 dark:border-gray-700 ${
      type === 'total' ? 'bg-blue-50 dark:bg-blue-900/30' :
      type === 'deposit' ? 'bg-gray-100 dark:bg-gray-900/30' :
      type === 'profit' ? 'bg-green-50 dark:bg-green-900/30' :
      'bg-purple-50 dark:bg-purple-900/30'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${
          type === 'total' ? 'bg-blue-600 dark:bg-white' :
          type === 'deposit' ? 'bg-gray-600 dark:bg-white' :
          type === 'profit' ? 'bg-green-600 dark:bg-white' :
          'bg-purple-600 dark:bg-white'
        }`}>
          <Icon className={`w-5 h-5 ${
            type === 'total' ? 'text-white dark:text-blue-600' :
            type === 'deposit' ? 'text-white dark:text-gray-600' :
            type === 'profit' ? 'text-white dark:text-green-600' :
            'text-white dark:text-purple-600'
          }`} />
        </div>
        <div className="flex-1 text-center">
          <h3 className="font-medium text-gray-700 dark:text-white text-sm">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-1 text-center">
        <div className={`text-2xl font-bold ${isProfit ? 'text-green-600 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
          {formatCurrency(amount, userCurrency)}
        </div>
        <p className="text-xs text-gray-500 dark:text-white">{subtitle}</p>
      </div>
    </Card>
  );
}