'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';

/**
 * Stock Chart Sidebar
 * Displays multiple stock charts from active insider trades
 */
export default function StockChartSidebar({ heroTrades = [] }) {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    // Extract unique tickers from hero trades
    if (heroTrades && heroTrades.length > 0) {
      const uniqueTickers = [...new Set(heroTrades.map(t => t.ticker))];
      setTickers(uniqueTickers.slice(0, 5)); // Show top 5
    }
  }, [heroTrades]);

  if (tickers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase px-1">
        Stock Charts
      </h2>

      <div className="space-y-3">
        {tickers.map(ticker => (
          <StockChart key={ticker} ticker={ticker} />
        ))}
      </div>
    </div>
  );
}
