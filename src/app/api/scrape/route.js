import { NextResponse } from 'next/server';
import { InsiderTradeScraper } from '@/lib/scraper';

/**
 * POST /api/scrape
 * Trigger manual scrape (for testing/admin)
 */
export async function POST(request) {
  try {
    // Optional: Add authentication here for production
    const scraper = new InsiderTradeScraper();
    const result = await scraper.runDailyScrape();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/scrape
 * Get scrape status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Use POST to trigger a scrape'
  });
}
