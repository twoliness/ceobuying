import YahooFinance from 'yahoo-finance2';

// Create a singleton instance of the Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey']
});

/**
 * Yahoo Finance API Client
 * Uses yahoo-finance2 - the most reliable free Yahoo Finance library for Node.js
 */
export class YahooFinanceClient {
  constructor() {
    this.yf = yahooFinance;
  }

  /**
   * Get historical stock prices
   * @param {string} ticker - Stock ticker symbol
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of price data
   */
  async getHistoricalPrices(ticker, options = {}) {
    try {
      const {
        period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        period2 = new Date(), // now
        interval = '1d' // daily
      } = options;

      const result = await this.yf.chart(ticker, {
        period1,
        period2,
        interval
      });

      // chart() returns data in quotes array
      const quotes = result.quotes || [];

      return quotes.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjClose: item.adjclose || item.close // adjclose is lowercase in chart()
      }));
    } catch (error) {
      console.error(`Error fetching historical prices for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current quote for a ticker
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(ticker) {
    try {
      const quote = await this.yf.quote(ticker);

      return {
        ticker: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        companyName: quote.shortName || quote.longName,
        exchange: quote.exchange,
        currency: quote.currency
      };
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get company information
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Company data
   */
  async getCompanyInfo(ticker) {
    try {
      const result = await this.yf.quoteSummary(ticker, {
        modules: ['assetProfile', 'summaryDetail', 'price']
      });

      const profile = result.assetProfile || {};
      const price = result.price || {};

      return {
        ticker: ticker,
        companyName: price.shortName || price.longName,
        sector: profile.sector,
        industry: profile.industry,
        exchange: price.exchange,
        currency: price.currency,
        marketCap: price.marketCap,
        description: profile.longBusinessSummary
      };
    } catch (error) {
      console.error(`Error fetching company info for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get chart data (price history + metadata)
   * Optimized for chart rendering
   * @param {string} ticker - Stock ticker symbol
   * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
   * @returns {Promise<Object>} Chart data
   */
  async getChartData(ticker, range = '1y') {
    try {
      const rangeToPeriod = {
        '1d': { days: 1 },
        '5d': { days: 5 },
        '1mo': { days: 30 },
        '3mo': { days: 90 },
        '6mo': { days: 180 },
        '1y': { days: 365 },
        '2y': { days: 730 },
        '5y': { days: 1825 }
      };

      const period = rangeToPeriod[range] || rangeToPeriod['1y'];
      const period1 = new Date();
      period1.setDate(period1.getDate() - period.days);
      const period2 = new Date();

      const [historical, quote] = await Promise.all([
        this.getHistoricalPrices(ticker, { period1, period2 }),
        this.getQuote(ticker).catch(() => null)
      ]);

      return {
        ticker,
        range,
        prices: historical,
        currentPrice: quote?.price,
        change: quote?.change,
        changePercent: quote?.changePercent,
        companyName: quote?.companyName
      };
    } catch (error) {
      console.error(`Error fetching chart data for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch fetch quotes for multiple tickers
   * @param {Array<string>} tickers - Array of ticker symbols
   * @returns {Promise<Object>} Map of ticker to quote data
   */
  async batchGetQuotes(tickers) {
    try {
      const quotes = await this.yf.quote(tickers);

      const result = {};
      for (const quote of quotes) {
        result[quote.symbol] = {
          ticker: quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume
        };
      }

      return result;
    } catch (error) {
      console.error('Error batch fetching quotes:', error.message);
      throw error;
    }
  }
}

export default YahooFinanceClient;
