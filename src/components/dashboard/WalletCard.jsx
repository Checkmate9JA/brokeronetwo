import React from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

const iconMap = {
  total: Wallet,
  deposit: DollarSign,
  profit: TrendingUp,
  trading: BarChart3
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export default function WalletCard({ type, title, amount, subtitle, isProfit = false }) {
  const Icon = iconMap[type];
  
  return (
    <Card className="p-6 bg-white hover:shadow-md transition-all duration-300 border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${
          type === 'total' ? 'bg-blue-50' :
          type === 'deposit' ? 'bg-gray-50' :
          type === 'profit' ? 'bg-green-50' :
          'bg-purple-50'
        }`}>
          <Icon className={`w-5 h-5 ${
            type === 'total' ? 'text-blue-600' :
            type === 'deposit' ? 'text-gray-600' :
            type === 'profit' ? 'text-green-600' :
            'text-purple-600'
          }`} />
        </div>
        <div className="flex-1 text-center">
          <h3 className="font-medium text-gray-700 text-sm">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-1 text-center">
        <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-gray-900'}`}>
          {formatCurrency(amount)}
        </div>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </Card>
  );
}