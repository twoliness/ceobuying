#!/usr/bin/env node

/**
 * Simple test - shows what will appear in Top Trades This Week
 * Run with: npm run test:hero
 */

import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

console.log('🔍 Testing Top Trades This Week\n');

async function test() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

    console.log(`Looking for trades from ${dateFilter} onwards...\n`);

    const { data: allTrades, error } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .gte('filing_date', dateFilter);

    if (error) throw error;

    if (!allTrades || allTrades.length === 0) {
      console.log('❌ No trades found this week\n');
      console.log('Run: npm run test:scraper\n');
      return;
    }

    console.log(`✅ Found ${allTrades.length} trades this week\n`);

    // Group by ticker + type
    const groups = {};
    allTrades.forEach(t => {
      const key = `${t.ticker}-${t.transaction_type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    console.log('📊 Grouping by ticker + type:\n');
    
    const results = [];
    Object.entries(groups).forEach(([key, trades]) => {
      const totalValue = trades.reduce((sum, t) => sum + t.transaction_value, 0);
      const type = trades[0].transaction_type === 'P' ? 'BUY ' : 'SELL';
      const count = trades.length;
      
      results.push({
        ticker: trades[0].ticker,
        type,
        count,
        totalValue,
        absValue: Math.abs(totalValue)
      });
    });

    // Sort by absolute value
    results.sort((a, b) => b.absValue - a.absValue);

    console.log('🏆 Top 10 (what will show in UI):\n');
    results.slice(0, 10).forEach((r, i) => {
      const multi = r.count > 1 ? ` (${r.count} insiders)` : '';
      console.log(`${(i+1).toString().padStart(2)}. ${r.type} ${r.ticker.padEnd(6)} $${(r.absValue / 1000000).toFixed(2).padStart(6)}M${multi}`);
    });

    // Check NVIDIA specifically
    const nvda = results.find(r => r.ticker === 'NVDA');
    if (nvda) {
      console.log(`\n✅ NVIDIA ${nvda.type}: $${(nvda.absValue / 1000000).toFixed(2)}M (${nvda.count} insiders)`);
      console.log('   Should appear in top trades!\n');
    } else {
      console.log('\n⚠️  NVIDIA not found in this week\'s data\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
