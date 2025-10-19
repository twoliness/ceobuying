#!/usr/bin/env node

/**
 * Test SEC company data fetching
 * Run with: node src/scripts/test-sec-company-data.js
 */

import 'dotenv/config';
import { StockPriceClient } from '../lib/stock-price.js';

console.log('🔍 Testing SEC Company Data Fetching...\n');

const stockClient = new StockPriceClient();

// Test with a few common tickers
const testTickers = ['GOOGL', 'AAPL', 'MSFT', 'TSLA', 'NVDA'];

async function testCompanyInfo() {
  console.log(`Testing company info for: ${testTickers.join(', ')}\n`);
  
  const results = await stockClient.getBatchCompanyInfo(testTickers);
  
  console.log('\n📊 Results:\n');
  for (const [ticker, info] of Object.entries(results)) {
    if (info) {
      console.log(`✓ ${ticker}:`);
      console.log(`  Company: ${info.companyName || info.ticker}`);
      console.log(`  Industry: ${info.industry || 'Unknown'}`);
      console.log(`  CIK: ${info.cik || 'N/A'}`);
    } else {
      console.log(`✗ ${ticker}: No data found`);
    }
    console.log('');
  }
}

testCompanyInfo()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
