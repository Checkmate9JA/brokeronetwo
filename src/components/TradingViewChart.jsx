import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function TradingViewChart() {
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const [chartUrl, setChartUrl] = useState('');

  useEffect(() => {
    // Update chart URL when theme changes
    const theme = isDarkMode ? 'dark' : 'light';
    const backgroundColor = isDarkMode ? '%231a1a1a' : '%23ffffff';
    const gridColor = isDarkMode ? '%23333333' : '%23f0f0f0';
    const borderColor = isDarkMode ? '%23444444' : '%23e0e0e0';
    const toolbarBg = isDarkMode ? '%23222222' : '%23f1f3f6';
    
    const url = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_&symbol=BINANCE%3ABTCUSDT&interval=D&hidesidetoolbar=0&hidetrading=1&theme=${theme}&style=1&backgroundColor=${backgroundColor}&gridColor=${gridColor}&borderColor=${borderColor}&locale=en&toolbar_bg=${toolbarBg}&enable_publishing=0&allow_symbol_change=1&save_image=0&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%5D&show_popup_button=0&popup_width=1000&popup_height=650&referral_id=12345`;
    
    setChartUrl(url);
  }, [isDarkMode]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-[600px] transition-colors">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Overview</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time trading chart</p>
      </div>
      
      {isLoading && (
        <div className="w-full h-[520px] rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading chart...</p>
          </div>
        </div>
      )}
      
      <div className="w-full h-[520px] rounded-lg overflow-hidden">
        {chartUrl && (
          <iframe
            src={chartUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            onLoad={handleLoad}
            onError={handleError}
            title="TradingView Chart"
          />
        )}
      </div>
    </div>
  );
}
