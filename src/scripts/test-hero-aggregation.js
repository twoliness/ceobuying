#!/usr/bin/env node

/**
 * Test the hero trades aggregation
 * Run with: node src/scripts/test-hero-aggregation.js
 */

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

console.log('🔍 Testing Hero Trades Aggregation...\n');

async function testHeroAggregation() {
  try {
    // Simulate what the hero endpoint does
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

    console.log(`Fetching trades from ${dateFilter} (last 7 days)\n`);

    const { data: allTrades, error } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .eq('transaction_type', 'P')
      .gte('filing_date', dateFilter)
      .order('transaction_value', { ascending: false });

    if (error) {
      throw error;
    }

    if (!allTrades || allTrades.length === 0) {
      console.log('❌ No trades found in last 7 days');
      console.log('💡 Run the scraper: npm run test:scraper\n');
      return;
    }

    console.log(`✅ Found ${allTrades.length} purchases in last 7 days\n`);

    // Separate clusters
    const clusterTrades = allTrades.filter(t => t.is_cluster_buy);
    const individualTrades = allTrades.filter(t => !t.is_cluster_buy);

    console.log(`📊 Breakdown:`);
    console.log(`   - ${clusterTrades.length} trades that are part of clusters`);
    console.log(`   - ${individualTrades.length} individual trades\n`);

    if (clusterTrades.length === 0) {
      console.log('⚠️  No cluster buys detected in the data');
      console.log('💡 This is normal if insiders are not buying the same stock\n');
    } else {
      // Group by ticker
      const clustersByTicker = {};
      
      clusterTrades.forEach(trade => {
        if (!clustersByTicker[trade.ticker]) {
          clustersByTicker[trade.ticker] = [];
        }
        clustersByTicker[trade.ticker].push(trade);
      });

      console.log(`🔥 Cluster Buys (Aggregated):\n`);
      console.log('─'.repeat(100));

      Object.entries(clustersByTicker).forEach(([ticker, trades]) => {
        const totalValue = trades.reduce((sum, t) => sum + t.transaction_value, 0);
        const totalQty = trades.reduce((sum, t) => sum + t.quantity, 0);
        const avgPrice = totalValue / totalQty;
        const biggestTrade = trades.sort((a, b) => b.transaction_value - a.transaction_value)[0];

        console.log(`${ticker.padEnd(6)} ${trades[0].company_name.substring(0, 40).padEnd(42)}`);
        console.log(`   🔥 ${trades.length} insiders bought ${totalQty.toLocaleString()} shares`);
        console.log(`   💰 Total Value: $${(totalValue / 1000000).toFixed(2)}M`);
        console.log(`   📊 Avg Price: $${avgPrice.toFixed(2)}`);
        console.log(`   👤 Led by: ${biggestTrade.insider_name} ($${(biggestTrade.transaction_value / 1000000).toFixed(2)}M)`);
        console.log(`   📅 Filed: ${new Date(biggestTrade.filing_date).toLocaleDateString()}`);
        console.log('');

        // Show individual trades in the cluster
        console.log('   Individual trades in this cluster:');
        trades.forEach((trade, idx) => {
          const filedDate = new Date(trade.filing_date).toLocaleDateString();
          console.log(`      ${idx + 1}. ${trade.insider_name} - $${(trade.transaction_value / 1000000).toFixed(2)}M (${trade.quantity.toLocaleString()} shares @ $${trade.price.toFixed(2)}) - Filed: ${filedDate}`);
        });
        console.log('');
      });

      console.log('─'.repeat(100));
      console.log(`\n✨ ${Object.keys(clustersByTicker).length} unique clusters will be shown as single cards\n`);
    }

    // Show top individual trades
    if (individualTrades.length > 0) {
      console.log('📈 Top Individual Purchases (Non-Cluster):\n');
      individualTrades.slice(0, 5).forEach((trade, idx) => {
        const filedDate = new Date(trade.filing_date).toLocaleDateString();
        console.log(`${idx + 1}. ${trade.ticker.padEnd(6)} - $${(trade.transaction_value / 1000000).toFixed(2)}M - ${trade.insider_name} - Filed: ${filedDate}`);
      });
      console.log('');
    }

    // Calculate what will be shown
    const uniqueClusters = clusterTrades.length > 0 ? Object.keys(
      clusterTrades.reduce((acc, t) => ({ ...acc, [t.ticker]: true }), {})
    ).length : 0;

    console.log('🎯 Hero Cards Summary:');
    console.log(`   - ${uniqueClusters} cluster cards (aggregated)`);
    console.log(`   - ${Math.min(10 - uniqueClusters, individualTrades.length)} individual trade cards`);
    console.log(`   = ${Math.min(10, uniqueClusters + individualTrades.length)} total cards in "Top Trades This Week"\n`);

    // Show filing date range
    const dates = allTrades.map(t => new Date(t.filing_date).getTime());
    const oldestDate = new Date(Math.min(...dates)).toLocaleDateString();
    const newestDate = new Date(Math.max(...dates)).toLocaleDateString();
    
    console.log('📅 Date Range:');
    console.log(`   Oldest: ${oldestDate}`);
    console.log(`   Newest: ${newestDate}\n`);

    console.log('🌐 View at: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testHeroAggregation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
