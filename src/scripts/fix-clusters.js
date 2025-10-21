#!/usr/bin/env node

/**
 * Fix cluster detection - CORRECT VERSION
 * Clusters = Multiple DIFFERENT insiders trading same stock within 7 days
 * Run with: npm run fix:clusters
 */

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

console.log('🔧 Fixing Cluster Detection (Correct Logic)...\n');

async function fixClusters() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    console.log(`Analyzing trades from ${dateFilter} onwards...\n`);

    const { data: allTrades, error } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .gte('filing_date', dateFilter)
      .order('filing_date', { ascending: false });

    if (error) throw error;
    if (!allTrades || allTrades.length === 0) {
      console.log('❌ No trades found\n');
      return;
    }

    console.log(`✅ Found ${allTrades.length} trades\n`);

    // First, reset all cluster flags
    console.log('🔄 Resetting all cluster flags...');
    await supabaseAdmin
      .from('insider_trades')
      .update({ is_cluster_buy: false, cluster_count: 1 })
      .gte('filing_date', dateFilter);
    console.log('✓ Reset complete\n');

    // Group by ticker + transaction_type
    const groups = {};
    allTrades.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(trade);
    });

    console.log('🔍 Analyzing for real clusters...\n');

    let clusterCount = 0;
    let updatedCount = 0;

    for (const [key, trades] of Object.entries(groups)) {
      const [ticker, type] = key.split('-');
      
      // Check if multiple DIFFERENT insiders
      const uniqueInsiders = new Set(trades.map(t => t.insider_name));
      
      if (uniqueInsiders.size >= 2) {
        // Real cluster! Multiple different insiders
        
        // Group by time window (within 7 days of each other)
        const timeGroups = [];
        const sortedTrades = [...trades].sort((a, b) => 
          new Date(a.filing_date) - new Date(b.filing_date)
        );

        for (const trade of sortedTrades) {
          const tradeDate = new Date(trade.filing_date);
          
          // Find a time group within 7 days
          let addedToGroup = false;
          for (const group of timeGroups) {
            const groupStart = new Date(group.startDate);
            const daysDiff = Math.abs((tradeDate - groupStart) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 7) {
              group.trades.push(trade);
              group.endDate = trade.filing_date;
              addedToGroup = true;
              break;
            }
          }
          
          if (!addedToGroup) {
            timeGroups.push({
              startDate: trade.filing_date,
              endDate: trade.filing_date,
              trades: [trade]
            });
          }
        }

        // Mark time groups with 2+ different insiders as clusters
        for (const timeGroup of timeGroups) {
          const groupInsiders = new Set(timeGroup.trades.map(t => t.insider_name));
          
          if (groupInsiders.size >= 2) {
            clusterCount++;
            const typeLabel = type === 'P' ? 'Purchases' : 'Sales';
            const totalValue = timeGroup.trades.reduce((sum, t) => sum + Math.abs(t.transaction_value), 0);
            
            console.log(`🔥 ${ticker} ${typeLabel}: ${groupInsiders.size} different insiders`);
            console.log(`   Period: ${timeGroup.startDate} to ${timeGroup.endDate}`);
            console.log(`   Total: $${(totalValue / 1000000).toFixed(2)}M`);
            console.log(`   Insiders: ${Array.from(groupInsiders).join(', ')}`);

            // Update each trade in this cluster
            for (const trade of timeGroup.trades) {
              const { error: updateError } = await supabaseAdmin
                .from('insider_trades')
                .update({
                  is_cluster_buy: true,
                  cluster_count: groupInsiders.size
                })
                .eq('id', trade.id);

              if (updateError) {
                console.error(`   ❌ Failed to update: ${updateError.message}`);
              } else {
                updatedCount++;
              }
            }
            
            console.log('');
          }
        }
      } else if (uniqueInsiders.size === 1 && trades.length > 1) {
        // Same insider, multiple trades - NOT a cluster
        const insider = Array.from(uniqueInsiders)[0];
        const typeLabel = type === 'P' ? 'Purchases' : 'Sales';
        console.log(`⚪ ${ticker} ${typeLabel}: ${trades.length} trades by ${insider} (same person, not a cluster)`);
      }
    }

    console.log('─'.repeat(80));
    console.log(`\n✨ Results:`);
    console.log(`   - Found ${clusterCount} real clusters`);
    console.log(`   - Updated ${updatedCount} trades`);
    console.log('\n💡 Real cluster = Multiple DIFFERENT insiders within 7 days\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixClusters()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
