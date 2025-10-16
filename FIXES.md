# Fixing Duplicates and Empty Fields

## Issues Found

### 1. **Duplicate Records**
- **Cause**: The RSS feed returns one entry per **filer**, not per filing. If multiple people file the same Form 4, it appears multiple times.
- **Example**: Apollo entities filing for Taboola - same XML file parsed multiple times
- **Impact**: Records 4-15 in your data are duplicates of the same transactions

### 2. **Empty Insider Fields**
- **Cause**: XML structure varies between filings. Some use different tags or nesting for reporting owner info
- **Example**: TBLA records showing "EMPTY" for insider_name and insider_title
- **Impact**: Missing critical information about who made the trade

### 3. **Weak Unique Constraint**
- **Old constraint**: `(filing_date, ticker, insider_name, transaction_value)`
- **Problem**: If the same insider makes multiple $1M purchases on different days, only the first is saved
- **New constraint**: `(filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value)`

## Fixes Applied

### Code Changes

#### 1. **Deduplicate Filings** (`scraper.js`)
```javascript
// Group filings by accession number to process each Form 4 only once
const uniqueFilings = Array.from(
  new Map(filings.map(f => [f.accessionNumber, f])).values()
);
```

#### 2. **Improved XML Parsing** (`sec-edgar.js`)
- Handle both single and array of reporting owners
- Try multiple fallback paths for insider name
- Map boolean relationship flags (isDirector, isOfficer) to titles
- Default to 'Unknown' and 'Other' instead of empty strings

#### 3. **Use Upsert Instead of Insert** (`scraper.js`)
```javascript
.upsert(records, {
  onConflict: 'filing_date,trade_date,ticker,insider_name,transaction_type,transaction_value',
  ignoreDuplicates: false // Update if exists
})
```

### Database Migrations

#### Migration 002a: Cleanup Existing Duplicates
**Run this FIRST** to clean up your current data:
```sql
-- Remove duplicates
-- Delete records with empty insider names
```

#### Migration 002: Improve Unique Constraint
**Run this SECOND** to prevent future duplicates:
```sql
-- Drop old constraint
-- Add better constraint with trade_date and transaction_type
```

## How to Apply Fixes

### Step 1: Cleanup Current Data
Run in Supabase SQL Editor:
```sql
-- See what will be deleted
SELECT 
  filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value,
  COUNT(*) as duplicate_count
FROM insider_trades
GROUP BY filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value
HAVING COUNT(*) > 1;

-- Delete duplicates
DELETE FROM insider_trades a
USING insider_trades b
WHERE a.id > b.id
  AND a.filing_date = b.filing_date
  AND a.trade_date = b.trade_date
  AND a.ticker = b.ticker
  AND a.insider_name = b.insider_name
  AND a.transaction_type = b.transaction_type
  AND a.transaction_value = b.transaction_value;

-- Delete empty records
DELETE FROM insider_trades
WHERE insider_name = 'EMPTY' OR insider_name = '';
```

### Step 2: Update Unique Constraint
Run in Supabase SQL Editor:
```sql
-- Drop old constraint
ALTER TABLE insider_trades 
DROP CONSTRAINT IF EXISTS insider_trades_filing_date_ticker_insider_name_transaction_key;

-- Add better constraint
ALTER TABLE insider_trades 
ADD CONSTRAINT insider_trades_unique_trade 
UNIQUE (filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value);
```

### Step 3: Test the Scraper
```bash
node src/scripts/test-scraper.js
```

You should now see:
- ✅ No duplicate trades
- ✅ No empty insider names (or very few)
- ✅ Correct deduplication message: "Deduplicated to X unique filings"

## Expected Results

**Before fixes:**
- 30 trades from 10 filings → 20 after filtering
- Multiple duplicates of same transactions
- Empty TBLA insider names

**After fixes:**
- ~10-15 unique trades from 10 filings
- No duplicates
- Proper insider names (or "Unknown" if truly missing)

## Why This Matters

1. **Data Quality**: Clean data = accurate insights
2. **Storage Efficiency**: No wasted space on duplicates  
3. **Analysis Accuracy**: Cluster buy detection requires unique trades
4. **User Trust**: Empty fields look unprofessional

## Notes on "EMPTY" vs "Unknown"

- **Before**: Parser returned empty string → stored as "EMPTY" in DB
- **After**: Parser returns "Unknown" as fallback → clear indication data was unavailable
- Some institutional filers (funds, LLCs) may legitimately have limited public info
