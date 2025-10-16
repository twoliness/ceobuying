export default function TradesTable({ trades, title, icon }) {
  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Filing
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Insider
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {trades.map((trade, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(trade.filing_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(trade.trade_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {trade.ticker}
                  </span>
                  {trade.is_cluster_buy && (
                    <span className="ml-1 text-xs">🔥</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {trade.company_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {trade.insider_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {trade.insider_title}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    trade.transaction_type === 'P'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {trade.transaction_type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  ${trade.price?.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                  {trade.quantity?.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                  {formatValue(trade.transaction_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trades.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No trades found
          </div>
        )}
      </div>
    </div>
  );
}
