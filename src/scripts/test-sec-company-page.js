#!/usr/bin/env node

/**
 * Test fetching company info from SEC EDGAR browse page
 * This is what OpenInsider likely uses!
 */

import axios from 'axios';

async function fetchSECCompanyInfo(cik) {
  try {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=40&hidefilings=0`;
    
    console.log(`\n📡 Fetching: ${url}\n`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'text/html'
      },
      timeout: 10000
    });
    
    const html = response.data;
    
    // Extract company name
    const nameMatch = html.match(/<span class="companyName">([^<]+)/);
    const companyName = nameMatch ? nameMatch[1].trim() : null;
    
    // Extract CIK
    const cikMatch = html.match(/CIK#:\s*<\/span>\s*(\d+)/);
    const extractedCik = cikMatch ? cikMatch[1] : null;
    
    // Extract SIC code and description - THIS IS THE KEY!
    const sicMatch = html.match(/SIC:\s*<\/span>\s*(\d+)\s*-\s*([^<]+)/);
    const sicCode = sicMatch ? sicMatch[1].trim() : null;
    const sicDescription = sicMatch ? sicMatch[2].trim() : null;
    
    // Extract state/location
    const stateMatch = html.match(/State location:\s*<\/span>\s*<acronym[^>]*>([^<]+)/);
    const state = stateMatch ? stateMatch[1].trim() : null;
    
    console.log('✅ Successfully extracted company info:\n');
    console.log(`Company Name:      ${companyName || 'N/A'}`);
    console.log(`CIK:               ${extractedCik || 'N/A'}`);
    console.log(`SIC Code:          ${sicCode || 'N/A'}`);
    console.log(`SIC Description:   ${sicDescription || 'N/A'}`);
    console.log(`State:             ${state || 'N/A'}`);
    
    return {
      companyName,
      cik: extractedCik,
      sicCode,
      industry: sicDescription, // This is what OpenInsider uses!
      state
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

// Test with several companies
const testCIKs = [
  { cik: '1652044', name: 'Alphabet/Google' },
  { cik: '0000320193', name: 'Apple' },
  { cik: '0000789019', name: 'Microsoft' },
  { cik: '0001318605', name: 'Tesla' },
  { cik: '0001045810', name: 'NVIDIA' },
  { cik: '0001326801', name: 'Meta/Facebook' },
  { cik: '0000078003', name: 'Pfizer' }
];

async function runTests() {
  console.log('🔍 Testing SEC EDGAR Company Info Extraction');
  console.log('='.repeat(80));
  
  for (const { cik, name } of testCIKs) {
    console.log(`\n📊 Testing: ${name} (CIK: ${cik})`);
    await fetchSECCompanyInfo(cik);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!');
}

runTests().catch(console.error);
