'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';
import QuickLookup from './QuickLookup';
import StockMovers from './StockMovers';

/**
 * Stock Chart Sidebar
 * Displays quick lookup, movers, and stock charts from active insider trades
 */
export default function StockChartSidebar({ heroTrades = [] }) {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    // Extract unique tickers from hero trades
    if (heroTrades && heroTrades.length > 0) {
      const uniqueTickers = [...new Set(heroTrades.map(t => t.ticker))];
      setTickers(uniqueTickers.slice(0, 3)); // Show top 3
    }
  }, [heroTrades]);

  return (
    <div className="space-y-6">
      {/* Quick Lookup */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-3">
          Quick Lookup
        </h2>
        <QuickLookup />
      </div>

      {/* Market Movers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-3">
          Market Movers
        </h2>
        <StockMovers />
      </div>

      {/* Top Insider Trade Charts */}
      {tickers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-3">
            Top Trades
          </h2>
          <div className="space-y-3">
            {tickers.map(ticker => (
              <StockChart key={ticker} ticker={ticker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
