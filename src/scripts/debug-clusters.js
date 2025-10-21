#!/usr/bin/env node

/**
 * Debug Clusters Script
 * Helps diagnose why some clusters found during scraping don't appear in the UI
 */

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

console.log('🔍 Cluster Debugging Tool\n');
console.log('═'.repeat(80));

async function debugClusters() {
  try {
    // Get all clusters
    console.log('\n📊 ALL CLUSTERS IN DATABASE:');
    console.log('─'.repeat(80));
    
    const { data: allClusters, error: allError } = await supabaseAdmin
      .from('insider_trades')
      .select('ticker, transaction_type, filing_date, cluster_count, is_cluster_buy')
      .eq('is_cluster_buy', true)
      .order('filing_date', { ascending: false });

    if (allError) throw allError;

    // Group by ticker + type
    const clusterGroups = {};
    allClusters.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}`;
      if (!clusterGroups[key]) {
        clusterGroups[key] = {
          ticker: trade.ticker,
          type: trade.transaction_type,
          count: 0,
          earliestDate: trade.filing_date,
          latestDate: trade.filing_date,
          avgClusterSize: 0
        };
      }
      clusterGroups[key].count++;
      if (trade.filing_date < clusterGroups[key].earliestDate) {
        clusterGroups[key].earliestDate = trade.filing_date;
      }
      if (trade.filing_date > clusterGroups[key].latestDate) {
        clusterGroups[key].latestDate = trade.filing_date;
      }
      clusterGroups[key].avgClusterSize += trade.cluster_count;
    });

    Object.values(clusterGroups).forEach(group => {
      group.avgClusterSize = Math.round(group.avgClusterSize / group.count);
    });

    console.log(`Total cluster trades: ${allClusters.length}`);
    console.log(`Unique clusters: ${Object.keys(clusterGroups).length}\n`);
    
    console.table(Object.values(clusterGroups).slice(0, 20));

    // Check 30-day filter
    console.log('\n📅 CLUSTERS IN LAST 30 DAYS (what UI shows):');
    console.log('─'.repeat(80));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
    
    console.log(`Date filter: >= ${dateFilter}\n`);

    const { data: recentClusters, error: recentError } = await supabaseAdmin
      .from('insider_trades')
      .select('ticker, transaction_type, filing_date, cluster_count')
      .eq('is_cluster_buy', true)
      .gte('filing_date', dateFilter);

    if (recentError) throw recentError;

    // Group recent clusters
    const recentGroups = {};
    recentClusters.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}`;
      if (!recentGroups[key]) {
        recentGroups[key] = {
          ticker: trade.ticker,
          type: trade.transaction_type,
          count: 0,
          earliestDate: trade.filing_date,
          latestDate: trade.filing_date
        };
      }
      recentGroups[key].count++;
      if (trade.filing_date < recentGroups[key].earliestDate) {
        recentGroups[key].earliestDate = trade.filing_date;
      }
      if (trade.filing_date > recentGroups[key].latestDate) {
        recentGroups[key].latestDate = trade.filing_date;
      }
    });

    console.log(`Recent cluster trades: ${recentClusters.length}`);
    console.log(`Recent unique clusters: ${Object.keys(recentGroups).length}\n`);
    
    console.table(Object.values(recentGroups));

    // Show missing clusters
    console.log('\n❌ CLUSTERS NOT SHOWING IN UI (outside 30-day window):');
    console.log('─'.repeat(80));
    
    const missingClusters = Object.entries(clusterGroups).filter(([key]) => !recentGroups[key]);
    
    if (missingClusters.length === 0) {
      console.log('✓ All clusters are within the 30-day window!\n');
    } else {
      console.log(`Found ${missingClusters.length} clusters outside the 30-day window:\n`);
      console.table(missingClusters.map(([key, group]) => ({
        cluster: key,
        trades: group.count,
        earliest: group.earliestDate,
        latest: group.latestDate,
        avgSize: group.avgClusterSize
      })));
    }

    // Check for recent trades that aren't marked as clusters
    console.log('\n🔎 POTENTIAL MISSED CLUSTERS (2+ insiders, not marked):');
    console.log('─'.repeat(80));
    
    const { data: recentTrades, error: tradesError } = await supabaseAdmin
      .from('insider_trades')
      .select('ticker, transaction_type, filing_date, insider_name, is_cluster_buy')
      .gte('filing_date', dateFilter)
      .order('filing_date', { ascending: false });

    if (tradesError) throw tradesError;

    // Find potential clusters
    const tickerTypeGroups = {};
    recentTrades.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}`;
      if (!tickerTypeGroups[key]) {
        tickerTypeGroups[key] = {
          ticker: trade.ticker,
          type: trade.transaction_type,
          insiders: new Set(),
          marked: false,
          dates: []
        };
      }
      tickerTypeGroups[key].insiders.add(trade.insider_name);
      tickerTypeGroups[key].dates.push(trade.filing_date);
      if (trade.is_cluster_buy) {
        tickerTypeGroups[key].marked = true;
      }
    });

    const potentialMissed = Object.entries(tickerTypeGroups)
      .filter(([key, group]) => group.insiders.size >= 2 && !group.marked)
      .map(([key, group]) => ({
        cluster: key,
        insiders: group.insiders.size,
        earliestDate: group.dates.sort()[0],
        latestDate: group.dates.sort().reverse()[0]
      }));

    if (potentialMissed.length === 0) {
      console.log('✓ No potential missed clusters found!\n');
    } else {
      console.log(`Found ${potentialMissed.length} potential clusters not marked:\n`);
      console.table(potentialMissed);
      console.log('\n💡 These may need cluster detection to be re-run\n');
    }

    console.log('═'.repeat(80));
    console.log('✨ Debug complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugClusters()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
