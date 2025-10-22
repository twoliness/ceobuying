'use client';

import { useState, useEffect } from 'react';
import TradeCard from '@/components/TradeCard';
import TradesTable from '@/components/TradesTable';

export default function Home() {
  const [heroTrades, setHeroTrades] = useState([]);
  const [clusterTrades, setClusterTrades] = useState([]);
  const [insiderBuys, setInsiderBuys] = useState([]);
  const [insiderSales, setInsiderSales] = useState([]);
  const [pennyStocks, setPennyStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel - increased cluster limit to 100
      const [heroRes, clusterRes, buysRes, salesRes, pennyRes] = await Promise.all([
        fetch('/api/trades/hero'),
        fetch('/api/trades?type=cluster&limit=100'), // Increased from 20
        fetch('/api/trades?type=buys&limit=20'),
        fetch('/api/trades?type=sales&limit=20'),
        fetch('/api/trades/pennystocks?limit=20')
      ]);

      // Check if all requests were successful
      if (!heroRes.ok || !clusterRes.ok || !buysRes.ok || !salesRes.ok || !pennyRes.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const [heroData, clusterData, buysData, salesData, pennyData] = await Promise.all([
        heroRes.json(),
        clusterRes.json(),
        buysRes.json(),
        salesRes.json(),
        pennyRes.json()
      ]);

      setHeroTrades(heroData.trades || []);
      setClusterTrades(clusterData.trades || []);
      setInsiderBuys(buysData.trades || []);
      setInsiderSales(salesData.trades || []);
      setPennyStocks(pennyData.trades || []);
      setLastUpdated(new Date());

      console.log('Data refreshed successfully:', {
        hero: heroData.trades?.length || 0,
        cluster: clusterData.trades?.length || 0,
        buys: buysData.trades?.length || 0,
        sales: salesData.trades?.length || 0,
        penny: pennyData.trades?.length || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !lastUpdated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading insider trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-4 py-3">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-md font-bold text-gray-900 dark:text-white uppercase">
                Ceo Buying
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </span>
                ) : (
                  '🔄 Refresh'
                )}
              </button>
              {lastUpdated && (
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4">
        {/* Hero Cards Section */}
        {heroTrades.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 uppercase">
              Top Trades This Week
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {heroTrades.slice(0, 10).map((trade, idx) => (
                <TradeCard key={`${trade.ticker}-${trade.transaction_type}-${idx}`} trade={trade} />
              ))}
            </div>
          </section>
        )}

        {/* Tables Section */}
        <div className="space-y-8">
          {clusterTrades.length > 0 && (
            <TradesTable
              trades={clusterTrades}
              title="Clusters"
              icon="🔥"
            />
          )}

          {insiderBuys.length > 0 && (
            <TradesTable
              trades={insiderBuys}
              title="Insider Buys"
              icon="📈"
            />
          )}

          {insiderSales.length > 0 && (
            <TradesTable
              trades={insiderSales}
              title="Insider Sales"
              icon="📉"
            />
          )}

          {pennyStocks.length > 0 && (
            <TradesTable
              trades={pennyStocks}
              title="Penny Stocks"
              icon="💰"
            />
          )}
        </div>

        {/* Empty State */}
        {!loading && heroTrades.length === 0 && clusterTrades.length === 0 &&
         insiderBuys.length === 0 && insiderSales.length === 0 && 
         pennyStocks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              No insider trades found this week.
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Run the scraper to populate data:
            </p>
            <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm">
              npm run scraper:month
            </code>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400 text-xs">
            <p className="mb-1">
              Data sourced from SEC EDGAR
            </p>
            ©2025
          </div>
        </div>
      </footer>
    </div>
  );
}
