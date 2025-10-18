'use client';

import { useState, useEffect } from 'react';
import TradeCard from '@/components/TradeCard';
import TradesTable from '@/components/TradesTable';

export default function Home() {
  const [heroTrades, setHeroTrades] = useState([]);
  const [clusterBuys, setClusterBuys] = useState([]);
  const [insiderBuys, setInsiderBuys] = useState([]);
  const [insiderSales, setInsiderSales] = useState([]);
  const [pennyStocks, setPennyStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [heroRes, clusterRes, buysRes, salesRes, pennyRes] = await Promise.all([
        fetch('/api/trades/hero'),
        fetch('/api/trades?type=cluster&limit=20'),
        fetch('/api/trades?type=buys&limit=20'),
        fetch('/api/trades?type=sales&limit=20'),
        fetch('/api/trades/pennystocks?limit=20')
      ]);

      const [heroData, clusterData, buysData, salesData, pennyData] = await Promise.all([
        heroRes.json(),
        clusterRes.json(),
        buysRes.json(),
        salesRes.json(),
        pennyRes.json()
      ]);

      setHeroTrades(heroData.trades || []);
      setClusterBuys(clusterData.trades || []);
      setInsiderBuys(buysData.trades || []);
      setInsiderSales(salesData.trades || []);
      setPennyStocks(pennyData.trades || []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
            {lastUpdated && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4">
        {/* Hero Cards Section */}
        {heroTrades.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 uppercase">
              Top trades today
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {heroTrades.slice(0, 10).map((trade, idx) => (
                <TradeCard key={idx} trade={trade} />
              ))}
            </div>
          </section>
        )}

        {/* Tables Section */}
        <div className="space-y-8">
          {clusterBuys.length > 0 && (
            <TradesTable
              trades={clusterBuys}
              title="Cluster Buys"
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
        {heroTrades.length === 0 && clusterBuys.length === 0 &&
         insiderBuys.length === 0 && insiderSales.length === 0 && 
         pennyStocks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              No insider trades found yet.
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Run the scraper to populate data: npm run test:scraper
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
            <p className="mb-2">
              Data sourced from SEC EDGAR
            </p>
            <p>
              Built with Next.js and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
