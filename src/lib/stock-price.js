import axios from 'axios';

/**
 * Stock price fetcher using Yahoo Finance API
 * Fetches current price and 7-day price change
 */
export class StockPriceClient {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  }

  /**
   * Get current stock price and 7-day change
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Price data
   */
  async getStockPrice(ticker) {
    try {
      // Fetch 7 days of data
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60);

      const url = `${this.baseUrl}/${ticker}?period1=${sevenDaysAgo}&period2=${now}&interval=1d`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        return null;
      }

      const meta = result.meta;
      const quotes = result.indicators?.quote?.[0];

      const currentPrice = meta.regularMarketPrice;
      const closes = quotes?.close?.filter(c => c !== null) || [];

      // Calculate 7-day change
      let priceChange7d = 0;
      if (closes.length >= 2) {
        const oldPrice = closes[0];
        const newPrice = closes[closes.length - 1];
        priceChange7d = ((newPrice - oldPrice) / oldPrice) * 100;
      }

      return {
        ticker,
        currentPrice: currentPrice || null,
        priceChange7d: priceChange7d || 0,
        currency: meta.currency || 'USD',
        exchangeName: meta.exchangeName || '',
        marketState: meta.marketState || ''
      };

    } catch (error) {
      console.error(`Error fetching stock price for ${ticker}:`, error.message);
      return null;
    }
  }

  /**
   * Batch fetch stock prices for multiple tickers
   * @param {Array<string>} tickers - Array of ticker symbols
   * @returns {Promise<Object>} Map of ticker to price data
   */
  async getBatchStockPrices(tickers) {
    const results = {};

    // Fetch prices with delay to avoid rate limiting
    for (const ticker of tickers) {
      results[ticker] = await this.getStockPrice(ticker);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Get 52-week high/low for context
   * @param {string} ticker
   * @returns {Promise<Object>}
   */
  async get52WeekRange(ticker) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const oneYearAgo = now - (365 * 24 * 60 * 60);

      const url = `${this.baseUrl}/${ticker}?period1=${oneYearAgo}&period2=${now}&interval=1d`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        return null;
      }

      const quotes = result.indicators?.quote?.[0];
      const highs = quotes?.high?.filter(h => h !== null) || [];
      const lows = quotes?.low?.filter(l => l !== null) || [];

      return {
        ticker,
        high52Week: Math.max(...highs),
        low52Week: Math.min(...lows),
        currentPrice: result.meta.regularMarketPrice
      };

    } catch (error) {
      console.error(`Error fetching 52-week range for ${ticker}:`, error.message);
      return null;
    }
  }
}

export default StockPriceClient;
