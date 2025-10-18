export default function TradeCard({ trade }) {
  const isPurchase = trade.transaction_type === 'P';
  const valueInM = (trade.transaction_value / 1000000).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-4xl p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {trade.ticker}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-xs">
            {trade.company_name}
          </p>
        </div>
        <div className={`text-xs font-medium mt-1 ${
          isPurchase
            ? 'text-green-800 dark:text-green-200'
            : 'text-red-800 dark:text-red-200'
        }`}>
          {isPurchase ? 'PURCHASE' : 'SELL'}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          ${valueInM}M
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {trade.insider_name} • {trade.insider_title}
        </div>
      </div>

      {trade.is_cluster_buy && (
        <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mb-3">
          <span>🔥</span>
          <span className="font-medium">Cluster Buy: {trade.cluster_count} insiders</span>
        </div>
      )}

      <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-gray-400">
        <div>
          <span className="text-xs font-normal text-gray-600">Price:</span> ${trade.price?.toFixed(2)}
        </div>
        {trade.current_stock_price && (
          <div>
            <span className="text-xs font-normal text-gray-600">Current:</span> ${trade.current_stock_price.toFixed(2)}
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

      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Filed: {new Date(trade.filing_date).toLocaleDateString()}
      </div>
    </div>
  );
}
