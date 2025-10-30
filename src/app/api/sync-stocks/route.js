import { NextResponse } from 'next/server';
import { StockPriceSync } from '@/lib/stock-price-sync.js';
import { supabaseAdmin } from '@/lib/supabase.js';

// Set maximum execution time to 4 minutes (240 seconds)
// Note: Requires Vercel Pro or higher. Hobby tier limited to 10s.
export const maxDuration = 240;

/**
 * GET /api/sync-stocks
 * Manual trigger via browser
 * Requires CRON_SECRET in query param: ?secret=xxx&days=7
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    // Check authentication via query param
    if (cronSecret && secret !== cronSecret) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head><title>Unauthorized</title></head>
<body style="font-family: system-ui; padding: 40px; text-align: center;">
  <h1 style="color: #ef4444;">❌ Unauthorized</h1>
  <p>Invalid or missing secret parameter.</p>
  <p style="color: #666; font-size: 14px;">Usage: /api/sync-stocks?secret=YOUR_SECRET&days=7</p>
</body>
</html>`,
        { status: 401, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const days = parseInt(searchParams.get('days') || '7', 10);

    console.log(`\n🔄 Starting stock price sync (${days} days)...`);
    console.log(`   Triggered at: ${new Date().toISOString()}`);

    const syncService = new StockPriceSync();
    const results = await syncService.syncAllInsiderTradeTickers(days);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✅ Sync complete:`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}\n`);

    // Refresh materialized view for stock movers
    console.log('🔄 Refreshing stock movers view...');
    try {
      const { error: refreshError } = await supabaseAdmin.rpc('refresh_stock_movers');
      if (refreshError) {
        console.error('   ⚠️ Warning: Could not refresh stock movers view:', refreshError);
      } else {
        console.log('   ✅ Stock movers view refreshed');
      }
    } catch (refreshErr) {
      console.error('   ⚠️ Warning: Error refreshing stock movers view:', refreshErr);
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      successful,
      failed
    });

  } catch (error) {
    console.error('❌ Stock sync failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/sync-stocks
 * Sync stock prices from Yahoo Finance for all insider trade tickers
 *
 * Requires CRON_SECRET in Authorization header for security
 * Query params:
 *   - days: Number of days to sync (default: 7)
 */
export async function POST(request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    console.log(`\n🔄 Starting stock price sync (${days} days)...`);
    console.log(`   Triggered at: ${new Date().toISOString()}`);

    const syncService = new StockPriceSync();
    const results = await syncService.syncAllInsiderTradeTickers(days);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✅ Sync complete:`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}\n`);

    // Refresh materialized view for stock movers
    console.log('🔄 Refreshing stock movers view...');
    try {
      const { error: refreshError } = await supabaseAdmin.rpc('refresh_stock_movers');
      if (refreshError) {
        console.error('   ⚠️ Warning: Could not refresh stock movers view:', refreshError);
      } else {
        console.log('   ✅ Stock movers view refreshed');
      }
    } catch (refreshErr) {
      console.error('   ⚠️ Warning: Error refreshing stock movers view:', refreshErr);
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
        days
      },
      results,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Stock sync failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
