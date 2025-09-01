import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, TrendingUp, Gift } from 'lucide-react';

const iconMap = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight, 
  transfer: ArrowRightLeft,
  profit: TrendingUp,
  bonus: Gift
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }) + ', ' + date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function TransactionItem({ transaction }) {
  const Icon = iconMap[transaction.type] || ArrowRightLeft;
  
  const getIconColor = () => {
    switch(transaction.type) {
      case 'deposit': return 'text-green-600 bg-green-50 dark:text-green-600 dark:bg-green-900/30';
      case 'withdrawal': return 'text-red-600 bg-red-50 dark:text-red-600 dark:bg-green-900/30';
      case 'profit': return 'text-green-600 bg-green-50 dark:text-green-600 dark:bg-green-900/30';
      case 'bonus': return 'text-purple-600 bg-purple-50 dark:text-purple-600 dark:bg-purple-900/30';
      default: return 'text-blue-600 bg-blue-50 dark:text-blue-600 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${getIconColor()}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white capitalize">{transaction.type}</div>
          <div className="text-sm text-gray-500 dark:text-white">{transaction.description || 'No description provided'}</div>
          <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">{formatTime(transaction.created_date)}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`font-semibold ${
          transaction.type === 'withdrawal' ? 'text-red-600 dark:text-white' : 'text-green-600 dark:text-white'
        }`}>
          {transaction.type === 'withdrawal' ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </div>
        <Badge 
          variant="outline" 
          className={`mt-1 ${
            transaction.status === 'completed' ? 'text-green-700 border-green-200 dark:text-white dark:border-green-300' :
            transaction.status === 'pending' ? 'text-yellow-700 border-yellow-200 dark:text-white dark:border-yellow-300' :
            'text-red-700 border-red-200 dark:text-white dark:border-red-300'
          }`}
        >
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}