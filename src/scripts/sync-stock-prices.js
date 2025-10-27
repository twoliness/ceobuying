#!/usr/bin/env node

/**
 * Sync Stock Prices from Yahoo Finance
 *
 * Usage:
 *   node src/scripts/sync-stock-prices.js [ticker] [days]
 *   node src/scripts/sync-stock-prices.js AAPL 365
 *   node src/scripts/sync-stock-prices.js all 90
 */

import 'dotenv/config';
import { StockPriceSync } from '../lib/stock-price-sync.js';

async function main() {
  const args = process.argv.slice(2);
  const ticker = args[0] || 'all';
  const days = parseInt(args[1]) || 365;

  console.log('📊 Stock Price Sync Tool\n');
  console.log(`Ticker: ${ticker}`);
  console.log(`Days: ${days}\n`);

  const sync = new StockPriceSync();

  try {
    if (ticker.toLowerCase() === 'all') {
      // Sync all tickers from insider_trades
      console.log('🔄 Syncing all tickers from insider_trades table...\n');
      const results = await sync.syncAllInsiderTradeTickers(days);

      console.log('\n📈 Summary:');
      console.log(`   Total: ${results.length}`);
      console.log(`   Success: ${results.filter(r => r.success).length}`);
      console.log(`   Failed: ${results.filter(r => !r.success).length}`);

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.log('\n❌ Failed tickers:');
        failed.forEach(r => console.log(`   - ${r.ticker}: ${r.error}`));
      }
    } else {
      // Sync single ticker
      const result = await sync.fullSync(ticker.toUpperCase(), days);

      console.log('\n✅ Sync Complete!');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
