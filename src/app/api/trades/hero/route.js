import { supabase } from '@/lib/supabase.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/trades/hero
 * Fetch top 10 trades for hero cards (this week, all trade types)
 * Aggregates multiple trades intelligently
 */
export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

    console.log(`Fetching hero trades from ${dateFilter} onwards (this week)`);

    const { data: allTrades, error } = await supabase
      .from('insider_trades')
      .select('*')
      .gte('filing_date', dateFilter)
      .order('transaction_value', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch hero trades' }, { status: 500 });
    }

    if (!allTrades || allTrades.length === 0) {
      console.log('No trades found this week');
      return NextResponse.json({ trades: [] });
    }

    console.log(`Found ${allTrades.length} total trades this week`);

    // Group by ticker + transaction_type + insider_name
    const groups = {};
    
    allTrades.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}-${trade.insider_name}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(trade);
    });

    console.log(`Grouped into ${Object.keys(groups).length} unique combinations`);

    // Aggregate groups with multiple trades by same person
    const aggregatedTrades = [];

    Object.entries(groups).forEach(([key, trades]) => {
      if (trades.length === 1) {
        // Single trade - keep as-is
        aggregatedTrades.push(trades[0]);
      } else {
        // Multiple trades by same person - aggregate them
        const totalValue = trades.reduce((sum, t) => sum + t.transaction_value, 0);
        const totalQty = trades.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
        
        // Sort by value to find biggest trade
        const sortedTrades = [...trades].sort((a, b) => 
          Math.abs(b.transaction_value) - Math.abs(a.transaction_value)
        );
        const biggestTrade = sortedTrades[0];
        
        // Find most recent filing date
        const mostRecentDate = trades.reduce((latest, t) => {
          const tDate = new Date(t.filing_date);
          return tDate > new Date(latest) ? t.filing_date : latest;
        }, trades[0].filing_date);

        // Create aggregated trade
        const aggregated = {
          ...biggestTrade,
          transaction_value: totalValue,
          quantity: totalQty,
          avg_price: totalValue / totalQty,
          filing_date: mostRecentDate,
          is_aggregated: true,
          trade_count: trades.length,
          // Check if marked as cluster in database
          is_cluster_buy: biggestTrade.is_cluster_buy,
          cluster_count: biggestTrade.cluster_count
        };

        aggregatedTrades.push(aggregated);
        
        const [ticker, type, insider] = key.split('-');
        console.log(`  Aggregated ${ticker} (${type}) ${insider}: ${trades.length} trades, $${(totalValue / 1000000).toFixed(2)}M total`);
      }
    });

    // Sort by absolute value and take top 10
    const topTrades = aggregatedTrades
      .sort((a, b) => Math.abs(b.transaction_value) - Math.abs(a.transaction_value))
      .slice(0, 10);

    console.log(`\nReturning top ${topTrades.length} trades:`);
    topTrades.forEach((t, i) => {
      const type = t.transaction_type === 'P' ? 'BUY' : 'SELL';
      const multi = t.trade_count > 1 ? ` (${t.trade_count} trades)` : '';
      const cluster = t.is_cluster_buy ? ` [CLUSTER: ${t.cluster_count} insiders]` : '';
      console.log(`  ${i + 1}. ${t.ticker} ${type} $${(Math.abs(t.transaction_value) / 1000000).toFixed(2)}M - ${t.insider_name}${multi}${cluster}`);
    });

    return NextResponse.json({ trades: topTrades });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
