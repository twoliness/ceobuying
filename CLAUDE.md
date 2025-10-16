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
1. Scraper fetches Form 4 filings from SEC EDGAR
2. Filters significant trades (buys >$500K, sales >$100K)
3. Enriches with Yahoo Finance stock prices
4. Detects cluster buys (multiple insiders, same stock)
5. Stores in Supabase PostgreSQL
6. Landing page fetches via API routes

### API Design
- All API routes use Next.js App Router pattern
- Trade data filtered by type: `?type=cluster|buys|sales`
- Hero endpoint returns top 5 trades by value
- Manual scrape via POST to `/api/scrape`

### Database Schema
- Trades stored with full details
- Cluster buys detected (multiple insiders, same stock)
- Job runs logged for monitoring (optional)
- `ai_summary` field reserved for future use

## Important Patterns

### ES Modules
- Package.json has `"type": "module"`
- Use `import/export` syntax throughout
- Scripts use `.js` extension with ES module syntax

### Environment Variables
- Required: `SUPABASE_URL`, `SUPABASE_KEY`, `SEC_USER_AGENT`
- Use `.env.local` for development
- SEC requires User-Agent header (Company + Email)
- Supabase credentials are pre-filled in `.env.example`

### Client vs Server Components
- Landing page (`page.js`) is client component (`'use client'`) for state management
- API routes are server-side only
- Components can be either (currently client for simplicity)

### Error Handling
- Scraper continues on individual filing errors
- Database errors logged but don't crash processes
- Rate limiting delays built into API calls

## Development Workflow

### First Time Setup
1. Copy `.env.example` to `.env.local` and update SEC_USER_AGENT
2. Create Supabase project and run `database/schema.sql`
3. Run `npm install`

### Testing Locally
1. Start web app: `npm run dev`
2. Test scraper: `npm run test:scraper` (requires env vars)
3. View results at http://localhost:3000

### Deployment
- **Web app**: Deploy to Vercel (free tier)
- Set environment variables in platform

## Common Tasks

### Add New API Endpoint
Create `src/app/api/[name]/route.js` with GET/POST exports

### Modify Trade Filtering
Edit `src/lib/scraper.js` filters (minBuyValue, minSaleValue)

### Adjust Scraping Logic
Edit `src/lib/sec-edgar.js` for SEC API changes

## SEC EDGAR Notes

- Form 4 = Statement of Changes in Beneficial Ownership
- Must include User-Agent header (company + email)
- Rate limit: Be respectful, add delays between requests
- XML structure: ownershipDocument → nonDerivativeTransaction
- Transaction codes: P = Purchase, S = Sale, A = Acquired, D = Disposed
