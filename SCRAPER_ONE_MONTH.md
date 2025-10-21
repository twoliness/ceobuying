# 🚀 1-Month SEC Scraper - Complete Guide

## What It Does

This comprehensive scraper fetches **ALL insider trades** from the last 30 days:
- ✅ **Purchases** (P)
- ✅ **Sales** (S)
- ✅ **Awards** (A)
- ✅ **Gifts** (G)
- ✅ **Derivatives** (D)
- ✅ **All other transaction types**

## Key Features

### 1. **Comprehensive Data Collection**
- Fetches up to 1,000 Form 4 filings
- Filters to last 30 days
- Captures **ALL trade types** (not just buys/sells)
- No minimum value thresholds

### 2. **Data Replacement**
- Uses `upsert` to replace existing data
- Same filing + trade + insider = updated record
- Fresh, accurate data every run

### 3. **Automatic Enrichment**
- ✅ Detects real clusters (multiple different insiders)
- ✅ Fetches company industry from SEC
- ✅ Gets current stock prices
- ✅ Calculates 7-day price changes

### 4. **Intelligent Rate Limiting**
- 300ms between filings (respectful to SEC)
- 100ms between company info requests
- Prevents rate limit errors

---

## 🚀 How to Run

```bash
cd /Volumes/ProjectSpace/_wip/ceobuying

# Run the 1-month scraper
npm run scraper:month
```

**Expected runtime:** 15-30 minutes (depending on network speed)

---

## 📊 What You'll See

### Progress Output:

```
🚀 Starting 1-Month SEC Scraper (ALL Trade Types)...

📅 Fetching filings from: 2025-09-21 to 2025-10-21

🔍 Fetching up to 1000 recent Form 4 filings...
✓ Found 876 Form 4 filings

✓ Deduplicated to 823 unique filings

✓ 742 filings within the last 30 days

────────────────────────────────────────────────────────────────

[1/742] Parsing: NVIDIA CORP
  📄 Accession: 0001234567-25-001234
  🏢 CIK: 0001045810
  ✓ Found 1 trades
  📊 Types: S

[2/742] Parsing: Apple Inc.
  📄 Accession: 0001234567-25-001235
  🏢 CIK: 0000320193
  ✓ Found 3 trades
  📊 Types: P, A

...

────────────────────────────────────────────────────────────────

📊 Parsing Summary:
   ✓ Successfully parsed: 715 filings
   ✗ Errors: 27 filings
   📈 Total trades extracted: 2,847

📊 Trade Types Breakdown:
   P :  1,234 trades (43.4%)
   S :  1,089 trades (38.2%)
   A :    342 trades (12.0%)
   G :    142 trades (5.0%)
   D :     40 trades (1.4%)

💾 Storing trades in database...
   💾 Storing 2,847 unique trades...
   ✓ Stored successfully (2,847 records)

🔥 Detecting clusters...
   🔍 Analyzing 2,847 trades for clusters...
   🔥 NVDA Sales: 13 different insiders
   🔥 GOOGL Sales: 2 different insiders
   🔥 GBX Purchases: 7 different insiders
   🔥 UBER Purchases: 6 different insiders
   ✓ Found 12 clusters, updated 156 trades

📊 Enriching data for 487 unique tickers...
   📊 Fetching company info from SEC...
   ✓ Fetched 452/487 companies
   📈 Fetching stock prices...
   💾 Updating database with enrichment data...
   ✓ Enrichment complete

✅ 1-Month scraper completed successfully!

📊 Summary:
   - Filings processed: 715
   - Trades stored: 2,847
   - Unique tickers: 487

✨ All done!
```

---

## 📋 Trade Types Explained

| Code | Type | Description | Example |
|------|------|-------------|---------|
| **P** | Purchase | Open market buy | CEO buys $1M of stock |
| **S** | Sale | Open market sale | CFO sells $500K of stock |
| **A** | Award | Stock grant/award | Employee gets RSUs |
| **G** | Gift | Gifted shares | Executive gifts to family |
| **D** | Derivative | Options/warrants | Stock options exercised |
| **M** | Exercise | Option exercise | Converting options to shares |
| **F** | Tax | Payment in stock | Tax withholding |
| **I** | Discretionary | Discretionary transaction | Various |
| **J** | Other | Other acquisition | Various |
| **K** | Other | Other disposition | Various |

---

## 🎯 Key Differences from Regular Scraper

| Feature | Regular (`test:scraper`) | 1-Month (`scraper:month`) |
|---------|-------------------------|---------------------------|
| **Time Range** | Recent (~100 filings) | Last 30 days (~1000 filings) |
| **Trade Types** | Purchases & Sales only | **ALL types** |
| **Filtering** | May filter by value | **No filtering** |
| **Purpose** | Quick test | **Complete dataset** |
| **Runtime** | ~2-5 minutes | ~15-30 minutes |

---

## 🔍 After Running

### 1. Check the Results

```bash
# See what clusters were found
npm run check:clusters

# View top trades this week
npm run test:hero
```

### 2. Start the App

```bash
npm run dev

# Open http://localhost:3000
```

### 3. Verify Data

You should now see:
- ✅ All trade types in the database
- ✅ Properly detected clusters (GBX, UBER, GOOGL, etc.)
- ✅ Correct purchase/sale labels
- ✅ Current stock prices
- ✅ Industry information

---

## 🛠️ Troubleshooting

### "No trades found"
- Check your SEC_USER_AGENT in `.env.local`
- Verify internet connection
- SEC may be temporarily down

### "Rate limit error"
- The scraper has built-in rate limiting (300ms delays)
- If still hitting limits, increase the delay in the code

### "Database error"
- Check Supabase credentials in `.env.local`
- Verify database schema is up to date
- Check database storage limits

### Wrong trade types showing
- Make sure you ran `npm run scraper:month` (not `test:scraper`)
- Check the console output for trade type breakdown
- Verify in database: `SELECT DISTINCT transaction_type FROM insider_trades`

---

## 📊 Database Impact

### Before Running:
```sql
-- Old data with limited trade types
SELECT transaction_type, COUNT(*) 
FROM insider_trades 
GROUP BY transaction_type;

-- Result:
-- P: 234
-- S: 189
```

### After Running:
```sql
-- Comprehensive data with all types
SELECT transaction_type, COUNT(*) 
FROM insider_trades 
GROUP BY transaction_type;

-- Result:
-- P: 1,234
-- S: 1,089
-- A: 342
-- G: 142
-- D: 40
-- (and more)
```

---

## 🔄 When to Run

### First Time Setup:
```bash
# Get comprehensive historical data
npm run scraper:month
```

### Daily/Weekly Updates:
```bash
# Quick update with recent data
npm run test:scraper
```

### Monthly Refresh:
```bash
# Full refresh of last 30 days
npm run scraper:month
```

---

## ⚠️ Important Notes

1. **Runtime**: This takes 15-30 minutes. Be patient!
2. **Network**: Requires stable internet connection
3. **SEC Limits**: Respects SEC rate limits (10 requests/second)
4. **Data**: Replaces/updates existing records (doesn't duplicate)
5. **Clusters**: Automatically detects after storing all trades

---

## 🎉 Success Indicators

After running successfully, you should see:

✅ **Clusters Table**: Shows correct types (purchases AND sales)
✅ **Top Trades**: Includes all trade types
✅ **GBX & UBER**: Showing as purchases (not sales)
✅ **GOOGL**: Appearing in clusters table as sale
✅ **Trade Breakdown**: Shows P, S, A, G, D, and other types

---

## 📝 Next Steps

After the scraper completes:

1. **Verify clusters are correct:**
   ```bash
   npm run check:clusters
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Check the UI:**
   - Clusters table should show all types
   - Trade type badges should be correct
   - Top trades should include various types

---

**Ready to run? Execute:** `npm run scraper:month`

This will give you a complete, accurate dataset with all trade types! 🚀
