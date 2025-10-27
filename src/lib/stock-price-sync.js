import { YahooFinanceClient } from './yahoo-finance.js';
import { supabaseAdmin } from './supabase.js';

/**
 * Stock Price Sync Service
 * Fetches data from Yahoo Finance and stores in database
 */
export class StockPriceSync {
  constructor() {
    this.yahooClient = new YahooFinanceClient();
  }

  /**
   * Sync historical prices for a ticker
   * @param {string} ticker - Stock ticker symbol
   * @param {number} days - Number of days of history to fetch (default: 365)
   * @returns {Promise<Object>} Sync results
   */
  async syncHistoricalPrices(ticker, days = 365) {
    try {
      console.log(`📊 Syncing ${days} days of price history for ${ticker}...`);

      const period1 = new Date();
      period1.setDate(period1.getDate() - days);
      const period2 = new Date();

      // Fetch from Yahoo Finance
      const prices = await this.yahooClient.getHistoricalPrices(ticker, {
        period1,
        period2
      });

      if (!prices || prices.length === 0) {
        console.log(`   ⚠️ No price data found for ${ticker}`);
        return { ticker, inserted: 0, updated: 0 };
      }

      // Prepare records for upsert
      const records = prices.map(p => ({
        ticker: ticker.toUpperCase(),
        date: p.date.toISOString().split('T')[0], // YYYY-MM-DD format
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        adj_close: p.adjClose,
        updated_at: new Date().toISOString()
      }));

      // Upsert to database (insert or update on conflict)
      const { data, error } = await supabaseAdmin
        .from('stock_prices')
        .upsert(records, {
          onConflict: 'ticker,date',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`   ❌ Error upserting prices for ${ticker}:`, error);
        throw error;
      }

      console.log(`   ✅ Synced ${records.length} price records for ${ticker}`);

      return {
        ticker,
        inserted: records.length,
        dateRange: {
          from: records[0]?.date,
          to: records[records.length - 1]?.date
        }
      };
    } catch (error) {
      console.error(`Error syncing prices for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync company metadata
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Metadata
   */
  async syncCompanyMetadata(ticker) {
    try {
      console.log(`📋 Syncing metadata for ${ticker}...`);

      const info = await this.yahooClient.getCompanyInfo(ticker);

      const record = {
        ticker: ticker.toUpperCase(),
        company_name: info.companyName,
        exchange: info.exchange,
        currency: info.currency,
        market_cap: info.marketCap,
        sector: info.sector,
        industry: info.industry,
        last_fetched: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('stock_metadata')
        .upsert(record, {
          onConflict: 'ticker',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`   ❌ Error upserting metadata for ${ticker}:`, error);
        throw error;
      }

      console.log(`   ✅ Synced metadata for ${ticker}`);

      return record;
    } catch (error) {
      console.error(`Error syncing metadata for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Full sync for a ticker (prices + metadata)
   * @param {string} ticker - Stock ticker symbol
   * @param {number} days - Number of days of history (default: 365)
   * @returns {Promise<Object>} Sync results
   */
  async fullSync(ticker, days = 365) {
    console.log(`\n🔄 Full sync for ${ticker}...`);

    const [priceResult, metadata] = await Promise.all([
      this.syncHistoricalPrices(ticker, days),
      this.syncCompanyMetadata(ticker).catch(err => {
        console.warn(`   ⚠️ Could not fetch metadata: ${err.message}`);
        return null;
      })
    ]);

    console.log(`✅ Full sync complete for ${ticker}\n`);

    return {
      ticker,
      prices: priceResult,
      metadata
    };
  }

  /**
   * Batch sync multiple tickers
   * @param {Array<string>} tickers - Array of ticker symbols
   * @param {number} days - Number of days of history (default: 365)
   * @returns {Promise<Array>} Array of sync results
   */
  async batchSync(tickers, days = 365) {
    console.log(`\n📦 Batch syncing ${tickers.length} tickers...`);

    const results = [];

    for (const ticker of tickers) {
      try {
        const result = await this.fullSync(ticker, days);
        results.push({ ...result, success: true });

        // Rate limiting: wait 500ms between tickers to avoid overwhelming Yahoo
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to sync ${ticker}:`, error.message);
        results.push({ ticker, success: false, error: error.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Batch sync complete: ${successful}/${tickers.length} successful\n`);

    return results;
  }

  /**
   * Sync prices for all tickers from insider_trades table
   * @param {number} days - Number of days of history (default: 365)
   * @returns {Promise<Array>} Sync results
   */
  async syncAllInsiderTradeTickers(days = 365) {
    console.log('\n🔍 Finding unique tickers from insider_trades...');

    // Get all unique tickers from insider trades
    const { data: trades, error } = await supabaseAdmin
      .from('insider_trades')
      .select('ticker')
      .not('ticker', 'is', null)
      .not('ticker', 'eq', 'NONE');

    if (error) {
      console.error('Error fetching tickers:', error);
      throw error;
    }

    const uniqueTickers = [...new Set(trades.map(t => t.ticker))];
    console.log(`   Found ${uniqueTickers.length} unique tickers`);

    return this.batchSync(uniqueTickers, days);
  }
}

export default StockPriceSync;
