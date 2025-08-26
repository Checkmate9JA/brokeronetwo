
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

export default function TradingChart({ symbol }) {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => {
    if (symbol) {
      generateInitialData();
      const interval = setInterval(updateChart, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [symbol]);

  const generateInitialData = () => {
    const basePrice = symbol?.current_price || 45230;
    setCurrentPrice(basePrice);
    
    const initialData = [];
    let price = basePrice * 0.98; // Start slightly below current price
    
    // Generate 20 data points with mostly upward trend
    for (let i = 0; i < 20; i++) {
      const time = new Date(Date.now() - (19 - i) * 60000); // Every minute back
      
      // Create mostly upward movement (70% chance of increase)
      const changePercent = Math.random() < 0.7 
        ? Math.random() * 0.8 + 0.1  // Small positive change (0.1% to 0.9%)
        : Math.random() * -0.3;      // Small negative change (0% to -0.3%)
      
      price = price * (1 + changePercent / 100);
      
      initialData.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: Math.round(price * 100) / 100,
        timestamp: time.getTime()
      });
    }
    
    setChartData(initialData);
    const finalPrice = initialData[initialData.length - 1].price;
    setCurrentPrice(finalPrice);
    setPriceChange(((finalPrice - basePrice) / basePrice) * 100);
  };

  const updateChart = () => {
    setChartData(prevData => {
      if (prevData.length === 0) return prevData;
      
      const lastPrice = prevData[prevData.length - 1].price;
      const now = new Date();
      
      // Generate mostly positive movement
      const changePercent = Math.random() < 0.72 
        ? Math.random() * 1.2 + 0.1  // Positive change (0.1% to 1.3%)
        : Math.random() * -0.5;      // Negative change (0% to -0.5%)
      
      const newPrice = Math.round(lastPrice * (1 + changePercent / 100) * 100) / 100;
      
      const newDataPoint = {
        time: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: newPrice,
        timestamp: now.getTime()
      };
      
      // Keep only last 20 points for smooth animation
      const newData = [...prevData.slice(1), newDataPoint];
      
      // Update current price and change
      const basePrice = symbol?.current_price || 45230;
      setCurrentPrice(newPrice);
      setPriceChange(((newPrice - basePrice) / basePrice) * 100);
      
      return newData;
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{`Time: ${label}`}</p>
          <p className="text-sm font-semibold text-gray-900">
            {`Price: ${formatPrice(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!symbol) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Select a symbol to view chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">{symbol.symbol}</h4>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(currentPrice)}
          </span>
          <span className={`text-sm font-medium ${
            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 10', 'dataMax + 10']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10B981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#10B981' }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
