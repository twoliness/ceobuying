import { isPurchase, getTransactionType, getTransactionDescription } from '@/lib/transaction-codes';
import { Tooltip } from '@/components/ui/tooltip';

export default function TradeCard({ trade }) {
  const isAcquisition = isPurchase(trade.transaction_type);
  const transactionType = getTransactionType(trade.transaction_type);
  const transactionDescription = getTransactionDescription(trade.transaction_type);
  const valueInM = Math.abs(trade.transaction_value / 1000000).toFixed(1);
  
  // Check if this is a real cluster (multiple different insiders) or same person multiple times
  const isRealCluster = trade.is_cluster_buy && trade.cluster_count > 1;
  const isMultipleTrades = trade.trade_count > 1;
  const isAggregated = isRealCluster || isMultipleTrades;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {trade.ticker}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-1">
            {trade.company_name}
          </p>
        </div>
        <Tooltip content={transactionDescription}>
          <div className={`text-xs font-medium px-2 py-1 rounded cursor-help ${
            transactionType === 'buy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : transactionType === 'sell'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {trade.transaction_type}
          </div>
        </Tooltip>
      </div>

      {/* Cluster or Multiple Trades Label */}
      {isRealCluster && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md mb-4 font-semibold ${
          transactionType === 'buy'
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
        }`}>
          <span>🔥</span>
          <span>{trade.cluster_count} different insiders</span>
        </div>
      )}
      
      {isMultipleTrades && !isRealCluster && (
        <div className="flex items-center gap-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md mb-4 font-semibold">
          <span>📊</span>
          <span>{trade.trade_count} transactions</span>
        </div>
      )}

      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          ${valueInM}M {isAggregated && <span className="text-sm text-gray-500">total</span>}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
          {trade.insider_name}
          {trade.insider_title && <> • {trade.insider_title}</>}
        </div>
      </div>

      <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-gray-400 mb-3">
        <div>
          <span className="text-xs font-normal text-gray-600">
            {isAggregated ? 'Avg:' : 'Price:'}
          </span> ${(isAggregated && trade.avg_price ? trade.avg_price : trade.price)?.toFixed(2)}
        </div>
        {trade.current_stock_price && (
          <div>
            <span className="text-xs font-normal text-gray-600">Now:</span> ${trade.current_stock_price.toFixed(2)}
            {trade.price_change_7d !== null && trade.price_change_7d !== undefined && (
              <span className={`ml-1 ${
                trade.price_change_7d > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trade.price_change_7d > 0 ? '+' : ''}{trade.price_change_7d.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {isAggregated && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {trade.quantity?.toLocaleString()} shares total
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {new Date(trade.filing_date).toLocaleDateString()}
      </div>
    </div>
  );
}
