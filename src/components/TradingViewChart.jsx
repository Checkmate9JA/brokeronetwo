import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Render the official TradingView widget via tv.js with lazy load and robust fallback
export default function TradingViewChart() {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const { isDarkMode } = useTheme();

  // Lazy reveal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      });
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Load tv.js once
  const ensureScript = () => new Promise((resolve, reject) => {
    if (window.TradingView) return resolve();
    const existing = document.querySelector('script[data-tvjs]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/tv.js';
    s.async = true;
    s.dataset.tvjs = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('tv.js failed'));
    document.head.appendChild(s);
  });

  // Create widget
  const createWidget = () => {
    if (!containerRef.current || !window.TradingView) return;
    // Cleanup previous
    if (widgetRef.current?.remove) {
      try { widgetRef.current.remove(); } catch {}
    }

    const theme = isDarkMode ? 'dark' : 'light';
    const options = {
      symbol: 'BINANCE:BTCUSDT',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: ['RSI@tv-basicstudies'],
      container_id: containerRef.current.id,
      autosize: true,
      backgroundColor: isDarkMode ? '#0b1220' : '#ffffff',
    };
    try {
      widgetRef.current = new window.TradingView.widget(options);
    } catch (e) {
      setFailed(true);
    }
  };

  // Init when visible or theme changes
  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;
    (async () => {
      try {
        await ensureScript();
        if (!cancelled) createWidget();
        // Fallback to iframe if tv.js takes too long
        const fallbackTimer = setTimeout(() => {
          if (!widgetRef.current) setFailed(true);
        }, 8000);
        return () => clearTimeout(fallbackTimer);
      } catch (e) {
        setFailed(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Recreate on theme change
  useEffect(() => {
    if (isVisible && window.TradingView) {
      createWidget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-[600px] transition-colors">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Overview</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time trading chart</p>
      </div>

      {/* Widget / Fallback container */}
      <div className="w-full h-[520px] rounded-lg overflow-hidden" ref={containerRef} id="tv_chart_container">
        {!isVisible && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
        {failed && (
          <iframe
            title="TradingView Fallback"
            src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE%3ABTCUSDT&interval=D&theme=${isDarkMode ? 'dark' : 'light'}&style=1&locale=en&allow_symbol_change=1&studies=%5B%22RSI%40tv-basicstudies%22%5D`}
            loading="lazy"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
          />
        )}
      </div>
    </div>
  );
}
