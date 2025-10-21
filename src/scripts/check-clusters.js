#!/usr/bin/env node

/**
 * Check for cluster buys in the database
 * Run with: node src/scripts/check-clusters.js
 */

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

console.log('🔍 Checking for cluster buys in database...\n');

async function checkClusters() {
  try {
    // Get cluster buys
    const { data: clusters, error: clusterError } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .eq('is_cluster_buy', true)
      .order('filing_date', { ascending: false })
      .limit(20);

    if (clusterError) {
      throw clusterError;
    }

    // Get total counts
    const { count: totalTrades } = await supabaseAdmin
      .from('insider_trades')
      .select('*', { count: 'exact', head: true });

    const { count: totalPurchases } = await supabaseAdmin
      .from('insider_trades')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_type', 'P');

    const { count: totalClusters } = await supabaseAdmin
      .from('insider_trades')
      .select('*', { count: 'exact', head: true })
      .eq('is_cluster_buy', true);

    console.log('📊 Database Statistics:');
    console.log(`   Total Trades: ${totalTrades}`);
    console.log(`   Total Purchases: ${totalPurchases}`);
    console.log(`   Total Cluster Buys: ${totalClusters}\n`);

    if (!clusters || clusters.length === 0) {
      console.log('❌ No cluster buys found in database.');
      console.log('\n💡 To create cluster buys:');
      console.log('   1. Run the scraper: npm run test:scraper');
      console.log('   2. The scraper detects clusters when 2+ insiders buy the same ticker');
      console.log('   3. Check this script again after scraper completes\n');
      return;
    }

    console.log(`✅ Found ${clusters.length} recent cluster buys:\n`);
    console.log('─'.repeat(120));

    clusters.forEach((trade, idx) => {
      const date = new Date(trade.filing_date).toLocaleDateString();
      const value = `$${(trade.transaction_value / 1000000).toFixed(2)}M`;
      
      console.log(`${idx + 1}. ${trade.ticker.padEnd(6)} ${trade.company_name.substring(0, 40).padEnd(42)}`);
      console.log(`   🔥 ${trade.cluster_count} insiders • ${value.padEnd(10)} • Filed: ${date}`);
      console.log(`   👤 ${trade.insider_name} - ${trade.insider_title || 'N/A'}`);
      console.log('');
    });

    console.log('─'.repeat(120));
    console.log(`\n✨ These ${clusters.length} cluster buys should appear in your UI\n`);
    console.log('🌐 View them at: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error checking clusters:', error.message);
    process.exit(1);
  }
}

checkClusters()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
