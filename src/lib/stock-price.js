import axios from 'axios';
import { inferIndustryFromName } from './industry-mapper.js';

/**
 * Stock price fetcher using Yahoo Finance API
 * Fetches current price and 7-day price change
 */
export class StockPriceClient {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.secBaseUrl = 'https://www.sec.gov';
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
   * Get company information from SEC's company tickers JSON
   * This is more reliable than Yahoo Finance and doesn't require authentication
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Company info including industry via SIC code
   */
  async getCompanyInfoFromSEC(ticker) {
    try {
      // SEC provides a JSON file with all company tickers
      const url = `${this.secBaseUrl}/files/company_tickers.json`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': process.env.SEC_USER_AGENT || 'CeoBuying contact@ceobuying.com',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const companies = Object.values(response.data);
      const company = companies.find(c => c.ticker?.toUpperCase() === ticker.toUpperCase());

      if (!company) {
        return null;
      }

      // Get SIC code description (industry)
      const industry = this.getSICDescription(company.sic_description);

      return {
        ticker: ticker,
        industry: industry,
        companyName: company.title,
        cik: String(company.cik_str).padStart(10, '0')
      };

    } catch (error) {
      // Silently fail and return null - don't log 401 errors
      return null;
    }
  }

  /**
   * Map SIC description to a cleaner industry name
   * @param {string} sicDescription - SEC SIC description
   * @returns {string} Clean industry name
   */
  getSICDescription(sicDescription) {
    if (!sicDescription) return null;

    // Clean up common SIC descriptions to match OpenInsider's format
    const industryMap = {
      'RETAIL': 'Retail',
      'BANK': 'Banks',
      'INSURANCE': 'Insurance',
      'PHARMACEUTICAL': 'Pharmaceutical Preparations',
      'COMPUTER': 'Computer Programming, Data Processing, Etc.',
      'SOFTWARE': 'Prepackaged Software',
      'SEMICOND': 'Semiconductors',
      'MEDICAL': 'Medical Instruments',
      'REAL ESTATE': 'Real Estate Investment Trusts',
      'TELECOM': 'Telecommunications',
      'OIL': 'Crude Petroleum & Natural Gas',
      'GOLD': 'Gold And Silver Ores',
      'AIRCRAFT': 'Aircraft',
      'AUTO': 'Motor Vehicles',
      'DRUG': 'Pharmaceutical Preparations',
      'BIOTECH': 'Biological Products',
      'INTERNET': 'Services-Computer Programming, Data Processing, Etc.'
    };

    // Check for keywords in SIC description
    const upperDesc = sicDescription.toUpperCase();
    for (const [keyword, industry] of Object.entries(industryMap)) {
      if (upperDesc.includes(keyword)) {
        return industry;
      }
    }

    // Return the original description if no mapping found
    return sicDescription;
  }

  /**
   * Get company information including industry/sector
   * Now uses SEC data as primary source with Yahoo Finance as fallback
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Company info including industry
   */
  async getCompanyInfo(ticker) {
    // Try SEC first (more reliable and free)
    const secInfo = await this.getCompanyInfoFromSEC(ticker);
    if (secInfo) {
      return secInfo;
    }

    // Fallback to Yahoo Finance (may fail with 401)
    try {
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=assetProfile`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const profile = response.data?.quoteSummary?.result?.[0]?.assetProfile;
      if (!profile) {
        return null;
      }

      return {
        ticker,
        industry: profile.industry || null,
        sector: profile.sector || null,
        website: profile.website || null,
        country: profile.country || null
      };

    } catch (error) {
      // Don't log 401 errors - Yahoo Finance may be blocking
      if (error.response?.status !== 401) {
        console.error(`Error fetching company info for ${ticker}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Batch fetch company info for multiple tickers
   * Uses SEC data which is cached and more reliable
   * @param {Array<string>} tickers - Array of ticker symbols
   * @param {Object} tickerToCompany - Map of ticker to company name for fallback
   * @returns {Promise<Object>} Map of ticker to company info
   */
  async getBatchCompanyInfo(tickers, tickerToCompany = {}) {
    const results = {};

    // Fetch all company data from SEC once (cached)
    let allCompanies = null;
    try {
      console.log('  🔍 DEBUG: Fetching SEC company data...');
      
      // Use the correct SEC endpoint that works
      const secUrl = `${this.secBaseUrl}/files/company_tickers.json`;
      console.log(`     URL: ${secUrl}`);
      
      const response = await axios.get(secUrl, {
        headers: {
          'User-Agent': process.env.SEC_USER_AGENT || 'CeoBuying contact@ceobuying.com',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Host': 'www.sec.gov'
        },
        timeout: 30000
      });
      
      // The response.data is an object where keys are indices ("0", "1", etc.)
      // Each value is a company object with: cik_str, ticker, title
      allCompanies = Object.values(response.data);
      console.log(`  ✓ Loaded ${allCompanies.length} companies from SEC database`);
      
      // Debug: Show sample company structure
      if (allCompanies.length > 0) {
        const sample = allCompanies[0];
        console.log(`  🔍 DEBUG: Sample company structure:`, JSON.stringify(sample, null, 2));
        
        // Show a few recognizable companies
        const google = allCompanies.find(c => c.ticker === 'GOOGL');
        const apple = allCompanies.find(c => c.ticker === 'AAPL');
        if (google) console.log(`  🔍 DEBUG: Found GOOGL:`, JSON.stringify(google, null, 2));
        if (apple) console.log(`  🔍 DEBUG: Found AAPL:`, JSON.stringify(apple, null, 2));
      }
    } catch (error) {
      console.error(`  ✗ Error loading SEC company data: ${error.message}`);
      if (error.response) {
        console.error(`     Status: ${error.response.status}`);
        console.error(`     URL: ${this.secBaseUrl}/files/company_tickers.json`);
      }
      // Continue without SEC data - will use fallback
    }

    // Process each ticker
    for (const ticker of tickers) {
      console.log(`  🔍 DEBUG: Processing ticker: ${ticker}`);
      
      if (allCompanies) {
        // Find company in SEC data
        const company = allCompanies.find(c => c.ticker?.toUpperCase() === ticker.toUpperCase());
        
        if (company) {
          console.log(`    ✓ Found ${ticker} in SEC data`);
          console.log(`      Company Name: "${company.title}"`);
          console.log(`      CIK: ${company.cik_str}`);
          
          // SEC's company_tickers.json doesn't include SIC descriptions
          // So we always infer industry from the company name
          const industry = inferIndustryFromName(company.title);
          console.log(`      Industry inferred from name: "${industry || 'NULL'}"`);
          
          results[ticker] = {
            ticker: ticker,
            industry: industry,
            companyName: company.title,
            cik: String(company.cik_str).padStart(10, '0')
          };
          continue;
        } else {
          console.log(`    ✗ ${ticker} not found in SEC data, trying fallback...`);
        }
      }

      // Fallback: try individual lookup or infer from company name
      const fallbackInfo = await this.getCompanyInfo(ticker);
      
      if (fallbackInfo) {
        results[ticker] = fallbackInfo;
        console.log(`    Fallback result: ✓ Found via API`);
      } else if (tickerToCompany[ticker]) {
        // Use name-based inference as last resort
        const inferredIndustry = inferIndustryFromName(tickerToCompany[ticker]);
        console.log(`    Fallback result: ${inferredIndustry ? '✓' : '✗'} Inferred: "${inferredIndustry || 'NULL'}"`);
        results[ticker] = {
          ticker: ticker,
          industry: inferredIndustry,
          companyName: tickerToCompany[ticker]
        };
      } else {
        results[ticker] = null;
        console.log(`    Fallback result: ✗ Not found`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');

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
