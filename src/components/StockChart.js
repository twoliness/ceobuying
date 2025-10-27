'use client';

import { useState, useEffect } from 'react';

/**
 * Simple Stock Chart Component
 * Displays a mini line chart for stock price
 */
export default function StockChart({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('1mo');

  useEffect(() => {
    fetchChartData();
  }, [ticker, range]);

  async function fetchChartData() {
    if (!ticker) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stocks/${ticker}?range=${range}&source=db`);
      const result = await response.json();

      if (!result.success) {
        // Try live if db fails
        const liveResponse = await fetch(`/api/stocks/${ticker}?range=${range}&source=live`);
        const liveResult = await liveResponse.json();

        if (liveResult.success) {
          setData(liveResult);
        } else {
          setError(liveResult.message || 'Failed to load chart');
        }
      } else {
        setData(result);
      }
    } catch (err) {
      console.error('Chart error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Chart unavailable
        </p>
      </div>
    );
  }

  const prices = data.prices || [];
  if (prices.length === 0) {
    return null;
  }

  // Calculate chart dimensions
  const minPrice = Math.min(...prices.map(p => p.low || p.close));
  const maxPrice = Math.max(...prices.map(p => p.high || p.close));
  const priceRange = maxPrice - minPrice;
  const latestPrice = prices[prices.length - 1]?.close;
  const firstPrice = prices[0]?.close;
  const change = latestPrice - firstPrice;
  const changePercent = ((change / firstPrice) * 100).toFixed(2);
  const isPositive = change >= 0;

  // Generate SVG path
  const width = 220;
  const height = 100;
  const padding = 10;

  const points = prices.map((price, index) => {
    const x = padding + (index / (prices.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((price.close - minPrice) / priceRange) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {ticker}
          </h3>
          {data.companyName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {data.companyName}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            ${latestPrice?.toFixed(2)}
          </div>
          <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{changePercent}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mb-2"
      >
        {/* Grid lines */}
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-200 dark:text-gray-700"
          strokeDasharray="2,2"
        />

        {/* Area fill */}
        <path
          d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
        />

        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Range selector */}
      <div className="flex gap-1 text-xs">
        {['1mo', '3mo', '6mo', '1y'].map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2 py-1 rounded transition-colors ${
              range === r
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
