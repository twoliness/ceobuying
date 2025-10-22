import { SECEdgarClient } from './sec-edgar.js';
import { StockPriceClient } from './stock-price.js';
import { supabaseAdmin } from './supabase.js';
import { inferIndustryFromName } from './industry-mapper.js';

/**
 * Main scraper orchestrator
 */
export class InsiderTradeScraper {
  constructor() {
    this.secClient = new SECEdgarClient();
    this.stockClient = new StockPriceClient();
    this.minBuyValue = 0;
    this.minSaleValue = 0;
  }

  async runDailyScrape() {
    console.log('Starting daily insider trade scrape...');
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // 1. Fetch recent Form 4 filings
      const filings = await this.secClient.getRecentForm4Filings(100);
      console.log(`Found ${filings.length} Form 4 filings`);

      const uniqueFilings = Array.from(
        new Map(filings.map(f => [f.accessionNumber, f])).values()
      );
      console.log(`Deduplicated to ${uniqueFilings.length} unique filings`);

      const allTrades = [];

      // 2. Parse each filing
      const maxFilings = process.env.MAX_FILINGS ? parseInt(process.env.MAX_FILINGS) : uniqueFilings.length;
      const filingsToProcess = uniqueFilings.slice(0, maxFilings);
      console.log(`Processing ${filingsToProcess.length} filings...`);

      for (const filing of filingsToProcess) {
        try {
          if (!filing.cik) continue;

          console.log(`\nParsing: ${filing.companyName || 'Unknown'}`);
          const form4Data = await this.secClient.parseForm4(filing.accessionNumber, filing.cik);

          if (form4Data?.trades && form4Data.trades.length > 0) {
            console.log(`  Found ${form4Data.trades.length} trades`);
            allTrades.push(...form4Data.trades.map(t => ({
              ...t,
              filingDate: filing.filingDate,
              accessionNumber: filing.accessionNumber,
              companyCik: t.companyCik || filing.cik
            })));
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`  Error: ${error.message}`);
        }
      }

      console.log(`Parsed ${allTrades.length} trades`);

      // 3. Filter trades - Accept ALL transaction types (P, S, A, D, E, M, F, etc.)
      // Only filter out trades with zero or negative value
      const filteredTrades = allTrades.filter(trade => {
        return trade.value > 0 && !isNaN(trade.value);
      });

      console.log(`Filtered to ${filteredTrades.length} valid trades (all transaction types)`);
      
      // Log transaction type breakdown
      const typeBreakdown = {};
      filteredTrades.forEach(t => {
        typeBreakdown[t.transactionType] = (typeBreakdown[t.transactionType] || 0) + 1;
      });
      console.log('Transaction types:', Object.entries(typeBreakdown).map(([k, v]) => `${k}:${v}`).join(', '));

      // 4. Store trades first
      console.log('\n💾 Storing trades in database...');
      await this.storeTrades(filteredTrades);

      // 5. Detect and update clusters across entire database
      console.log('\n🔥 Detecting clusters (multiple different insiders)...');
      await this.detectAndUpdateClusters();

      // 6. Enrich with stock prices and company info
      const uniqueTickers = [...new Set(filteredTrades.map(t => t.ticker))];
      const uniqueCIKs = [...new Set(filteredTrades.map(t => t.companyCik).filter(Boolean))];
      
      console.log(`\n📊 Fetching company info for ${uniqueTickers.length} tickers...`);

      const cikToTicker = {};
      const tickerToCompany = {};
      filteredTrades.forEach(trade => {
        if (trade.companyCik && trade.ticker) {
          cikToTicker[trade.companyCik] = trade.ticker;
          tickerToCompany[trade.ticker] = {
            name: trade.companyName,
            cik: trade.companyCik
          };
        }
      });

      const secCompanyInfo = {};
      
      for (const cik of uniqueCIKs) {
        const ticker = cikToTicker[cik];
        const info = await this.secClient.getCompanyInfo(cik);
        
        if (info && info.industry) {
          secCompanyInfo[ticker] = info;
          console.log(`  ✓ ${ticker}: "${info.industry}"`);
        } else {
          const companyName = tickerToCompany[ticker]?.name || 'Unknown';
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Fetch stock prices
      const stockPrices = await this.stockClient.getBatchStockPrices(uniqueTickers);

      // Update industry and prices
      console.log('\n📊 Updating stock prices and industry...');
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

      console.log('\n✅ Daily scrape completed successfully\n');

      return {
        success: true,
        tradesProcessed: filteredTrades.length
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
   * Detect REAL clusters:
   * - Multiple DIFFERENT insiders
   * - Same ticker + transaction type
   * - Within 7 days of each other
   */
  async detectAndUpdateClusters() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

      console.log(`  🔍 Analyzing trades from ${dateFilter} onwards...`);

      const { data: allTrades, error } = await supabaseAdmin
        .from('insider_trades')
        .select('*')
        .gte('filing_date', dateFilter);

      if (error) {
        console.error('  ❌ Supabase error:', error);
        throw error;
      }
      
      if (!allTrades || allTrades.length === 0) {
        console.log('  ℹ️  No trades found in last 30 days');
        return;
      }

      console.log(`  🔍 Analyzing ${allTrades.length} trades for clusters...`);

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
              console.log(`  🔥 ${ticker} ${typeLabel}: ${groupInsiders.size} different insiders`);

              for (const trade of timeGroup.trades) {
                const { error: updateError } = await supabaseAdmin
                  .from('insider_trades')
                  .update({
                    is_cluster_buy: true,
                    cluster_count: groupInsiders.size
                  })
                  .eq('id', trade.id);
                
                if (updateError) {
                  console.error(`  ⚠️  Failed to update trade ${trade.id}:`, updateError.message);
                } else {
                  updatedCount++;
                }
              }
            }
          }
        }
      }

      console.log(`  ✓ Found ${clusterCount} clusters, updated ${updatedCount} trades`);

    } catch (error) {
      console.error('  ❌ Error detecting clusters:', error.message);
      if (error.stack) {
        console.error('  Stack:', error.stack);
      }
      // Don't throw - allow scraper to continue
    }
  }

  formatDate(dateString) {
    if (!dateString) return null;
    const cleanDate = dateString.split('T')[0].split('-').slice(0, 3).join('-');
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return cleanDate;
  }

  async storeTrades(trades) {
    if (trades.length === 0) return [];

    const records = trades.map(trade => ({
      filing_date: this.formatDate(trade.filingDate),
      trade_date: this.formatDate(trade.tradeDate),
      ticker: trade.ticker,
      company_name: trade.companyName,
      industry: null,
      insider_name: trade.insiderName,
      insider_title: trade.insiderTitle,
      transaction_type: trade.transactionType,
      price: trade.price,
      quantity: Math.round(trade.quantity),
      shares_owned_after: Math.round(trade.sharesOwnedAfter),
      delta_ownership: trade.deltaOwnership,
      transaction_value: trade.value,
      current_stock_price: null,
      price_change_7d: null,
      is_cluster_buy: false,
      cluster_count: 1,
      form_4_url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.companyCik}&type=4`
    }));

    const uniqueRecords = Array.from(
      new Map(
        records.map(r => [
          `${r.filing_date}|${r.trade_date}|${r.ticker}|${r.insider_name}|${r.transaction_type}|${r.transaction_value}`,
          r
        ])
      ).values()
    );

    const { data, error } = await supabaseAdmin
      .from('insider_trades')
      .upsert(uniqueRecords, {
        onConflict: 'filing_date,trade_date,ticker,insider_name,transaction_type,transaction_value',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error storing trades:', error);
      throw error;
    }

    console.log(`  ✓ Stored ${uniqueRecords.length} trades`);
    return data;
  }
}

export default InsiderTradeScraper;
