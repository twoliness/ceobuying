# CeoBuying

A daily insider trading tracker displaying significant trades from SEC EDGAR filings.

## Features

- **Landing Page**
  - Top 5 hero cards for biggest trades
  - 3 grouped tables: Cluster Buys, Insider Buys (>$500K), Insider Sales (>$100K)
  - Real-time data from SEC EDGAR
  - Stock price enrichment from Yahoo Finance

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS v4
- **Backend**: Node.js with API routes
- **Database**: PostgreSQL (Supabase)
- **Data Sources**: SEC EDGAR API, Yahoo Finance

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)

### 2. Database Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database schema:
   ```bash
   # Copy the SQL from database/schema.sql
   # Paste and run in Supabase SQL Editor
   ```

### 3. Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. The Supabase credentials are already filled in `.env.example`. Just update:
   ```env
   # SEC EDGAR (required - use your company name and email)
   SEC_USER_AGENT=YourCompany your@email.com
   ```

### 4. Install Dependencies

```bash
npm install
```

## Development

### Run the Web App

```bash
npm run dev
```

Visit http://localhost:3000

### Test the Scraper

```bash
npm run test:scraper
```

This will:
- Fetch recent Form 4 filings from SEC EDGAR
- Parse and filter significant trades
- Enrich with stock prices
- Store in database

**Note**: This takes 5-10 minutes due to rate limiting.

### Manual Testing

#### Trigger Manual Scrape via API

```bash
curl -X POST http://localhost:3000/api/scrape
```

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Data Flow

```
SEC EDGAR
  ↓
Parse Form 4 XML
  ↓
Filter trades (buys >$500k, sales >$100k)
  ↓
Enrich with Yahoo Finance stock prices
  ↓
Store in Supabase
  ↓
Display on landing page (via API routes)
```

## Project Structure

```
ceobuying/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trades/         # GET trades API
│   │   │   │   ├── hero/       # Top 5 trades
│   │   │   │   └── route.js    # All trades with filters
│   │   │   └── scrape/         # POST to trigger scrape
│   │   ├── layout.js           # Root layout
│   │   └── page.js             # Landing page
│   ├── components/
│   │   ├── TradeCard.js        # Hero trade card
│   │   └── TradesTable.js      # Trade data table
│   ├── lib/
│   │   ├── scraper.js          # Main scraper orchestrator
│   │   ├── sec-edgar.js        # SEC EDGAR API client
│   │   ├── stock-price.js      # Yahoo Finance client
│   │   └── supabase.js         # Database client
│   └── scripts/
│       └── test-scraper.js     # Test scraper
├── database/
│   └── schema.sql              # PostgreSQL schema
├── .env.example                # Environment template
├── package.json
└── README.md
```

## Key Decisions

✅ $500K minimum trade size for buys
✅ $100K minimum trade size for sales
✅ Show both buys AND sales
✅ Focus on landing page display

## Troubleshooting

### Scraper Failing

- Verify SEC_USER_AGENT is set (required by SEC)
- Check SEC EDGAR API is accessible
- Review error logs in console

### Database Connection Errors

- Verify SUPABASE_URL and SUPABASE_KEY
- Check database schema is created
- Verify Supabase project is active

### Yahoo Finance Errors

- Yahoo Finance API is free but can be rate-limited
- Scraper will continue even if some prices fail
- Try reducing batch size if many errors

## Budget

- Supabase: Free tier (up to 500MB)
- Vercel: Free tier
- **Total: $0/month**

## License

MIT
