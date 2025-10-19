#!/usr/bin/env node

/**
 * Debug: Fetch and display raw HTML from SEC company page
 */

import axios from 'axios';
import fs from 'fs';

async function fetchAndSaveHTML(cik) {
  try {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=40&hidefilings=0`;
    
    console.log(`📡 Fetching: ${url}\n`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CeoBuying admin@ceobuying.com',
        'Accept': 'text/html'
      },
      timeout: 10000
    });
    
    const html = response.data;
    
    // Save to file for inspection
    fs.writeFileSync('sec-company-page.html', html);
    console.log('✅ HTML saved to: sec-company-page.html\n');
    
    // Show first 2000 characters
    console.log('📄 First 2000 characters of HTML:');
    console.log('='.repeat(80));
    console.log(html.substring(0, 2000));
    console.log('='.repeat(80));
    
    // Look for SIC pattern
    console.log('\n🔍 Searching for SIC pattern...');
    if (html.includes('SIC')) {
      const sicContext = html.match(/.{0,200}SIC.{0,200}/s);
      if (sicContext) {
        console.log('Found SIC context:');
        console.log(sicContext[0]);
      }
    } else {
      console.log('❌ "SIC" not found in HTML');
    }
    
    // Look for company name pattern
    console.log('\n🔍 Searching for company name pattern...');
    if (html.includes('companyName')) {
      const nameContext = html.match(/.{0,200}companyName.{0,200}/s);
      if (nameContext) {
        console.log('Found companyName context:');
        console.log(nameContext[0]);
      }
    } else {
      console.log('❌ "companyName" class not found in HTML');
    }
    
    // Try to find any industry-related text
    console.log('\n🔍 Searching for industry-related keywords...');
    const keywords = ['Standard Industrial', 'SIC Code', 'Industry', 'Business'];
    for (const keyword of keywords) {
      if (html.includes(keyword)) {
        console.log(`✓ Found: "${keyword}"`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Test with Alphabet
fetchAndSaveHTML('1652044').catch(console.error);
