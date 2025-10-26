/**
 * Format insider trades for Telegram free channel
 * Simple daily watch format
 */

/**
 * Format a single trade for display
 */
function formatTrade(trade) {
  const transactionIcon = trade.transaction_type === 'P' ? '🟢' :
                         trade.transaction_type === 'S' ? '🔴' : '⚪️';

  const value = formatCurrency(trade.transaction_value);
  const priceChange = trade.price_change_7d ? formatPercent(trade.price_change_7d) : 'N/A';
  const clusterTag = trade.is_cluster_buy && trade.cluster_count >= 2 ?
                    ` 🔥 ${trade.cluster_count} insiders` : '';

  return `${transactionIcon} *${trade.ticker}* - ${trade.company_name}
💰 ${value} | ${trade.insider_title}
📊 7d: ${priceChange}${clusterTag}`;
}

/**
 * Format currency value
 */
function formatCurrency(value) {
  const num = parseFloat(value);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
}

/**
 * Format percentage
 */
function formatPercent(value) {
  const num = parseFloat(value);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

/**
 * Format date for display
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Create daily watch message for free channel
 * @param {Array} topBuys - Top buys (by value)
 * @param {Array} clusters - Cluster buys (multiple insiders)
 * @param {Array} topSales - Top sales (by value)
 */
export function formatDailyWatch({ topBuys = [], clusters = [], topSales = [] }) {
  const today = formatDate(new Date());

  let message = `📈 *CEO Buying Daily Watch*\n${today}\n\n`;

  // Top Buys Section
  if (topBuys.length > 0) {
    message += `*🟢 Top Buys (Last 24h)*\n\n`;
    topBuys.slice(0, 5).forEach((trade, i) => {
      message += `${i + 1}. ${formatTrade(trade)}\n\n`;
    });
  }

  // Cluster Buys Section
  if (clusters.length > 0) {
    message += `*🔥 Cluster Buys*\n`;
    message += `Multiple insiders buying same stock\n\n`;

    // Group by ticker
    const groupedClusters = {};
    clusters.forEach(trade => {
      if (!groupedClusters[trade.ticker]) {
        groupedClusters[trade.ticker] = [];
      }
      groupedClusters[trade.ticker].push(trade);
    });

    Object.entries(groupedClusters).slice(0, 3).forEach(([ticker, trades]) => {
      const totalValue = trades.reduce((sum, t) => sum + parseFloat(t.transaction_value), 0);
      const insiderCount = new Set(trades.map(t => t.insider_name)).size;

      message += `*${ticker}* - ${trades[0].company_name}\n`;
      message += `👥 ${insiderCount} insiders | 💰 ${formatCurrency(totalValue)} total\n\n`;
    });
  }

  // Top Sales Section
  if (topSales.length > 0) {
    message += `*🔴 Notable Sales*\n\n`;
    topSales.slice(0, 3).forEach((trade, i) => {
      message += `${i + 1}. ${formatTrade(trade)}\n\n`;
    });
  }

  // Footer
  message += `\n_Data from SEC EDGAR filings_\n`;
  message += `_Not financial advice_`;

  return message;
}

/**
 * Create simple update message (for testing or quick posts)
 */
export function formatQuickUpdate(trades) {
  const today = formatDate(new Date());

  let message = `📊 *Insider Trading Update*\n${today}\n\n`;

  trades.slice(0, 5).forEach((trade, i) => {
    message += `${i + 1}. ${formatTrade(trade)}\n\n`;
  });

  message += `\n_View more at ceobuying.com_`;

  return message;
}

/**
 * Create post-market scan message (3:30 AM UTC)
 */
export function formatPostMarketScan({ topBuys, clusters }) {
  const message = formatDailyWatch({ topBuys, clusters, topSales: [] });
  return message.replace('Daily Watch', 'Post-Market Scan');
}

/**
 * Create overnight update message (8:00 AM UTC)
 */
export function formatOvernightUpdate({ topBuys, clusters, topSales }) {
  const message = formatDailyWatch({ topBuys, clusters, topSales });
  return message.replace('Daily Watch', 'Overnight Update');
}

/**
 * Create market open pulse message (2:00 PM UTC)
 */
export function formatMarketOpenPulse({ topBuys, clusters }) {
  const message = formatDailyWatch({ topBuys, clusters, topSales: [] });
  return message.replace('Daily Watch', 'Market Open Pulse');
}

export default {
  formatDailyWatch,
  formatQuickUpdate,
  formatPostMarketScan,
  formatOvernightUpdate,
  formatMarketOpenPulse
};
