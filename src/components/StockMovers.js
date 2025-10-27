'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import StockChart from './StockChart';

/**
 * Stock Movers Component
 * Displays Up Today and Down Today stocks with charts
 */
export default function StockMovers() {
  const [movers, setMovers] = useState({ upToday: [], downToday: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovers();
  }, []);

  async function fetchMovers() {
    try {
      const response = await fetch('/api/stocks/movers');
      const data = await response.json();

      if (data.success) {
        setMovers({
          upToday: data.upToday || [],
          downToday: data.downToday || []
        });
      }
    } catch (error) {
      console.error('Error fetching movers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (movers.upToday.length === 0 && movers.downToday.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Up Today */}
      {movers.upToday.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Up Today
          </h3>
          <div className="space-y-3">
            {movers.upToday.slice(0, 3).map(stock => (
              <StockChart key={stock.ticker} ticker={stock.ticker} />
            ))}
          </div>
        </div>
      )}

      {/* Down Today */}
      {movers.downToday.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            Down Today
          </h3>
          <div className="space-y-3">
            {movers.downToday.slice(0, 3).map(stock => (
              <StockChart key={stock.ticker} ticker={stock.ticker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
