import { NextResponse } from 'next/server';
import { InsiderTradeScraper } from '@/lib/scraper.js';

/**
 * POST /api/scrape
 * Manually trigger the insider trade scraper
 * 
 * Security: Add CRON_SECRET to .env and pass as Authorization header
 * Usage: POST /api/scrape with header: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Optional: Add authentication for production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('❌ Unauthorized scrape attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('='.repeat(60));
    console.log('🚀 Manual scrape triggered via API');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Max filings: ${process.env.MAX_FILINGS || 'all'}`);
    console.log('='.repeat(60));

    const scraper = new InsiderTradeScraper();
    const result = await scraper.runDailyScrape();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('✅ Scrape completed successfully');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Trades processed: ${result.tradesProcessed || 0}`);
    console.log('='.repeat(60));

    return NextResponse.json({
      ...result,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('='.repeat(60));
    console.error('❌ Scrape failed');
    console.error(`   Duration: ${duration}s`);
    console.error(`   Error: ${error.message}`);
    console.error('='.repeat(60));
    console.error(error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/scrape
 * Get scrape endpoint status and configuration
 */
export async function GET() {
  const isSecured = !!process.env.CRON_SECRET;
  
  return NextResponse.json({
    status: 'ready',
    message: 'Use POST to trigger a scrape',
    secured: isSecured,
    config: {
      maxFilings: process.env.MAX_FILINGS || 'all available',
      userAgent: process.env.SEC_USER_AGENT || 'not set',
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET)
    },
    usage: {
      curl: isSecured 
        ? 'curl -X POST https://your-domain.com/api/scrape -H "Authorization: Bearer YOUR_CRON_SECRET"'
        : 'curl -X POST https://your-domain.com/api/scrape',
      note: isSecured 
        ? 'Authentication required. Set CRON_SECRET in .env'
        : 'No authentication set. Add CRON_SECRET to .env for security.'
    }
  });
}
