#!/usr/bin/env node

/**
 * Test the scraper manually
 * Run with: node src/scripts/test-scraper.js
 */

import 'dotenv/config';
import { InsiderTradeScraper } from '../lib/scraper.js';

console.log('🔍 Testing CeoBuying Scraper...');

const scraper = new InsiderTradeScraper();

scraper.runDailyScrape()
  .then(result => {
    console.log('\n✅ Scraper test completed:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Scraper test failed:');
    console.error(error);
    process.exit(1);
  });
