#!/usr/bin/env node

/**
 * Cron script to run the insider trade scraper on a schedule
 * This can be triggered by:
 * - System cron (crontab)
 * - Vercel Cron
 * - GitHub Actions
 * - Any other scheduler
 * 
 * Run with: node src/scripts/run-scraper.js
 */

import 'dotenv/config';
import { InsiderTradeScraper } from '../lib/scraper.js';

console.log('='.repeat(60));
console.log(`🚀 Starting scheduled scraper run`);
console.log(`   Time: ${new Date().toISOString()}`);
console.log('='.repeat(60));

const scraper = new InsiderTradeScraper();

scraper.runDailyScrape()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Scraper completed successfully');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    
    // Exit with success code
    process.exit(0);
  })
  .catch(error => {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Scraper failed');
    console.error('='.repeat(60));
    console.error(error);
    
    // Exit with error code
    process.exit(1);
  });
