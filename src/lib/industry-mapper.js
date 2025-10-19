/**
 * Industry mapping utilities
 * Provides fallback industry classification when SEC data is unavailable
 */

/**
 * Well-known company to industry mapping
 * For companies where name-based inference might fail
 */
export const KNOWN_COMPANIES = {
  // Tech Giants
  'alphabet': 'Computer Programming, Data Processing, Etc.',
  'google': 'Computer Programming, Data Processing, Etc.',
  'microsoft': 'Prepackaged Software',
  'apple': 'Computer Programming, Data Processing, Etc.',
  'meta': 'Computer Programming, Data Processing, Etc.',
  'facebook': 'Computer Programming, Data Processing, Etc.',
  'amazon': 'Retail-Catalog & Mail-Order Houses',
  'netflix': 'Services-Motion Picture & Video Tape Production',
  'tesla': 'Motor Vehicles & Passenger Car Bodies',
  'nvidia': 'Semiconductors & Related Devices',
  'amd': 'Semiconductors & Related Devices',
  'intel': 'Semiconductors & Related Devices',
  'salesforce': 'Prepackaged Software',
  'oracle': 'Prepackaged Software',
  'adobe': 'Prepackaged Software',
  'ibm': 'Computer Programming, Data Processing, Etc.',
  'dell': 'Computer & Office Equipment',
  'hp': 'Computer & Office Equipment',
  'cisco': 'Computer Communications Equipment',
  'uber': 'Arrangement of Passenger Transportation',
  'lyft': 'Arrangement of Passenger Transportation',
  'airbnb': 'Hotels & Motels',
  'spotify': 'Services-Amusement & Recreation Services',
  'twitter': 'Computer Programming, Data Processing, Etc.',
  'snap': 'Computer Programming, Data Processing, Etc.',
  'pinterest': 'Computer Programming, Data Processing, Etc.',
  'linkedin': 'Computer Programming, Data Processing, Etc.',
  'zoom': 'Computer Programming, Data Processing, Etc.',
  'slack': 'Prepackaged Software',
  'stripe': 'Finance Services',
  'square': 'Finance Services',
  'paypal': 'Finance Services',
  'visa': 'Finance Services',
  'mastercard': 'Finance Services',
  'crowdstrike': 'Prepackaged Software',
  'palo alto': 'Prepackaged Software',
  'peloton': 'Sporting & Athletic Goods, Nec',
  'roku': 'Household Audio & Video Equipment',
  'robinhood': 'Security Brokers, Dealers & Flotation Companies',
  'coinbase': 'Security Brokers, Dealers & Flotation Companies',
  
  // Pharma & Healthcare
  'pfizer': 'Pharmaceutical Preparations',
  'moderna': 'Pharmaceutical Preparations',
  'johnson & johnson': 'Pharmaceutical Preparations',
  'merck': 'Pharmaceutical Preparations',
  'abbvie': 'Pharmaceutical Preparations',
  'bristol': 'Pharmaceutical Preparations',
  'eli lilly': 'Pharmaceutical Preparations',
  'novo nordisk': 'Pharmaceutical Preparations',
  'astrazeneca': 'Pharmaceutical Preparations',
  'gilead': 'Pharmaceutical Preparations',
  'regeneron': 'Pharmaceutical Preparations',
  'biogen': 'Pharmaceutical Preparations',
  
  // Finance
  'berkshire': 'Finance Services',
  'jpmorgan': 'State Commercial Banks',
  'bank of america': 'National Commercial Banks',
  'wells fargo': 'National Commercial Banks',
  'citigroup': 'National Commercial Banks',
  'goldman sachs': 'Security Brokers, Dealers & Flotation Companies',
  'morgan stanley': 'Security Brokers, Dealers & Flotation Companies',
  'blackrock': 'Investment Advice',
  'vanguard': 'Investment Advice',
  'fidelity': 'Investment Advice',
  'charles schwab': 'Security Brokers, Dealers & Flotation Companies',
  
  // Retail
  'walmart': 'Retail-Variety Stores',
  'target': 'Retail-Variety Stores',
  'costco': 'Retail-Variety Stores',
  'home depot': 'Retail-Lumber & Other Building Materials Dealers',
  'lowes': 'Retail-Lumber & Other Building Materials Dealers',
  'nike': 'Rubber & Plastics Footwear',
  'adidas': 'Rubber & Plastics Footwear',
  
  // Energy
  'exxon': 'Petroleum Refining',
  'chevron': 'Petroleum Refining',
  'shell': 'Petroleum Refining',
  'bp': 'Petroleum Refining',
  
  // Automotive
  'ford': 'Motor Vehicles & Passenger Car Bodies',
  'gm': 'Motor Vehicles & Passenger Car Bodies',
  'general motors': 'Motor Vehicles & Passenger Car Bodies',
  'toyota': 'Motor Vehicles & Passenger Car Bodies',
  'honda': 'Motor Vehicles & Passenger Car Bodies',
  'rivian': 'Motor Vehicles & Passenger Car Bodies',
  'lucid': 'Motor Vehicles & Passenger Car Bodies'
};

export const INDUSTRY_KEYWORDS = {
  // Tech & Software - Enhanced
  'software': 'Prepackaged Software',
  'computer': 'Computer Programming, Data Processing, Etc.',
  'technology': 'Computer Programming, Data Processing, Etc.',
  'technologies': 'Computer Programming, Data Processing, Etc.',
  'tech': 'Computer Programming, Data Processing, Etc.',
  'cloud': 'Computer Programming, Data Processing, Etc.',
  'data': 'Computer Programming, Data Processing, Etc.',
  'cyber': 'Prepackaged Software',
  'security': 'Prepackaged Software',
  'saas': 'Prepackaged Software',
  'platform': 'Computer Programming, Data Processing, Etc.',
  'platforms': 'Computer Programming, Data Processing, Etc.',
  'digital': 'Computer Programming, Data Processing, Etc.',
  'internet': 'Computer Programming, Data Processing, Etc.',
  'online': 'Computer Programming, Data Processing, Etc.',
  'interactive': 'Computer Programming, Data Processing, Etc.',
  'systems': 'Computer Programming, Data Processing, Etc.',
  'solutions': 'Computer Programming, Data Processing, Etc.',
  'networks': 'Computer Communications Equipment',
  
  // Finance - Enhanced
  'bank': 'State Commercial Banks',
  'banc': 'State Commercial Banks',
  'banking': 'State Commercial Banks',
  'bancorp': 'State Commercial Banks',
  'bancgroup': 'State Commercial Banks',
  'financial': 'Finance Services',
  'capital': 'Finance Services',
  'investment': 'Investment Advice',
  'investments': 'Investment Advice',
  'insurance': 'Fire, Marine & Casualty Insurance',
  'credit': 'Finance Services',
  'fund': 'Investment Advice',
  'funds': 'Investment Advice',
  'asset': 'Investment Advice',
  'assets': 'Investment Advice',
  'trust': 'Real Estate Investment Trusts',
  'holding': 'Finance Services',
  'holdings': 'Finance Services',
  
  // Healthcare & Pharma - Enhanced
  'pharma': 'Pharmaceutical Preparations',
  'pharmaceutical': 'Pharmaceutical Preparations',
  'bio': 'Biological Products (No Diagnostic Substances)',
  'biopharma': 'Pharmaceutical Preparations',
  'biotech': 'Biological Products (No Diagnostic Substances)',
  'medical': 'Surgical & Medical Instruments & Apparatus',
  'health': 'Services-Medical Laboratories',
  'healthcare': 'Services-Medical Laboratories',
  'drug': 'Pharmaceutical Preparations',
  'drugs': 'Pharmaceutical Preparations',
  'therapeutics': 'Pharmaceutical Preparations',
  'medicine': 'Pharmaceutical Preparations',
  'clinical': 'Pharmaceutical Preparations',
  
  // Semiconductors & Electronics - Enhanced
  'semiconductor': 'Semiconductors & Related Devices',
  'semiconductors': 'Semiconductors & Related Devices',
  'chip': 'Semiconductors & Related Devices',
  'chips': 'Semiconductors & Related Devices',
  'electronics': 'Electronic Components, Nec',
  'microchip': 'Semiconductors & Related Devices',
  'processor': 'Semiconductors & Related Devices',
  
  // Real Estate
  'reit': 'Real Estate Investment Trusts',
  'real estate': 'Real Estate Investment Trusts',
  'realty': 'Real Estate Investment Trusts',
  'property': 'Real Estate Investment Trusts',
  'properties': 'Real Estate Investment Trusts',
  
  // Energy
  'energy': 'Crude Petroleum & Natural Gas',
  'oil': 'Crude Petroleum & Natural Gas',
  'petroleum': 'Petroleum Refining',
  'gas': 'Natural Gas Transmission',
  'solar': 'Electric Services',
  'power': 'Electric Services',
  'electric': 'Electric Services',
  'utilities': 'Electric Services',
  
  // Retail - Enhanced
  'retail': 'Retail-Variety Stores',
  'store': 'Retail-Variety Stores',
  'stores': 'Retail-Variety Stores',
  'commerce': 'Retail-Catalog & Mail-Order Houses',
  'ecommerce': 'Retail-Catalog & Mail-Order Houses',
  'marketplace': 'Retail-Catalog & Mail-Order Houses',
  'shopping': 'Retail-Variety Stores',
  
  // Manufacturing
  'manufacturing': 'Miscellaneous Manufacturing Industries',
  'industrial': 'Miscellaneous Manufacturing Industries',
  'industries': 'Miscellaneous Manufacturing Industries',
  'factory': 'Miscellaneous Manufacturing Industries',
  
  // Telecommunications
  'telecom': 'Telephone Communications (No Radiotelephone)',
  'telecommunications': 'Telephone Communications (No Radiotelephone)',
  'wireless': 'Radiotelephone Communications',
  'communications': 'Communications Services, Nec',
  'mobile': 'Radiotelephone Communications',
  
  // Entertainment & Media
  'entertainment': 'Services-Motion Picture & Video Tape Production',
  'media': 'Services-Motion Picture & Video Tape Production',
  'gaming': 'Services-Amusement & Recreation Services',
  'games': 'Services-Amusement & Recreation Services',
  'streaming': 'Services-Motion Picture & Video Tape Production',
  'video': 'Services-Motion Picture & Video Tape Production',
  'music': 'Services-Amusement & Recreation Services',
  
  // Transportation
  'airline': 'Air Transportation, Scheduled',
  'airlines': 'Air Transportation, Scheduled',
  'transportation': 'Trucking (No Local)',
  'transport': 'Trucking (No Local)',
  'logistics': 'Trucking (No Local)',
  'delivery': 'Trucking (No Local)',
  
  // Automotive
  'auto': 'Motor Vehicles & Passenger Car Bodies',
  'automotive': 'Motor Vehicles & Passenger Car Bodies',
  'motor': 'Motor Vehicles & Passenger Car Bodies',
  'motors': 'Motor Vehicles & Passenger Car Bodies',
  'vehicle': 'Motor Vehicles & Passenger Car Bodies',
  'vehicles': 'Motor Vehicles & Passenger Car Bodies',
  'car': 'Motor Vehicles & Passenger Car Bodies',
  'cars': 'Motor Vehicles & Passenger Car Bodies',
  
  // Food & Beverage
  'food': 'Food & Kindred Products',
  'foods': 'Food & Kindred Products',
  'beverage': 'Beverages',
  'beverages': 'Beverages',
  'restaurant': 'Eating Places',
  'restaurants': 'Eating Places',
  'cafe': 'Eating Places',
  'coffee': 'Eating Places',
  
  // Fitness & Sports
  'fitness': 'Sporting & Athletic Goods, Nec',
  'sport': 'Sporting & Athletic Goods, Nec',
  'sports': 'Sporting & Athletic Goods, Nec',
  'athletic': 'Sporting & Athletic Goods, Nec',
  'gym': 'Sporting & Athletic Goods, Nec',
  'exercise': 'Sporting & Athletic Goods, Nec'
};

/**
 * Infer industry from company name using keyword matching
 * Enhanced with better matching logic and company-specific mappings
 * @param {string} companyName - Company name
 * @returns {string|null} Industry name or null
 */
export function inferIndustryFromName(companyName) {
  if (!companyName) return null;
  
  const lowerName = companyName.toLowerCase();
  
  // Remove common suffixes to improve matching
  const cleanName = lowerName
    .replace(/\s+(inc\.?|corp\.?|corporation|company|co\.?|ltd\.?|llc|plc)$/i, '')
    .trim();
  
  // First, check known companies (highest priority)
  for (const [company, industry] of Object.entries(KNOWN_COMPANIES)) {
    if (cleanName.includes(company)) {
      return industry;
    }
  }
  
  // Then check keywords (with word boundary awareness)
  for (const [keyword, industry] of Object.entries(INDUSTRY_KEYWORDS)) {
    // Match whole words or parts of compound words
    const regex = new RegExp(`\\b${keyword}\\b|${keyword}`, 'i');
    if (regex.test(cleanName)) {
      return industry;
    }
  }
  
  return null;
}

/**
 * Common SIC code to industry mapping
 */
export const SIC_TO_INDUSTRY = {
  // Technology
  '7370': 'Computer Programming, Data Processing, Etc.',
  '7371': 'Computer Programming Services',
  '7372': 'Prepackaged Software',
  '7373': 'Computer Integrated Systems Design',
  '3570': 'Computer & Office Equipment',
  '3571': 'Electronic Computers',
  '3572': 'Computer Storage Devices',
  
  // Finance
  '6020': 'Commercial Banks, Nec',
  '6021': 'National Commercial Banks',
  '6022': 'State Commercial Banks',
  '6029': 'Commercial Banks, Nec',
  '6200': 'Security & Commodity Brokers, Dealers, Exchanges & Services',
  '6211': 'Security Brokers, Dealers & Flotation Companies',
  '6282': 'Investment Advice',
  
  // Pharmaceuticals
  '2834': 'Pharmaceutical Preparations',
  '2835': 'In Vitro & In Vivo Diagnostic Substances',
  '2836': 'Biological Products (No Diagnostic Substances)',
  '3841': 'Surgical & Medical Instruments & Apparatus',
  
  // Semiconductors
  '3674': 'Semiconductors & Related Devices',
  '3670': 'Electronic Components & Accessories',
  
  // Real Estate
  '6798': 'Real Estate Investment Trusts',
  
  // Energy
  '1311': 'Crude Petroleum & Natural Gas',
  '2911': 'Petroleum Refining',
  '4911': 'Electric Services',
  
  // Retail
  '5331': 'Retail-Variety Stores',
  '5961': 'Retail-Catalog & Mail-Order Houses',
  
  // Automotive
  '3711': 'Motor Vehicles & Passenger Car Bodies',
  '3714': 'Motor Vehicle Parts & Accessories'
};

/**
 * Get industry from SIC code
 * @param {string|number} sicCode - SIC code
 * @returns {string|null} Industry name or null
 */
export function getIndustryFromSIC(sicCode) {
  if (!sicCode) return null;
  const code = String(sicCode);
  return SIC_TO_INDUSTRY[code] || null;
}
