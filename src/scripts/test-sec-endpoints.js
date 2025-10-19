#!/usr/bin/env node

/**
 * Test different SEC endpoints to find the correct one
 */

import axios from 'axios';

const endpoints = [
  'https://www.sec.gov/files/company_tickers.json',
  'https://www.sec.gov/files/company_tickers_exchange.json',
  'https://data.sec.gov/files/company_tickers.json'
];

async function testEndpoint(url) {
  console.log(`\nTesting: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CeoBuying contact@ceobuying.com',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 10000
    });
    
    console.log(`✓ SUCCESS! Status: ${response.status}`);
    const data = response.data;
    const companies = Object.values(data);
    console.log(`  Found ${companies.length} companies`);
    
    if (companies.length > 0) {
      console.log(`  Sample:`, JSON.stringify(companies[0], null, 2));
    }
    
    return { url, success: true, count: companies.length };
  } catch (error) {
    console.log(`✗ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
    }
    return { url, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 Testing SEC API Endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n📊 Summary:');
  console.log('='.repeat(60));
  results.forEach(r => {
    if (r.success) {
      console.log(`✓ ${r.url}`);
      console.log(`  Companies: ${r.count}`);
    } else {
      console.log(`✗ ${r.url}`);
      console.log(`  Error: ${r.error}`);
    }
  });
}

runTests().catch(console.error);
