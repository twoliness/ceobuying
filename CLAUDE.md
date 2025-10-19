# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CeoBuying - A daily insider trading tracker displaying significant trades from SEC EDGAR filings.

Built with Next.js 15.5.5, React 19, Tailwind CSS v4, and Turbopack.

## Development Commands

- **Start web app**: `npm run dev` (Next.js dev server with Turbopack)
- **Test scraper**: `npm run test:scraper` (test SEC data collection)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

Development server runs on http://localhost:3000

## Project Structure

### Frontend (Next.js App Router)
- **src/app/**: App Router pages and layouts
  - `page.js`: Landing page with hero cards and trade tables
  - `layout.js`: Root layout with Geist fonts
  - `api/trades/`: GET endpoints for trade data
  - `api/scrape/`: POST endpoint to trigger manual scrape

### Components
- **src/components/**: React components
  - `TradeCard.js`: Hero card for top trades
  - `TradesTable.js`: Data table for trades list

### Backend Services
- **src/lib/**: Core business logic (ES modules)
  - `sec-edgar.js`: SEC EDGAR Form 4 parser
  - `stock-price.js`: Yahoo Finance integration
  - `scraper.js`: Main orchestrator (fetches, enriches, stores)
  - `supabase.js`: PostgreSQL database client

### Scripts
- **src/scripts/**: CLI tools
  - `test-scraper.js`: Test scraping pipeline

### Database
- **database/schema.sql**: PostgreSQL schema for Supabase
  - `insider_trades`: Main trades table
  - `job_runs`: Scraper job logs (optional)

## Key Technologies

- **Next.js 15**: App Router architecture (not Pages Router)
- **React 19**: Client components with hooks
- **Tailwind CSS v4**: Using `@tailwindcss/postcss`
- **Turbopack**: Fast builds and dev mode
- **Supabase**: PostgreSQL database (free tier)
- **axios**: HTTP client for external APIs
- **xml2js**: SEC XML parsing

## Architecture Notes

### Data Flow
1. Scraper fetches Form 4 filings from SEC EDGAR RSS feed
2. Parses XML from discovered filing URLs (tries multiple patterns)
3. Filters trades (currently capturing ALL trades, minBuyValue=0, minSaleValue=0)
4. Detects cluster buys (2+ insiders buying same stock)
5. Enriches with Yahoo Finance stock prices and company info (industry/sector)
6. Upserts to Supabase PostgreSQL (handles duplicates via unique constraint)
7. Landing page fetches via API routes

### API Design
- All API routes use Next.js App Router pattern
- Trade data filtered by type: `?type=cluster|buys|sales`
- Hero endpoint returns top 5 trades by value
- Manual scrape via POST to `/api/scrape`

### Database Schema
- Trades stored with full details including industry information
- Unique constraint: `filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value`
- Upsert strategy prevents duplicate trades
- Cluster buys detected (multiple insiders, same stock)
- Job runs logged for monitoring (optional)
- `industry` field fetched from Yahoo Finance company profile
- `ai_summary` field reserved for future use
- Migration available: `database/migrations/add_industry_column.sql`

## Important Patterns

### ES Modules
- Package.json has `"type": "module"`
- Use `import/export` syntax throughout
- Scripts use `.js` extension with ES module syntax

### Environment Variables
- Required: `SUPABASE_URL`, `SUPABASE_SECRET`, `SEC_USER_AGENT`
- Optional:
  - `MAX_FILINGS` (limits number of filings to process, default: all)
  - `CRON_SECRET` (for securing cron endpoint)
  - `NEXT_PUBLIC_APP_URL` (public app URL for metadata)
- Use `.env` or `.env.local` for development
- SEC requires User-Agent header (Company + Email format: "CompanyName contact@email.com")
- Supabase credentials are pre-configured for production database

### Client vs Server Components
- Landing page (`page.js`) is client component (`'use client'`) for state management
- API routes are server-side only
- Components can be either (currently client for simplicity)

### Error Handling
- Scraper continues on individual filing errors
- Database errors logged but don't crash processes
- Rate limiting: SEC enforces 10 req/sec max (100ms delay between requests)
- XML discovery tries multiple URL patterns (index.json, HTML fallback, common patterns)
- Deduplication happens at multiple stages (filings, records, database)

## Development Workflow

### First Time Setup
1. Copy `.env` to `.env.local` if needed (or modify `.env` directly)
2. Update `SEC_USER_AGENT` with your company name and email
3. Supabase is already configured (or create new project and run `database/schema.sql`)
4. Run `npm install`

### Testing Locally
1. Start web app: `npm run dev`
2. Test scraper: `npm run test:scraper` (requires env vars)
3. View results at http://localhost:3000

### Deployment
- **Web app**: Deploy to Vercel (free tier)
- Set environment variables in Vercel dashboard
- **Automated scraping**: Configured via `vercel.json` cron (every 2 hours)
- Cron job hits `/api/scrape` endpoint with CRON_SECRET for authentication

## Common Tasks

### Add New API Endpoint
Create `src/app/api/[name]/route.js` with GET/POST exports

### Modify Trade Filtering
Edit `src/lib/scraper.js` filters (minBuyValue, minSaleValue)

### Adjust Scraping Logic
Edit `src/lib/sec-edgar.js` for SEC API changes

## SEC EDGAR Notes

- Form 4 = Statement of Changes in Beneficial Ownership
- Must include User-Agent header (company + email format required by SEC)
- Rate limit: 10 requests/second max (enforced with 100ms delays)
- RSS feed: `browse-edgar?action=getcurrent&type=4&output=atom`
- XML structure: ownershipDocument → nonDerivativeTransaction
- Transaction codes: P = Purchase, S = Sale, A = Acquired, D = Disposed
- XML discovery: tries index.json, HTML parsing, and 5+ common filename patterns
- Accession numbers: Format `0000000000-00-000000`, stored with/without dashes

## Scraper Behavior

- **Current trade filtering**: Captures ALL trades (minBuyValue=0, minSaleValue=0)
- **Cluster detection**: 2+ insiders buying same stock = cluster buy
- **Deduplication**: By accession number (filings), then by unique constraint (database)
- **Rate limiting**: 500ms between filing fetches, 100ms between SEC API calls
- **MAX_FILINGS env var**: Limits processing for testing (default: all filings)
- **Upsert strategy**: Uses `onConflict` to update existing trades or insert new ones

## Additional Scripts

- **src/scripts/run-scraper.js**: CLI script to manually run the scraper (same as test-scraper.js)
- Both scripts load environment variables and execute the full pipeline
