#!/usr/bin/env node

/**
 * Test Telegram message formatting
 * Shows how the message will look with the banner
 */

import { formatDailyWatch } from '../lib/message-formatter.js';

// Sample trade data
const sampleTopBuys = [
  {
    ticker: 'NVDA',
    company_name: 'NVIDIA CORP',
    transaction_type: 'P',
    transaction_value: 81800000,
    insider_title: 'President and CEO',
    price_change_7d: -0.6,
    is_cluster_buy: true,
    cluster_count: 2
  },
  {
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
    transaction_type: 'P',
    transaction_value: 5200000,
    insider_title: 'Director',
    price_change_7d: 2.3,
    is_cluster_buy: false,
    cluster_count: 1
  }
];

const sampleClusters = [
  {
    ticker: 'COST',
    company_name: 'COSTCO WHOLESALE CORP',
    transaction_type: 'P',
    transaction_value: 1400000,
    insider_title: 'Executive VP',
    insider_name: 'John Smith',
    price_change_7d: -0.4,
    is_cluster_buy: true,
    cluster_count: 6
  },
  {
    ticker: 'COST',
    company_name: 'COSTCO WHOLESALE CORP',
    transaction_type: 'P',
    transaction_value: 550000,
    insider_title: 'CFO',
    insider_name: 'Jane Doe',
    price_change_7d: -0.4,
    is_cluster_buy: true,
    cluster_count: 6
  }
];

const sampleSales = [
  {
    ticker: 'TSLA',
    company_name: 'Tesla, Inc.',
    transaction_type: 'S',
    transaction_value: 3500000,
    insider_title: 'CEO',
    price_change_7d: -5.2,
    is_cluster_buy: false,
    cluster_count: 1
  }
];

// Generate message
const message = formatDailyWatch({
  topBuys: sampleTopBuys,
  clusters: sampleClusters,
  topSales: sampleSales
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📱 TELEGRAM MESSAGE PREVIEW');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(message);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n✅ Message length: ${message.length} characters`);
console.log('💡 Telegram max: 4096 characters\n');
