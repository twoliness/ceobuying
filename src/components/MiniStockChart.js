'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Mini Stock Chart
 * Compact chart for TradeCard showing 7-day price trend with hover tooltip
 */
export default function MiniStockChart({ ticker }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverData, setHoverData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  useEffect(() => {
    fetchChartData();
  }, [ticker]);

  async function fetchChartData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/stocks/${ticker}?range=7d`);
      const data = await response.json();

      if (data.success && data.prices && data.prices.length > 0) {
        setChartData(data.prices);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleMouseMove(e) {
    if (!chartData || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x / rect.width;

    // Find closest data point
    const index = Math.round(relativeX * (chartData.length - 1));
    const boundedIndex = Math.max(0, Math.min(chartData.length - 1, index));

    setHoverData({
      index: boundedIndex,
      data: chartData[boundedIndex]
    });
    setMousePosition({ x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setHoverData(null);
  }

  if (loading || !chartData || chartData.length === 0) {
    return null; // Don't show anything if no data
  }

  // Calculate chart dimensions
  const width = 100; // percentage
  const height = 30; // pixels
  const padding = 2;

  // Get price range
  const prices = chartData.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero

  // Calculate points for SVG path
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = height - padding - ((d.close - minPrice) / priceRange) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Determine if trend is positive
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isPositive = lastPrice >= firstPrice;

  return (
    <div className="mt-2 relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${height}`}
        className="w-full cursor-crosshair"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Line chart */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover indicator */}
        {hoverData && (
          <circle
            cx={(hoverData.index / (chartData.length - 1)) * 100}
            cy={height - padding - ((hoverData.data.close - minPrice) / priceRange) * (height - padding * 2)}
            r="2"
            fill={isPositive ? '#10b981' : '#ef4444'}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoverData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y - 10}px`
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
            <div className="font-semibold">
              {new Date(hoverData.data.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div>${hoverData.data.close.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
