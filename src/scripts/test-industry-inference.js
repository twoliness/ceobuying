#!/usr/bin/env node

/**
 * Test industry inference from company names
 * Run with: node src/scripts/test-industry-inference.js
 */

import { inferIndustryFromName } from '../lib/industry-mapper.js';

const testCompanies = [
  // Tech Giants
  'Alphabet Inc.',
  'NVIDIA CORP',
  'Apple Inc.',
  'Microsoft Corporation',
  'Meta Platforms Inc.',
  'Amazon.com Inc.',
  'Tesla Motors Inc.',
  'CrowdStrike Holdings Inc.',
  'Peloton Interactive Inc.',
  
  // Finance
  'JPMorgan Chase Bank',
  'Commercial Bancgroup, Inc.',
  'Blackstone Private Multi-Asset Credit & Income Fund',
  'Goldman Sachs Group Inc.',
  'Berkshire Hathaway Inc.',
  'Morgan Stanley',
  
  // Pharma & Healthcare
  'Pfizer Inc.',
  'Zenas Biopharma, Inc.',
  'Moderna Inc.',
  'Johnson & Johnson',
  
  // Retail
  'Walmart Inc.',
  'Target Corporation',
  
  // Semiconductors
  'Intel Corporation',
  'Advanced Micro Devices Inc.',
  'Qualcomm Inc.',
  
  // Other
  'Boeing Company',
  'Coca-Cola Company',
  'Nike Inc.',
  'Starbucks Corporation'
];

console.log('🧪 Testing Industry Inference');
console.log('='.repeat(80));

let successCount = 0;
let failCount = 0;

testCompanies.forEach(company => {
  const industry = inferIndustryFromName(company);
  const status = industry ? '✓' : '✗';
  const result = industry || 'NULL';
  
  if (industry) {
    successCount++;
  } else {
    failCount++;
  }
  
  console.log(`${status} ${company.padEnd(50)} → ${result}`);
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${successCount}/${testCompanies.length} successful (${Math.round(successCount/testCompanies.length*100)}%)`);
console.log(`   ✓ Success: ${successCount}`);
console.log(`   ✗ Failed: ${failCount}`);

if (successCount === testCompanies.length) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some companies could not be classified.');
  console.log('   Consider adding them to KNOWN_COMPANIES in industry-mapper.js');
  process.exit(0);
}
