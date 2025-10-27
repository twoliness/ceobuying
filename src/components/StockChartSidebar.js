'use client';

import QuickLookup from './QuickLookup';
import StockMovers from './StockMovers';

/**
 * Stock Chart Sidebar
 * Displays quick lookup and market movers with charts
 */
export default function StockChartSidebar() {
  return (
    <div className="space-y-6">
      {/* Quick Lookup */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-3">
          Quick Lookup
        </h2>
        <QuickLookup />
      </div>

      {/* Market Movers with Charts */}
      <StockMovers />
    </div>
  );
}
