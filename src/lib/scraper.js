import { SECEdgarClient } from './sec-edgar.js';
import { StockPriceClient } from './stock-price.js';
import { supabaseAdmin } from './supabase.js';
import { inferIndustryFromName } from './industry-mapper.js';

/**
 * Main scraper orchestrator
 * Coordinates SEC data fetching, enrichment, and storage
 */
export class InsiderTradeScraper {
  constructor() {
    this.secClient = new SECEdgarClient();
    this.stockClient = new StockPriceClient();
    // No minimum thresholds - CeoBuying shows ALL insider trading activity
    // Users can filter by value in the frontend UI if needed
    this.minBuyValue = 0;    // Capture all purchases
    this.minSaleValue = 0;   // Capture all sales
  }

  /**
   * Run the full scraping pipeline
   */
  async runDailyScrape() {
    console.log('Starting daily insider trade scrape...');
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    console.log(`🇺🇸 SEC EDGAR operates on US Eastern Time (ET)`);
    console.log(`📅 Today's date (UTC): ${new Date().toISOString().split('T')[0]}`);
    console.log('');

    try {
      // 1. Fetch recent Form 4 filings
      const filings = await this.secClient.getRecentForm4Filings(100);
      console.log(`Found ${filings.length} Form 4 filings`);

      // Deduplicate filings by accession number (same filing can appear multiple times for different filers)
      const uniqueFilings = Array.from(
        new Map(filings.map(f => [f.accessionNumber, f])).values()
      );
      console.log(`Deduplicated to ${uniqueFilings.length} unique filings`);

      const allTrades = [];

      // 2. Parse each filing
      // For testing: set lower limit. For production: process all uniqueFilings
      const maxFilings = process.env.MAX_FILINGS ? parseInt(process.env.MAX_FILINGS) : uniqueFilings.length;
      const filingsToProcess = uniqueFilings.slice(0, maxFilings);
      console.log(`Processing ${filingsToProcess.length} filings (out of ${uniqueFilings.length} available)...`);
      if (maxFilings < uniqueFilings.length) {
        console.log(`  Note: Limited to ${maxFilings} filings. Set MAX_FILINGS env var to process more.`);
      }

      for (const filing of filingsToProcess) {
        try {
          if (!filing.cik) {
            console.log(`  Skipping ${filing.accessionNumber} - no CIK`);
            continue;
          }

          console.log(`\nParsing: ${filing.companyName || 'Unknown'}`);
          console.log(`  Accession: ${filing.accessionNumber}`);
          console.log(`  CIK: ${filing.cik}`);

          const form4Data = await this.secClient.parseForm4(filing.accessionNumber, filing.cik);

          if (form4Data?.trades && form4Data.trades.length > 0) {
            console.log(`  Found ${form4Data.trades.length} trades`);
            allTrades.push(...form4Data.trades.map(t => ({
              ...t,
              filingDate: filing.filingDate,
              accessionNumber: filing.accessionNumber,
              companyCik: t.companyCik || filing.cik  // Use company CIK from trade, fallback to filing CIK
            })));
          } else {
            console.log(`  No trades found`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`  Error: ${error.message}`);
        }
      }

      console.log(`Parsed ${allTrades.length} trades`);

      // 3. Filter trades by value (currently no minimum - capturing all trades)
      const filteredTrades = allTrades.filter(trade => {
        const isSignificant = (trade.transactionType === 'P' && trade.value >= this.minBuyValue) ||
                             (trade.transactionType === 'S' && trade.value >= this.minSaleValue);
        
        if (!isSignificant) {
          console.log(`  Filtering out: ${trade.ticker} ${trade.transactionType} ${trade.value.toLocaleString()} (below threshold)`);
        }
        
        return isSignificant;
      });

      console.log(`Filtered to ${filteredTrades.length} trades for processing`);
      console.log(`  Purchases: ${filteredTrades.filter(t => t.transactionType === 'P').length}`);
      console.log(`  Sales: ${filteredTrades.filter(t => t.transactionType === 'S').length}`);

      // 4. Detect cluster buys (multiple insiders buying same stock within 7 days)
      const tradesWithClusters = this.detectClusterBuys(filteredTrades);

      // 5. Enrich with stock prices and company info
      const uniqueTickers = [...new Set(tradesWithClusters.map(t => t.ticker))];
      const uniqueCIKs = [...new Set(tradesWithClusters.map(t => t.companyCik).filter(Boolean))];
      
      console.log(`\n📊 Fetching prices and company info for ${uniqueTickers.length} unique tickers`);
      console.log(`   Tickers: ${uniqueTickers.join(', ')}`);
      console.log(`   Using ${uniqueCIKs.length} COMPANY CIKs for SEC data (not insider CIKs)\n`);

      // Create a map of CIK to ticker for efficient lookup
      const cikToTicker = {};
      const tickerToCompany = {};
      tradesWithClusters.forEach(trade => {
        if (trade.companyCik && trade.ticker) {
          cikToTicker[trade.companyCik] = trade.ticker;
          tickerToCompany[trade.ticker] = {
            name: trade.companyName,
            cik: trade.companyCik  // This is the COMPANY's CIK
          };
        }
      });

      // Fetch company info from SEC (includes industry via SIC code)
      console.log('  🔍 Fetching industry data from SEC EDGAR company pages...');
      const secCompanyInfo = {};
      const failedCIKs = [];
      let secSuccessCount = 0;
      
      for (const cik of uniqueCIKs) {
        const ticker = cikToTicker[cik];
        console.log(`    🔍 Fetching ${ticker} (CIK: ${cik})...`);
        
        const info = await this.secClient.getCompanyInfo(cik);
        
        if (info && info.industry) {
          secCompanyInfo[ticker] = info;
          secSuccessCount++;
          console.log(`    ✓ ${ticker}: "${info.industry}"`);
        } else {
          const companyName = tickerToCompany[ticker]?.name || 'Unknown';
          failedCIKs.push({ 
            cik, 
            ticker, 
            companyName,
            reason: info ? 'No industry field' : 'API failed' 
          });
          console.log(`    ✗ ${ticker} (${companyName}): Failed to fetch company info`);
        }
        
        // Rate limit: 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`  ✓ Successfully fetched ${secSuccessCount}/${uniqueCIKs.length} companies from SEC`);
      
      if (failedCIKs.length > 0) {
        console.log(`\n  ⚠️  Failed to fetch ${failedCIKs.length} companies from SEC JSON API:`);
        failedCIKs.forEach(({ ticker, cik, companyName, reason }) => {
          console.log(`     ${ticker} (${companyName}) - CIK: ${cik} - ${reason}`);
          console.log(`        URL: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=40&hidefilings=0`);
        });
        
        console.log(`\n  🔧 To debug these companies, run:`);
        console.log(`     npm run debug:failed`);
        console.log(`     Or check the URLs above manually\n`);
        
        // Try to infer industry from company name for failed companies
        console.log(`\n  🧠 Attempting to infer industry from company names...`);
        let inferredCount = 0;
        
        for (const { ticker, cik } of failedCIKs) {
          const companyInfo = tickerToCompany[ticker];
          if (companyInfo && companyInfo.name) {
            const inferredIndustry = inferIndustryFromName(companyInfo.name);
            if (inferredIndustry) {
              secCompanyInfo[ticker] = {
                cik,
                companyName: companyInfo.name,
                industry: inferredIndustry,
                source: 'inferred'
              };
              inferredCount++;
              console.log(`     ✓ ${ticker} (${companyInfo.name}): "${inferredIndustry}"`);
            } else {
              console.log(`     ✗ ${ticker}: Could not infer industry from name`);
            }
          }
        }
        
        if (inferredCount > 0) {
          console.log(`  ✓ Inferred industry for ${inferredCount}/${failedCIKs.length} failed companies`);
        }
      }
      console.log('');

      // Fetch stock prices
      const stockPrices = await this.stockClient.getBatchStockPrices(uniqueTickers);

      // Debug: Show what company info we got
      console.log('\n🔍 DEBUG: Company Info Results:');
      for (const ticker of uniqueTickers) {
        const info = secCompanyInfo[ticker];
        if (info) {
          console.log(`  ✓ ${ticker}: Industry = "${info.industry || 'NULL'}"`);
        } else {
          console.log(`  ✗ ${ticker}: No company info found`);
        }
      }
      console.log('');

      const enrichedTrades = tradesWithClusters.map(trade => {
        const industry = secCompanyInfo[trade.ticker]?.industry || null;
        return {
          ...trade,
          currentPrice: stockPrices[trade.ticker]?.currentPrice,
          priceChange7d: stockPrices[trade.ticker]?.priceChange7d,
          industry: industry
        };
      });

      // Debug: Show first 3 enriched trades
      console.log('🔍 DEBUG: First 3 Enriched Trades:');
      enrichedTrades.slice(0, 3).forEach((trade, idx) => {
        console.log(`  ${idx + 1}. ${trade.ticker} - Industry: "${trade.industry || 'NULL'}"`);
      });
      console.log('');

      // 6. Store in database
      await this.storeTrades(enrichedTrades);

      console.log('Daily scrape completed successfully');

      return {
        success: true,
        tradesProcessed: enrichedTrades.length
      };

    } catch (error) {
      console.error('Error in daily scrape:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect cluster buys (multiple insiders buying same stock)
   */
  detectClusterBuys(trades) {
    // Group purchases by ticker and recent date (within 7 days)
    const buysByTicker = {};

    trades.forEach(trade => {
      if (trade.transactionType === 'P') {
        if (!buysByTicker[trade.ticker]) {
          buysByTicker[trade.ticker] = [];
        }
        buysByTicker[trade.ticker].push(trade);
      }
    });

    // Mark cluster buys
    return trades.map(trade => {
      if (trade.transactionType === 'P') {
        const tickerBuys = buysByTicker[trade.ticker] || [];
        const isCluster = tickerBuys.length >= 2;
        return {
          ...trade,
          isClusterBuy: isCluster,
          clusterCount: tickerBuys.length
        };
      }
      return trade;
    });
  }

  /**
   * Format date to PostgreSQL DATE format (YYYY-MM-DD)
   * Handles various input formats from SEC data
   */
  formatDate(dateString) {
    if (!dateString) return null;
    
    // Remove any timezone info or extra characters
    // Handles formats like: "2025-10-14", "2025-10-14-05:00", "2025-10-14T00:00:00"
    const cleanDate = dateString.split('T')[0].split('-').slice(0, 3).join('-');
    
    // Validate it's a proper date
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}, using current date`);
      return new Date().toISOString().split('T')[0];
    }
    
    return cleanDate;
  }

  /**
   * Store trades in database
   */
  async storeTrades(trades) {
    if (trades.length === 0) {
      console.log('No trades to store');
      return [];
    }

    const records = trades.map(trade => ({
      filing_date: this.formatDate(trade.filingDate),
      trade_date: this.formatDate(trade.tradeDate),
      ticker: trade.ticker,
      company_name: trade.companyName,
      industry: trade.industry || null,
      insider_name: trade.insiderName,
      insider_title: trade.insiderTitle,
      transaction_type: trade.transactionType,
      price: trade.price,
      quantity: Math.round(trade.quantity), // Round to integer
      shares_owned_after: Math.round(trade.sharesOwnedAfter), // Round to integer
      delta_ownership: trade.deltaOwnership,
      transaction_value: trade.value,
      current_stock_price: trade.currentPrice,
      price_change_7d: trade.priceChange7d,
      ai_summary: null,
      is_cluster_buy: trade.isClusterBuy || false,
      cluster_count: trade.clusterCount || 1,
      form_4_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.companyCik}&type=4&dateb=&owner=exclude&count=1`
    }));

    // Deduplicate records within this batch using the same unique constraint fields
    const uniqueRecords = Array.from(
      new Map(
        records.map(r => [
          `${r.filing_date}|${r.trade_date}|${r.ticker}|${r.insider_name}|${r.transaction_type}|${r.transaction_value}`,
          r
        ])
      ).values()
    );

    if (uniqueRecords.length < records.length) {
      console.log(`Deduplicated ${records.length} records to ${uniqueRecords.length} unique records`);
    }

    console.log(`\n💾 Attempting to store ${uniqueRecords.length} trades:`);
    
    // Debug: Show first 3 records with industry data
    console.log('\n🔍 DEBUG: First 3 Records Being Saved:');
    uniqueRecords.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.ticker} ${r.transaction_type} ${r.transaction_value.toLocaleString()}`);
      console.log(`     Insider: ${r.insider_name}`);
      console.log(`     Industry: "${r.industry || 'NULL'}"`);
      console.log(`     Company: ${r.company_name}`);
    });
    console.log('');

    // Use upsert to handle duplicates gracefully
    // This will update existing records or insert new ones based on the unique constraint
    const { data, error } = await supabaseAdmin
      .from('insider_trades')
      .upsert(uniqueRecords, {
        onConflict: 'filing_date,trade_date,ticker,insider_name,transaction_type,transaction_value',
        ignoreDuplicates: false // Update if exists
      })
      .select();

    if (error) {
      console.error('Error storing trades:', error);
      throw error;
    }

    console.log(`\n✅ Successfully processed ${uniqueRecords.length} trades`);
    console.log(`   Database returned ${data?.length || 0} records`);
    if (data?.length !== uniqueRecords.length) {
      console.log(`   Note: ${uniqueRecords.length - (data?.length || 0)} trades already existed and were updated`);
    }
    
    return data;
  }
}

export default InsiderTradeScraper;
