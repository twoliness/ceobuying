/**
 * SEC Form 4 Transaction Code Mappings
 * Based on official SEC Form 4 transaction codes
 */

export const TRANSACTION_CODES = {
  // Acquisitions
  'P': { label: 'Purchase', description: 'Open market or private purchase', type: 'buy' },
  'A': { label: 'Grant/Award', description: 'Grant, award, or other acquisition', type: 'buy' },
  'L': { label: 'Small Acquisition', description: 'Small acquisition (direct or indirect)', type: 'buy' },
  'W': { label: 'Will/Descent', description: 'Acquisition by will or laws of descent', type: 'buy' },
  'M': { label: 'Option Exercise', description: 'Exercise or conversion of derivative', type: 'buy' },
  'X': { label: 'ITM Exercise', description: 'Exercise of in-the-money or at-the-money option', type: 'buy' },
  'I': { label: 'Discretionary', description: 'Discretionary transaction', type: 'buy' },
  
  // Dispositions
  'S': { label: 'Sale', description: 'Open market sale', type: 'sell' },
  'D': { label: 'Return to Issuer', description: 'Sale back to issuer', type: 'sell' },
  'G': { label: 'Gift', description: 'Bona fide gift', type: 'sell' },
  'F': { label: 'Tax Payment', description: 'Payment of tax liability by withholding', type: 'sell' },
  'E': { label: 'Expiration', description: 'Expiration of derivative position', type: 'sell' },
  
  // Other
  'C': { label: 'Conversion', description: 'Conversion of derivative security', type: 'other' },
  'J': { label: 'Other', description: 'Other acquisition or disposition', type: 'other' },
  'K': { label: 'Equity Swap', description: 'Transaction in equity swap or similar', type: 'other' },
  'Z': { label: 'Trust Deposit', description: 'Deposit/withdrawal from voting trust', type: 'other' },
  'H': { label: 'Inheritance', description: 'Transaction through inheritance', type: 'other' },
  'U': { label: 'Tender', description: 'Tender of shares', type: 'other' },
  'O': { label: 'Option Grant', description: 'Option grant (derivative)', type: 'other' },
  'V': { label: 'Transaction', description: 'Transaction voluntarily reported', type: 'other' },
};

/**
 * Get formatted transaction type label for display
 * @param {string} code - Transaction code (P, S, A, etc.)
 * @returns {string} Formatted label for UI
 */
export function getTransactionLabel(code) {
  const transaction = TRANSACTION_CODES[code?.toUpperCase()];
  if (!transaction) {
    return `${code} - Unknown`;
  }
  return `${code} - ${transaction.label}`;
}

/**
 * Get transaction type category (buy, sell, other)
 * @param {string} code - Transaction code
 * @returns {string} Type category
 */
export function getTransactionType(code) {
  const transaction = TRANSACTION_CODES[code?.toUpperCase()];
  return transaction?.type || 'other';
}

/**
 * Get transaction description for tooltip
 * @param {string} code - Transaction code
 * @returns {string} Full description
 */
export function getTransactionDescription(code) {
  const transaction = TRANSACTION_CODES[code?.toUpperCase()];
  return transaction?.description || 'Unknown transaction type';
}

/**
 * Determine if a transaction code represents a purchase/acquisition
 * @param {string} code - Transaction code
 * @returns {boolean}
 */
export function isPurchase(code) {
  return getTransactionType(code) === 'buy';
}

/**
 * Determine if a transaction code represents a sale/disposition
 * @param {string} code - Transaction code
 * @returns {boolean}
 */
export function isSale(code) {
  return getTransactionType(code) === 'sell';
}

/**
 * Get CSS classes for transaction type badge
 * @param {string} code - Transaction code
 * @returns {string} Tailwind CSS classes
 */
export function getTransactionBadgeClasses(code) {
  const type = getTransactionType(code);
  
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded whitespace-nowrap';
  
  if (type === 'buy') {
    return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
  } else if (type === 'sell') {
    return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
  } else {
    return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
  }
}

export default {
  TRANSACTION_CODES,
  getTransactionLabel,
  getTransactionType,
  getTransactionDescription,
  isPurchase,
  isSale,
  getTransactionBadgeClasses
};
