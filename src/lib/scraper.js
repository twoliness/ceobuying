import { SECEdgarClient } from './sec-edgar.js';
import { StockPriceClient } from './stock-price.js';
import { supabaseAdmin } from './supabase.js';

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
              cik: filing.cik
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

      // 5. Enrich with stock prices
      const uniqueTickers = [...new Set(tradesWithClusters.map(t => t.ticker))];
      console.log(`Fetching prices for ${uniqueTickers.length} unique tickers`);

      const stockPrices = await this.stockClient.getBatchStockPrices(uniqueTickers);

      const enrichedTrades = tradesWithClusters.map(trade => ({
        ...trade,
        currentPrice: stockPrices[trade.ticker]?.currentPrice,
        priceChange7d: stockPrices[trade.ticker]?.priceChange7d
      }));

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
   * Store trades in database
   */
  async storeTrades(trades) {
    if (trades.length === 0) {
      console.log('No trades to store');
      return [];
    }

    const records = trades.map(trade => ({
      filing_date: trade.filingDate,
      trade_date: trade.tradeDate,
      ticker: trade.ticker,
      company_name: trade.companyName,
      insider_name: trade.insiderName,
      insider_title: trade.insiderTitle,
      transaction_type: trade.transactionType,
      price: trade.price,
      quantity: trade.quantity,
      shares_owned_after: trade.sharesOwnedAfter,
      delta_ownership: trade.deltaOwnership,
      transaction_value: trade.value,
      current_stock_price: trade.currentPrice,
      price_change_7d: trade.priceChange7d,
      ai_summary: null,
      is_cluster_buy: trade.isClusterBuy || false,
      cluster_count: trade.clusterCount || 1,
      form_4_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.cik}&type=4&dateb=&owner=exclude&count=1`
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

    console.log(`\nAttempting to store ${uniqueRecords.length} trades:`);
    uniqueRecords.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.ticker} ${r.transaction_type} ${r.transaction_value.toLocaleString()} - ${r.insider_name}`);
    });

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
