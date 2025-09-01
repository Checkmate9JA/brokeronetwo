import React from 'react';
import { Card } from "@/components/ui/card";

export default function StockMarketData() {
  // Mock data - in a real app, this would come from an API
  const stockData = [
    {
      name: 'NASDAQ',
      icon: '🔵',
      value: '94.74',
      change: '-0.50',
      chgPercent: '-0.52%',
      open: '95.38',
      high: '95.75',
      low: '94.41',
      isPositive: false
    },
    {
      name: 'APPLE STOCK',
      icon: '🍎',
      value: '232.14',
      change: '-0.42',
      chgPercent: '-0.18%',
      open: '232.51',
      high: '233.38',
      low: '231.37',
      isPositive: false
    },
    {
      name: 'GOOGL',
      icon: '🔴',
      value: '212.91',
      change: '+1.27',
      chgPercent: '+0.60%',
      open: '210.51',
      high: '214.65',
      low: '210.20',
      isPositive: true
    },
    {
      name: 'AMZN',
      icon: '🟠',
      value: '229.00',
      change: '-2.60',
      chgPercent: '-1.12%',
      open: '231.32',
      high: '231.81',
      low: '228.16',
      isPositive: false
    },
    {
      name: 'TSLA',
      icon: '🔵',
      value: '1.81',
      change: '-0.02',
      chgPercent: '-1.09%',
      open: '1.83',
      high: '1.86',
      low: '1.70',
      isPositive: false
    }
  ];

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Market Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time stock prices</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Name</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Value</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Change</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Chg%</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((stock, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stock.icon}</span>
                      <div className="font-medium text-gray-900 dark:text-white">{stock.name}</div>
                    </div>
                  </td>
                  <td className="text-right py-2 text-gray-900 dark:text-white">{stock.value}</td>
                  <td className="text-right py-2">
                    <span className={`font-medium ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change}
                    </span>
                  </td>
                  <td className="text-right py-2">
                    <span className={`font-medium ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.chgPercent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Stocks →
          </button>
        </div>
      </div>
    </Card>
  );
}
