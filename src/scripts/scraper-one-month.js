#!/usr/bin/env node

/**
 * 1-Month SEC Scraper - Comprehensive Data Collection
 * Fetches ALL trades (purchases, sales, gifts, awards, etc.) from the last 30 days
 * Replaces existing data in database
 * Run with: npm run scraper:month
 */

import 'dotenv/config';
import { SECEdgarClient } from '../lib/sec-edgar.js';
import { StockPriceClient } from '../lib/stock-price.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { inferIndustryFromName } from '../lib/industry-mapper.js';

console.log('🚀 Starting 1-Month SEC Scraper (ALL Trade Types)...\n');
console.log(`⏰ Current time: ${new Date().toISOString()}`);
console.log('');

const secClient = new SECEdgarClient();
const stockClient = new StockPriceClient();

async function scrapeOneMonth() {
  try {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`📅 Fetching filings from: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    console.log('');

    // Fetch more filings to cover 30 days (estimate: ~500-1000 Form 4s per month)
    const maxFilings = 1000; // Increased from 100
    console.log(`🔍 Fetching up to ${maxFilings} recent Form 4 filings...`);
    
    const filings = await secClient.getRecentForm4Filings(maxFilings);
    console.log(`✓ Found ${filings.length} Form 4 filings\n`);

    // Deduplicate by accession number
    const uniqueFilings = Array.from(
      new Map(filings.map(f => [f.accessionNumber, f])).values()
    );
    console.log(`✓ Deduplicated to ${uniqueFilings.length} unique filings\n`);

    // Filter filings within our date range
    const filingsInRange = uniqueFilings.filter(filing => {
      const filingDate = new Date(filing.filingDate);
      return filingDate >= startDate && filingDate <= endDate;
    });

    console.log(`✓ ${filingsInRange.length} filings within the last 30 days\n`);
    console.log('─'.repeat(80));

    // Parse all filings
    const allTrades = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filingsInRange.length; i++) {
      const filing = filingsInRange[i];
      
      try {
        if (!filing.cik) {
          console.log(`[${i + 1}/${filingsInRange.length}] Skipping - no CIK`);
          continue;
        }

        console.log(`[${i + 1}/${filingsInRange.length}] Parsing: ${filing.companyName || 'Unknown'}`);
        console.log(`  📄 Accession: ${filing.accessionNumber}`);
        console.log(`  🏢 CIK: ${filing.cik}`);

        const form4Data = await secClient.parseForm4(filing.accessionNumber, filing.cik);

        if (form4Data?.trades && form4Data.trades.length > 0) {
          console.log(`  ✓ Found ${form4Data.trades.length} trades`);
          
          // Log trade types found
          const types = [...new Set(form4Data.trades.map(t => t.transactionType))];
          console.log(`  📊 Types: ${types.join(', ')}`);
          
          allTrades.push(...form4Data.trades.map(t => ({
            ...t,
            filingDate: filing.filingDate,
            accessionNumber: filing.accessionNumber,
            companyCik: t.companyCik || filing.cik
          })));
          
          successCount++;
        } else {
          console.log(`  ⚠️  No trades found`);
        }

        // Rate limiting - be respectful to SEC servers
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      }

      console.log('');
    }

    console.log('─'.repeat(80));
    console.log(`\n📊 Parsing Summary:`);
    console.log(`   ✓ Successfully parsed: ${successCount} filings`);
    console.log(`   ✗ Errors: ${errorCount} filings`);
    console.log(`   📈 Total trades extracted: ${allTrades.length}\n`);

    // Analyze trade types
    const tradeTypes = {};
    allTrades.forEach(trade => {
      const type = trade.transactionType || 'Unknown';
      tradeTypes[type] = (tradeTypes[type] || 0) + 1;
    });

    console.log('📊 Trade Types Breakdown:');
    Object.entries(tradeTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      const percentage = ((count / allTrades.length) * 100).toFixed(1);
      console.log(`   ${type.padEnd(2)}: ${count.toString().padStart(5)} trades (${percentage}%)`);
    });
    console.log('');

    if (allTrades.length === 0) {
      console.log('❌ No trades found. Exiting.\n');
      return;
    }

    // Store ALL trades (no filtering by type or value)
    console.log('💾 Storing trades in database...\n');
    await storeTrades(allTrades);

    // Detect clusters across entire database
    console.log('\n🔥 Detecting clusters...\n');
    await detectClusters();

    // Enrich with company info and stock prices
    const uniqueTickers = [...new Set(allTrades.map(t => t.ticker))];
    const uniqueCIKs = [...new Set(allTrades.map(t => t.companyCik).filter(Boolean))];
    
    console.log(`\n📊 Enriching data for ${uniqueTickers.length} unique tickers...\n`);
    await enrichData(uniqueTickers, uniqueCIKs, allTrades);

    console.log('\n✅ 1-Month scraper completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Filings processed: ${successCount}`);
    console.log(`   - Trades stored: ${allTrades.length}`);
    console.log(`   - Unique tickers: ${uniqueTickers.length}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

async function storeTrades(trades) {
  const records = trades.map(trade => ({
    filing_date: formatDate(trade.filingDate),
    trade_date: formatDate(trade.tradeDate),
    ticker: trade.ticker,
    company_name: trade.companyName,
    industry: null, // Will be enriched later
    insider_name: trade.insiderName,
    insider_title: trade.insiderTitle,
    transaction_type: trade.transactionType, // ALL types (P, S, A, G, D, etc.)
    price: trade.price,
    quantity: Math.round(trade.quantity),
    shares_owned_after: Math.round(trade.sharesOwnedAfter),
    delta_ownership: trade.deltaOwnership,
    transaction_value: trade.value,
    current_stock_price: null,
    price_change_7d: null,
    is_cluster_buy: false, // Will be detected later
    cluster_count: 1,
    form_4_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.companyCik}&type=4`
  }));

  // Deduplicate within batch
  const uniqueRecords = Array.from(
    new Map(
      records.map(r => [
        `${r.filing_date}|${r.trade_date}|${r.ticker}|${r.insider_name}|${r.transaction_type}|${r.transaction_value}`,
        r
      ])
    ).values()
  );

  console.log(`   💾 Storing ${uniqueRecords.length} unique trades...`);

  // Upsert will replace existing trades with same key
  const { data, error } = await supabaseAdmin
    .from('insider_trades')
    .upsert(uniqueRecords, {
      onConflict: 'filing_date,trade_date,ticker,insider_name,transaction_type,transaction_value',
      ignoreDuplicates: false // Update if exists
    })
    .select();

  if (error) {
    console.error('   ❌ Database error:', error);
    throw error;
  }

  console.log(`   ✓ Stored successfully (${data?.length || 0} records)`);
  if (data?.length !== uniqueRecords.length) {
    console.log(`   ℹ️  ${uniqueRecords.length - (data?.length || 0)} trades were updates to existing records`);
  }
}

async function detectClusters() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: allTrades, error } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .gte('filing_date', dateFilter);

    if (error) throw error;
    if (!allTrades || allTrades.length === 0) return;

    console.log(`   🔍 Analyzing ${allTrades.length} trades for clusters...`);

    // Group by ticker + transaction_type
    const groups = {};
    allTrades.forEach(trade => {
      const key = `${trade.ticker}-${trade.transaction_type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(trade);
    });

    let clusterCount = 0;
    let updatedCount = 0;

    for (const [key, trades] of Object.entries(groups)) {
      const [ticker, type] = key.split('-');
      
      // Check for multiple DIFFERENT insiders
      const uniqueInsiders = new Set(trades.map(t => t.insider_name));
      
      if (uniqueInsiders.size >= 2) {
        // Group by 7-day time windows
        const sortedTrades = [...trades].sort((a, b) => 
          new Date(a.filing_date) - new Date(b.filing_date)
        );

        const timeGroups = [];
        for (const trade of sortedTrades) {
          const tradeDate = new Date(trade.filing_date);
          
          let addedToGroup = false;
          for (const group of timeGroups) {
            const groupStart = new Date(group.startDate);
            const daysDiff = Math.abs((tradeDate - groupStart) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 7) {
              group.trades.push(trade);
              group.endDate = trade.filing_date;
              addedToGroup = true;
              break;
            }
          }
          
          if (!addedToGroup) {
            timeGroups.push({
              startDate: trade.filing_date,
              endDate: trade.filing_date,
              trades: [trade]
            });
          }
        }

        // Mark time groups with 2+ different insiders as clusters
        for (const timeGroup of timeGroups) {
          const groupInsiders = new Set(timeGroup.trades.map(t => t.insider_name));
          
          if (groupInsiders.size >= 2) {
            clusterCount++;
            const typeLabel = type === 'P' ? 'Purchases' : type === 'S' ? 'Sales' : `Type ${type}`;
            console.log(`   🔥 ${ticker} ${typeLabel}: ${groupInsiders.size} different insiders`);

            for (const trade of timeGroup.trades) {
              await supabaseAdmin
                .from('insider_trades')
                .update({
                  is_cluster_buy: true,
                  cluster_count: groupInsiders.size
                })
                .eq('id', trade.id);
              
              updatedCount++;
            }
          }
        }
      }
    }

    console.log(`   ✓ Found ${clusterCount} clusters, updated ${updatedCount} trades`);

  } catch (error) {
    console.error('   ❌ Error detecting clusters:', error.message);
  }
}

async function enrichData(uniqueTickers, uniqueCIKs, allTrades) {
  // Create maps
  const cikToTicker = {};
  const tickerToCompany = {};
  allTrades.forEach(trade => {
    if (trade.companyCik && trade.ticker) {
      cikToTicker[trade.companyCik] = trade.ticker;
      tickerToCompany[trade.ticker] = {
        name: trade.companyName,
        cik: trade.companyCik
      };
    }
  });

  // Fetch company info
  console.log('   📊 Fetching company info from SEC...');
  const secCompanyInfo = {};
  let successCount = 0;
  
  for (const cik of uniqueCIKs) {
    const ticker = cikToTicker[cik];
    const info = await secClient.getCompanyInfo(cik);
    
    if (info && info.industry) {
      secCompanyInfo[ticker] = info;
      successCount++;
    } else {
      // Try to infer industry
      const companyName = tickerToCompany[ticker]?.name;
      if (companyName) {
        const inferredIndustry = inferIndustryFromName(companyName);
        if (inferredIndustry) {
          secCompanyInfo[ticker] = {
            cik,
            companyName,
            industry: inferredIndustry,
            source: 'inferred'
          };
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`   ✓ Fetched ${successCount}/${uniqueCIKs.length} companies`);

  // Fetch stock prices
  console.log('   📈 Fetching stock prices...');
  const stockPrices = await stockClient.getBatchStockPrices(uniqueTickers);

  // Update database
  console.log('   💾 Updating database with enrichment data...');
  for (const ticker of uniqueTickers) {
    const updates = {};
    
    if (secCompanyInfo[ticker]?.industry) {
      updates.industry = secCompanyInfo[ticker].industry;
    }
    
    if (stockPrices[ticker]?.currentPrice) {
      updates.current_stock_price = stockPrices[ticker].currentPrice;
    }
    
    if (stockPrices[ticker]?.priceChange7d) {
      updates.price_change_7d = stockPrices[ticker].priceChange7d;
    }

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('insider_trades')
        .update(updates)
        .eq('ticker', ticker);
    }
  }

  console.log('   ✓ Enrichment complete');
}

function formatDate(dateString) {
  if (!dateString) return null;
  const cleanDate = dateString.split('T')[0].split('-').slice(0, 3).join('-');
  const date = new Date(cleanDate);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return cleanDate;
}

// Run the scraper
scrapeOneMonth()
  .then(() => {
    console.log('✨ All done!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
