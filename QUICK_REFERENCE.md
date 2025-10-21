# Quick Reference Guide

## Common Commands

### Run the Scraper (with new pagination support)
```bash
npm run scraper:month
```
- Now fetches up to 1000 Form 4 filings (10 pages of 100)
- Automatically paginates through SEC RSS feed
- Shows progress for each page

### Debug Why Clusters Don't Appear
```bash
npm run debug:clusters-ui
```
This will show you:
- All clusters in the database
- Which clusters are visible in the UI (last 30 days)
- Which clusters are outside the time window
- Potential missed clusters

### Other Useful Scripts
```bash
npm run check:clusters      # Check cluster detection
npm run debug:clusters      # Debug cluster detection logic
npm run fix:clusters        # Re-run cluster detection
npm run test:hero          # Test hero cards data
```

---

## Understanding the Fixes

### 1. SEC Pagination (✅ Fixed)

**Before:** Only 100 filings
```
Found 100 Form 4 entries in RSS feed
```

**After:** Up to 1000 filings
```
📄 Will fetch 10 page(s) to get up to 1000 filings
Found 100 Form 4 entries in first page
   Fetching page 2/10 (start=100)...
   ✓ Page 2: 100 filings (total: 200)
   ...
```

### 2. Transaction Code Labels (✅ Fixed)

**Before:** Only "P - Purchase" and "S - Sale"

**After:** All SEC Form 4 codes properly labeled:
- P - Purchase
- S - Sale
- A - Grant/Award
- M - Option Exercise
- G - Gift
- F - Tax Payment
- D - Return to Issuer
- ... and more!

### 3. Cluster Display (⚠️ Needs Investigation)

**Problem:** 17 clusters detected in logs, only 3-5 visible in UI

**Likely Causes:**
1. Many clusters have trades outside the 30-day window
2. Date filtering uses `filing_date` which may differ from `trade_date`
3. Some clusters span multiple weeks and oldest trades fall outside window

**How to Debug:**
```bash
npm run debug:clusters-ui
```

This will show you **exactly** which clusters are missing and why!

---

## What to Check in the UI

### Cluster Table
- Click the ▼ arrow to expand clusters
- Should see proper transaction labels (not just P/S)
- Insiders count badge should show correct number
- Check if all detected clusters appear

### Trade Tables (Buys/Sales)
- Transaction type badges should use full labels
- Colors: Green for acquisitions, Red for dispositions, Gray for other
- All transaction codes should be recognized

### Hero Cards
- Should show "BUY", "SELL", or "OTHER"
- Cluster badges should appear for multi-insider trades
- Transaction types should be properly categorized

---

## Files Modified

### Core Fixes
- `src/lib/sec-edgar.js` - Pagination support
- `src/lib/transaction-codes.js` - NEW: Transaction code mappings
- `src/components/TradesTable.js` - Uses proper transaction labels
- `src/components/TradeCard.js` - Uses proper transaction labels

### Debugging Tools
- `src/scripts/debug-clusters.js` - NEW: UI cluster debugger
- `package.json` - Added `debug:clusters-ui` script

---

## Next Steps

1. **Test the pagination:**
   ```bash
   npm run scraper:month
   ```
   Watch for "Will fetch X page(s)" message

2. **Debug clusters:**
   ```bash
   npm run debug:clusters-ui
   ```
   Check output to see which clusters are missing and why

3. **Verify UI:**
   - Open http://localhost:3000
   - Check cluster table has all recent clusters
   - Verify transaction labels are correct
   - Look for new transaction types (A, G, M, etc.)

4. **If clusters are missing:**
   - Check if they're outside 30-day window
   - Consider extending time window to 45 or 60 days
   - Verify `cluster_count` is correct
   - Re-run cluster detection if needed:
     ```bash
     npm run fix:clusters
     ```

---

## Common Issues

### "Only 100 filings found"
✅ **Fixed** - Now paginates automatically

### "Transaction type shows as just 'P' or 'S'"
✅ **Fixed** - Now shows "P - Purchase", "S - Sale", etc.

### "Clusters in logs don't appear in UI"
⚠️ **Needs investigation** - Use `npm run debug:clusters-ui` to diagnose

### "New transaction codes not recognized"
✅ **Fixed** - All SEC Form 4 codes are now mapped in `transaction-codes.js`

---

## Contact

If you find any issues or need to add new transaction codes, check:
- `src/lib/transaction-codes.js` - Transaction code definitions
- SEC Form 4 documentation for official codes

All fixes are backward compatible and don't require database changes!
