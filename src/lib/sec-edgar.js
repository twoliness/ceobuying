import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

const SEC_BASE_URL = 'https://www.sec.gov';
const EDGAR_SEARCH_URL = `${SEC_BASE_URL}/cgi-bin/browse-edgar`;

/**
 * SEC EDGAR API client for fetching Form 4 filings
 * Form 4 = Statement of Changes in Beneficial Ownership
 */
export class SECEdgarClient {
  constructor() {
    this.userAgent = process.env.SEC_USER_AGENT || 'CeoBuying contact@ceobuying.com';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept-Encoding': 'gzip, deflate',
      'Host': 'www.sec.gov',
      'Accept': 'application/atom+xml, application/xml, text/xml, */*'
    };
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // 100ms between requests (10 req/sec max as per SEC guidelines)
  }

  /**
   * Rate limiting helper - ensures we don't exceed SEC's rate limits
   */
  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch recent Form 4 filings from SEC EDGAR
   * @param {number} count - Number of filings to fetch
   * @returns {Promise<Array>} Array of Form 4 filing URLs
   */
  async getRecentForm4Filings(count = 100) {
    try {
      await this.rateLimitDelay();
      
      // Use the RSS/Atom feed which is more reliable and doesn't have date restrictions
      const atomUrl = `${SEC_BASE_URL}/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&start=0&count=${count}&output=atom`;

      console.log('Fetching recent Form 4 filings from SEC RSS feed...');
      console.log('Using User-Agent:', this.userAgent);

      const response = await axios.get(atomUrl, {
        headers: this.headers,
        timeout: 30000
      });

      // Parse the Atom XML feed
      const parsed = await parseXml(response.data);
      const entries = parsed?.feed?.entry || [];

      console.log(`Found ${entries.length} Form 4 entries in RSS feed`);

      if (entries.length === 0) {
        throw new Error('No Form 4 filings found in RSS feed');
      }

      const filings = [];

      for (const entry of entries) {
        try {
          const title = entry.title?.[0] || '';
          const link = entry.link?.[0]?.$ ?.href || '';
          const updated = entry.updated?.[0] || '';
          const summary = entry.summary?.[0];

          // Get the summary text (could be in _ property or directly)
          const summaryText = typeof summary === 'object' ? summary._ || '' : summary || '';

          // Extract filing info from title: "4 - CompanyName (CIK)"
          const titleMatch = title.match(/^4\s+-\s+(.+?)\s+\((\d+)\)/);
          const companyName = titleMatch ? titleMatch[1].trim() : '';
          const cik = titleMatch ? titleMatch[2] : '';

          // Extract accession number from link
          const accessionMatch = link.match(/accession[_-]number=(\d{10}-\d{2}-\d{6})/i) ||
                                link.match(/(\d{10}-\d{2}-\d{6})/);
          const accessionNumber = accessionMatch ? accessionMatch[1] : '';

          // Get filing date
          const filingDate = updated.split('T')[0];

          if (accessionNumber && cik) {
            filings.push({
              companyName,
              cik,
              accessionNumber,
              filingDate,
              title,
              url: link
            });
          }
        } catch (entryError) {
          console.error('Error parsing entry:', entryError.message);
          continue;
        }
      }

      console.log(`✓ Parsed ${filings.length} valid Form 4 filings`);

      return filings.slice(0, count);

    } catch (error) {
      console.error('Error fetching Form 4 filings:', error.message);
      throw error;
    }
  }

  /**
   * Discover XML files in a filing by fetching the index page
   * @param {string} accessionNumber - SEC accession number
   * @param {string} cik - Company CIK
   * @returns {Promise<Array>} Array of XML file URLs
   */
  async discoverXmlFiles(accessionNumber, cik) {
    try {
      await this.rateLimitDelay();
      const accessionClean = accessionNumber.replace(/-/g, '');
      
      // Try the archive directory directly with index.json
      const archiveUrl = `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/index.json`;
      
      try {
        const jsonResponse = await axios.get(archiveUrl, {
          headers: this.headers,
          timeout: 30000
        });
        
        // Parse the JSON index
        const indexData = jsonResponse.data;
        const xmlFiles = [];
        
        if (indexData.directory?.item) {
          for (const item of indexData.directory.item) {
            if (item.name && item.name.endsWith('.xml')) {
              xmlFiles.push(`${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/${item.name}`);
            }
          }
        }
        
        if (xmlFiles.length > 0) {
          console.log(`    Found ${xmlFiles.length} XML files in index.json`);
          return xmlFiles;
        }
      } catch (jsonError) {
        // index.json not available, try HTML parsing
      }
      
      // Fallback: Fetch the filing index page
      const indexUrl = `${SEC_BASE_URL}/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
      
      const response = await axios.get(indexUrl, {
        headers: this.headers,
        timeout: 30000
      });

      // Parse HTML to find .xml files
      const html = response.data;
      const xmlFiles = [];
      
      // Look for links to .xml files
      const xmlLinkRegex = /href="([^"]*\.xml)"/gi;
      let match;
      while ((match = xmlLinkRegex.exec(html)) !== null) {
        const xmlPath = match[1];
        // Convert relative path to absolute URL
        let xmlUrl;
        if (xmlPath.startsWith('http')) {
          xmlUrl = xmlPath;
        } else if (xmlPath.startsWith('/')) {
          xmlUrl = `${SEC_BASE_URL}${xmlPath}`;
        } else {
          xmlUrl = `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/${xmlPath}`;
        }
        xmlFiles.push(xmlUrl);
      }

      if (xmlFiles.length > 0) {
        console.log(`    Found ${xmlFiles.length} XML files in HTML index`);
      }
      return [...new Set(xmlFiles)]; // Remove duplicates
    } catch (error) {
      console.log(`    Could not discover XML files: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse a Form 4 XML document
   * @param {string} accessionNumber - SEC accession number
   * @param {string} cik - Company CIK
   * @returns {Promise<Object>} Parsed Form 4 data
   */
  async parseForm4(accessionNumber, cik) {
    const accessionClean = accessionNumber.replace(/-/g, '');

    // First, try to discover XML files from the index page
    const discoveredFiles = await this.discoverXmlFiles(accessionNumber, cik);
    
    // Combine discovered files with common patterns
    const patterns = [
      ...discoveredFiles,
      `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/wk-form4_${accessionNumber}.xml`,
      `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/${accessionNumber}.xml`,
      `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/primary_doc.xml`,
      `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/doc4.xml`,
      `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/form4.xml`
    ];

    // Remove duplicates
    const uniquePatterns = [...new Set(patterns)];

    for (const xmlUrl of uniquePatterns) {
      try {
        await this.rateLimitDelay();
        const response = await axios.get(xmlUrl, {
          headers: this.headers,
          timeout: 30000,
          responseType: 'text'
        });

        console.log(`    ✓ Found XML at: ${xmlUrl.split('/').pop()}`);

        // Parse the XML
        const parsed = await parseXml(response.data, {
          explicitArray: false,
          mergeAttrs: true
        });

        const result = this.extractForm4Data(parsed);
        if (result) {
          console.log(`    → Extracted: ${result.trades?.length || 0} trades from ${result.companyName} (${result.ticker})`);
          if (result.trades?.length === 0) {
            // Debug: Show structure to understand why no trades
            console.log(`    DEBUG: Has nonDerivativeTable? ${!!parsed.ownershipDocument?.nonDerivativeTable}`);
            console.log(`    DEBUG: Has derivativeTable? ${!!parsed.ownershipDocument?.derivativeTable}`);
          }
          return result;
        }
      } catch (error) {
        // Try next pattern
        continue;
      }
    }

    console.log(`    ✗ Could not find/parse XML for ${accessionNumber}`);

    // If all patterns fail, return null
    return null;
  }

  /**
   * Alternative: Fetch Form 4 data from SEC's company filings API
   * This is more reliable than RSS feed parsing
   */
  async getForm4FilingsByDate(date = new Date()) {
    try {
      await this.rateLimitDelay();
      
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

      // SEC provides daily index files
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const indexUrl = `${SEC_BASE_URL}/Archives/edgar/daily-index/${year}/QTR${quarter}/form.${dateStr}.idx`;

      const response = await axios.get(indexUrl, {
        headers: this.headers,
        timeout: 30000
      });

      // Parse the index file (plain text format)
      const lines = response.data.split('\n');
      const form4Lines = lines.filter(line => line.includes('4 '));

      return form4Lines.map(line => {
        const parts = line.split('|');
        if (parts.length >= 5) {
          return {
            companyName: parts[0]?.trim(),
            formType: parts[1]?.trim(),
            cik: parts[2]?.trim(),
            filingDate: parts[3]?.trim(),
            accessionNumber: parts[4]?.trim()
          };
        }
        return null;
      }).filter(Boolean);

    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`No Form 4 index file for date: ${date.toISOString().split('T')[0]}`);
        return [];
      }
      console.error('Error fetching Form 4 filings by date:', error.message);
      throw error;
    }
  }

  /**
   * Get Form 4 XML data directly
   * @param {string} accessionNumber
   * @param {string} cik
   */
  async getForm4Xml(accessionNumber, cik) {
    try {
      await this.rateLimitDelay();
      
      // Clean up accession number (remove dashes)
      const accessionClean = accessionNumber.replace(/-/g, '');

      // Construct the direct XML URL
      const xmlUrl = `${SEC_BASE_URL}/Archives/edgar/data/${cik}/${accessionClean}/form4.xml`;

      const response = await axios.get(xmlUrl, {
        headers: this.headers,
        timeout: 30000,
        responseType: 'text'
      });

      // Parse the XML
      const parsed = await parseXml(response.data, {
        explicitArray: false,
        mergeAttrs: true
      });

      return this.extractForm4Data(parsed);

    } catch (error) {
      console.error(`Error fetching Form 4 XML for ${accessionNumber}:`, error.message);
      return null;
    }
  }

  /**
   * Extract structured data from parsed Form 4 XML
   */
  extractForm4Data(parsed) {
    try {
      const doc = parsed.ownershipDocument;

      if (!doc) {
        return null;
      }

      // Issuer (company) information
      const issuer = doc.issuer;
      const ticker = issuer?.issuerTradingSymbol || '';
      const companyName = issuer?.issuerName || '';
      const cik = issuer?.issuerCik || '';

      // Reporting owner (insider) information
      // Handle both single owner and array of owners
      const owners = Array.isArray(doc.reportingOwner) ? doc.reportingOwner : [doc.reportingOwner];
      const owner = owners[0]; // Take first owner if multiple
      
      const insiderName = owner?.reportingOwnerId?.rptOwnerName || 
                         owner?.reportingOwnerId?.name ||
                         owner?.name ||
                         'Unknown';
      
      const insiderTitle = owner?.reportingOwnerRelationship?.officerTitle ||
                          owner?.reportingOwnerRelationship?.directorTitle ||
                          (owner?.reportingOwnerRelationship?.isDirector === 'true' || 
                           owner?.reportingOwnerRelationship?.isDirector === true ? 'Director' : '') ||
                          (owner?.reportingOwnerRelationship?.isOfficer === 'true' || 
                           owner?.reportingOwnerRelationship?.isOfficer === true ? 'Officer' : '') ||
                          (owner?.reportingOwnerRelationship?.isTenPercentOwner === 'true' || 
                           owner?.reportingOwnerRelationship?.isTenPercentOwner === true ? '10% Owner' : '') ||
                          'Other';

      // Non-derivative transactions (actual stock purchases/sales)
      const transactions = doc.nonDerivativeTable?.nonDerivativeTransaction;

      if (!transactions) {
        return {
          filingDate: doc.periodOfReport || '',
          ticker,
          companyName,
          cik,
          insiderName,
          insiderTitle,
          trades: []
        };
      }

      const transactionArray = Array.isArray(transactions) ? transactions : [transactions].filter(Boolean);

      const trades = transactionArray.map(tx => {
        // Handle both nested and flat structures
        const securityTitle = tx.securityTitle?.value || tx.securityTitle || '';
        const transactionDate = tx.transactionDate?.value || tx.transactionDate || '';
        const transactionCode = tx.transactionCoding?.transactionCode || tx.transactionCode || '';

        const sharesValue = tx.transactionAmounts?.transactionShares?.value ||
                           tx.transactionAmounts?.transactionShares ||
                           tx.transactionShares?.value ||
                           tx.transactionShares || 0;
        const shares = parseFloat(sharesValue);

        const priceValue = tx.transactionAmounts?.transactionPricePerShare?.value ||
                          tx.transactionAmounts?.transactionPricePerShare ||
                          tx.transactionPricePerShare?.value ||
                          tx.transactionPricePerShare || 0;
        const pricePerShare = parseFloat(priceValue);

        const acquiredDisposed = tx.transactionAmounts?.transactionAcquiredDisposedCode?.value ||
                                tx.transactionAmounts?.transactionAcquiredDisposedCode ||
                                tx.transactionAcquiredDisposedCode?.value ||
                                tx.transactionAcquiredDisposedCode || '';

        const sharesAfterValue = tx.postTransactionAmounts?.sharesOwnedFollowingTransaction?.value ||
                                tx.postTransactionAmounts?.sharesOwnedFollowingTransaction ||
                                tx.sharesOwnedFollowingTransaction?.value ||
                                tx.sharesOwnedFollowingTransaction || 0;
        const sharesOwnedAfter = parseFloat(sharesAfterValue);

        // Calculate transaction value
        const value = shares * pricePerShare;

        // Determine if purchase or sale
        const isPurchase = acquiredDisposed === 'A' || transactionCode === 'P';

        return {
          ticker,
          companyName,
          cik,
          insiderName,
          insiderTitle,
          securityTitle,
          tradeDate: transactionDate,
          transactionType: isPurchase ? 'P' : 'S',
          transactionCode,
          quantity: Math.abs(shares),
          price: pricePerShare,
          value,
          sharesOwnedAfter,
          deltaOwnership: sharesOwnedAfter > 0 ? (shares / sharesOwnedAfter) * 100 : 0
        };
      }).filter(t => t.value > 0 && !isNaN(t.value));

      return {
        filingDate: doc.periodOfReport || '',
        ticker,
        companyName,
        cik,
        insiderName,
        insiderTitle,
        trades: trades // Already filtered in map above
      };

    } catch (error) {
      console.error('Error extracting Form 4 data:', error);
      return null;
    }
  }

  /**
   * Simple HTML parsing fallback (when XML is not available)
   */
  parseForm4Html(html, accessionNumber) {
    // This is a simplified version - production would need more robust parsing
    return {
      accessionNumber,
      note: 'HTML parsing not fully implemented - use XML endpoint'
    };
  }
}

export default SECEdgarClient;
