#!/usr/bin/env node

/**
 * Debug why specific companies are failing
 * Test both JSON API and HTML browse page
 */

import axios from 'axios';

const failedCompanies = [
  { ticker: 'ALMU', cik: '1697851', name: 'Almaden Minerals Ltd.' },
  { ticker: 'CRWV', cik: '1844635', name: 'CoreWeave, Inc.' },
  { ticker: 'VST', cik: '1692819', name: 'Vistra Corp.' },
  { ticker: 'SARO', cik: '1824830', name: 'Saros Acquisition Corp.' }
];

async function testJSONAPI(cik, name) {
  const paddedCik = String(cik).padStart(10, '0');
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  
  console.log(`\n📡 Testing JSON API: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Success!`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   SIC: ${response.data.sic}`);
    console.log(`   Industry: ${response.data.sicDescription}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status || error.message}`);
    return false;
  }
}

async function testBrowsePage(cik, name) {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=40&hidefilings=0`;
  
  console.log(`\n📡 Testing Browse Page: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'text/html'
      },
      timeout: 10000
    });
    
    const html = response.data;
    console.log(`✅ Got HTML (${html.length} chars)`);
    
    // Try different regex patterns for company name
    console.log(`\n🔍 Searching for company info patterns...`);
    
    // Pattern 1: Company name in title or heading
    const patterns = [
      /<span class="companyName">([^<]+)<.*?CIK[^>]*>([^<]+)<.*?SIC[^>]*>(\d+)\s*-\s*([^<]+)</s,
      /<span class="companyName">([^<]+)/,
      /class="companyName">([^<]+)</,
      /CIK#:\s*<\/span>\s*(\d+)/,
      /SIC:\s*<\/span>\s*(\d+)\s*-\s*([^<\n]+)/,
      /Standard Industrial Classification.*?<\/a>\s*\(SIC\):\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/s
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i]);
      if (match) {
        console.log(`   ✓ Pattern ${i + 1} matched:`);
        console.log(`     ${match[0].substring(0, 200)}...`);
      }
    }
    
    // Look for SIC specifically
    if (html.includes('SIC')) {
      const sicIndex = html.indexOf('SIC');
      const context = html.substring(sicIndex, sicIndex + 300);
      console.log(`\n📋 SIC Context:`);
      console.log(context);
    }
    
    // Save HTML for manual inspection
    const fs = await import('fs');
    const filename = `sec-${cik}.html`;
    fs.writeFileSync(filename, html);
    console.log(`\n💾 Saved HTML to: ${filename}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Debugging Failed Companies');
  console.log('='.repeat(80));
  
  for (const company of failedCompanies) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ${company.name} (${company.ticker})`);
    console.log(`   CIK: ${company.cik}`);
    
    const jsonSuccess = await testJSONAPI(company.cik, company.name);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!jsonSuccess) {
      await testBrowsePage(company.cik, company.name);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests complete! Check the saved HTML files for details.');
}

runTests().catch(console.error);
