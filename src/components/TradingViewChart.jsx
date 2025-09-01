import React, { useEffect, useRef } from 'react';

export default function TradingViewChart() {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: 'BINANCE:BTCUSDT',
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: container.current.id,
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          gridColor: '#f0f0f0',
          borderColor: '#e0e0e0',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
        <p className="text-sm text-gray-500">Real-time trading chart</p>
      </div>
      <div 
        id="tradingview_chart" 
        ref={container}
        className="w-full h-96 rounded-lg overflow-hidden"
      />
    </div>
  );
}
