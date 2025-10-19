#!/usr/bin/env node

/**
 * Test SEC's newer JSON APIs for company information
 */

import axios from 'axios';

async function testSECJsonAPIs(cik) {
  const paddedCik = String(cik).padStart(10, '0');
  
  console.log(`\n🔍 Testing SEC JSON APIs for CIK: ${cik} (padded: ${paddedCik})\n`);
  
  // API 1: Submissions endpoint
  try {
    console.log('1️⃣ Testing submissions.json...');
    const url1 = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
    console.log(`   URL: ${url1}`);
    
    const response1 = await axios.get(url1, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    const data = response1.data;
    console.log('   ✅ Success! Found:');
    console.log(`      Company Name: ${data.name || 'N/A'}`);
    console.log(`      CIK: ${data.cik || 'N/A'}`);
    console.log(`      SIC: ${data.sic || 'N/A'}`);
    console.log(`      SIC Description: ${data.sicDescription || 'N/A'}`);
    console.log(`      State: ${data.stateOfIncorporation || 'N/A'}`);
    console.log(`      Fiscal Year End: ${data.fiscalYearEnd || 'N/A'}`);
    
    return {
      name: data.name,
      cik: data.cik,
      sic: data.sic,
      industry: data.sicDescription, // THIS IS IT!
      state: data.stateOfIncorporation
    };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // API 2: Company facts endpoint
  try {
    console.log('\n2️⃣ Testing companyfacts.json...');
    const url2 = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;
    console.log(`   URL: ${url2}`);
    
    const response2 = await axios.get(url2, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    const data = response2.data;
    console.log('   ✅ Success! Found:');
    console.log(`      Entity Name: ${data.entityName || 'N/A'}`);
    console.log(`      CIK: ${data.cik || 'N/A'}`);
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
}

// Test with multiple companies
const testCIKs = [
  { cik: '1652044', name: 'Alphabet' },
  { cik: '320193', name: 'Apple' },
  { cik: '789019', name: 'Microsoft' },
  { cik: '1045810', name: 'NVIDIA' }
];

async function runTests() {
  console.log('🧪 Testing SEC JSON APIs for Company Information');
  console.log('='.repeat(80));
  
  for (const { cik, name } of testCIKs) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ${name} (CIK: ${cik})`);
    await testSECJsonAPIs(cik);
    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests complete!');
}

runTests().catch(console.error);
