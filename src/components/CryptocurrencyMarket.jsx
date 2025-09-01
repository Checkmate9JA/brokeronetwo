import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CryptocurrencyMarket() {
  // Mock data - in a real app, this would come from an API
  const cryptoData = [
    {
      name: 'Bitcoin (BTC)',
      icon: '🟠',
      mktCap: '2.16T',
      fdMktCap: '2.28T',
      price: '108,481',
      availCoins: '19.91M',
      totalCoins: '21M',
      change: '+2.5%'
    },
    {
      name: 'Ethereum (ETH)',
      icon: '🟣',
      mktCap: '526.21B',
      fdMktCap: '526.21B',
      price: '4,359.39',
      availCoins: '120.71M',
      totalCoins: '120.71M',
      change: '+1.8%'
    },
    {
      name: 'Tether USDt (USDT)',
      icon: '🔵',
      mktCap: '167.61B',
      fdMktCap: '171.76B',
      price: '1.00016',
      availCoins: '167.59B',
      totalCoins: '171.73B',
      change: '+0.01%'
    },
    {
      name: 'XRP (XRP)',
      icon: '⚪',
      mktCap: '167.59B',
      fdMktCap: '281.75B',
      price: '2.81745',
      availCoins: '59.48B',
      totalCoins: '100B',
      change: '+3.2%'
    }
  ];

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cryptocurrency Market</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{cryptoData.length} MATCHES</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">NAME</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">MKT CAP</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">PRICE</th>
                <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">CHANGE</th>
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((crypto, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{crypto.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{crypto.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{crypto.mktCap}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-2 text-gray-900 dark:text-white">{crypto.mktCap}</td>
                  <td className="text-right py-2 text-gray-900 dark:text-white">{crypto.price}</td>
                  <td className="text-right py-2">
                    <span className="text-green-600 font-medium">{crypto.change}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-center">
          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            View All Cryptocurrencies →
          </button>
        </div>
      </div>
    </Card>
  );
}
