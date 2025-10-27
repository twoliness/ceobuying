'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import StockChart from './StockChart';

/**
 * Quick Lookup Component
 * Search for stocks and display their charts
 */
export default function QuickLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Search for stocks
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }

    const searchStocks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.results || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(ticker) {
    setSelectedTicker(ticker);
    setQuery('');
    setShowResults(false);
    setResults([]);
  }

  function handleClear() {
    setSelectedTicker(null);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Quick lookup: Search ticker or company..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {results.map((stock) => (
              <button
                key={stock.ticker}
                onClick={() => handleSelect(stock.ticker)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {stock.ticker}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {stock.company_name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-2">
                    {stock.exchange}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && !loading && query.length > 0 && results.length === 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No stocks found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Selected Stock Chart */}
      {selectedTicker && (
        <div className="relative">
          <button
            onClick={handleClear}
            className="absolute -top-2 -right-2 z-10 p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Clear"
          >
            <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </button>
          <StockChart ticker={selectedTicker} />
        </div>
      )}
    </div>
  );
}
