# Fractional Shares Fix

## The Problem
SEC Form 4 data sometimes includes fractional shares (e.g., `889.9567` shares) due to:
- Stock splits
- RSU vestings
- DRIP (Dividend Reinvestment Plans)
- Fractional share purchases

But the database columns `quantity` and `shares_owned_after` were defined as `INTEGER`, causing insert errors.

## Current Workaround
The scraper now **rounds** fractional shares to integers:
```javascript
quantity: Math.round(trade.quantity)
shares_owned_after: Math.round(trade.sharesOwnedAfter)
```

This works but **loses precision** (889.9567 becomes 890).

## Proper Fix (Recommended)

### Step 1: Run Migration
Run this in Supabase SQL Editor:
```sql
ALTER TABLE insider_trades 
ALTER COLUMN quantity TYPE NUMERIC(15, 4);

ALTER TABLE insider_trades 
ALTER COLUMN shares_owned_after TYPE NUMERIC(15, 4);
```

### Step 2: Remove Rounding (Optional)
After the migration, you can remove the `Math.round()` calls in `src/lib/scraper.js` to preserve exact fractional shares:

```javascript
// Change from:
quantity: Math.round(trade.quantity),
shares_owned_after: Math.round(trade.sharesOwnedAfter),

// To:
quantity: trade.quantity,
shares_owned_after: trade.sharesOwnedAfter,
```

## Why NUMERIC(15, 4)?
- **15 total digits**: Supports up to 99,999,999,999.9999 shares
- **4 decimal places**: Handles fractional shares like 889.9567
- **PostgreSQL NUMERIC**: Exact precision (no floating-point errors)

## Test After Migration
```bash
node src/scripts/test-scraper.js
```

Should now save fractional shares without errors!
