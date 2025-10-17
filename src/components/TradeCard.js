export default function TradeCard({ trade }) {
  const isPurchase = trade.transaction_type === 'P';
  const valueInM = (trade.transaction_value / 1000000).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {trade.ticker}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {trade.company_name}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isPurchase
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {isPurchase ? '📈 BUY' : '📉 SELL'}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          ${valueInM}M
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {trade.insider_name} • {trade.insider_title}
        </div>
      </div>

      {trade.is_cluster_buy && (
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mb-3">
          <span>🔥</span>
          <span className="font-semibold">Cluster Buy: {trade.cluster_count} insiders</span>
        </div>
      )}

      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Price:</span> ${trade.price?.toFixed(2)}
        </div>
        {trade.current_stock_price && (
          <div>
            <span className="font-medium">Current:</span> ${trade.current_stock_price.toFixed(2)}
            {trade.price_change_7d && (
              <span className={`ml-2 ${
                trade.price_change_7d > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trade.price_change_7d > 0 ? '+' : ''}{trade.price_change_7d.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        Filed: {new Date(trade.filing_date).toLocaleDateString()}
      </div>
    </div>
  );
}
