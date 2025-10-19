#!/usr/bin/env node

/**
 * Test SEC company_tickers.json structure
 */

import axios from 'axios';

async function testSECStructure() {
  console.log('🔍 Testing SEC company_tickers.json structure...\n');
  
  try {
    const response = await axios.get('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': 'CeoBuying contact@ceobuying.com',
        'Accept': '*/*'
      },
      timeout: 30000
    });
    
    const companies = Object.values(response.data);
    console.log(`✓ Loaded ${companies.length} companies\n`);
    
    // Show structure of first company
    console.log('📋 Sample Company Structure:');
    console.log(JSON.stringify(companies[0], null, 2));
    
    // Find and show well-known companies
    const testTickers = ['GOOGL', 'AAPL', 'MSFT', 'TSLA', 'META'];
    console.log('\n\n📊 Test Companies:');
    console.log('='.repeat(60));
    
    for (const ticker of testTickers) {
      const company = companies.find(c => c.ticker === ticker);
      if (company) {
        console.log(`\n✓ ${ticker}:`);
        console.log(`  CIK: ${company.cik_str}`);
        console.log(`  Name: ${company.title}`);
        console.log(`  All fields:`, Object.keys(company));
      } else {
        console.log(`\n✗ ${ticker}: Not found`);
      }
    }
    
    // Check if any company has SIC information
    console.log('\n\n🔍 Checking for SIC data in responses...');
    const withSIC = companies.filter(c => c.sic_description || c.sic || c.sicDescription);
    console.log(`Companies with SIC data: ${withSIC.length}`);
    
    if (withSIC.length > 0) {
      console.log('Sample with SIC:', JSON.stringify(withSIC[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSECStructure();
