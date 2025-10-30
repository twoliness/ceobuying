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

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Stock Sync Complete</title>
  <style>
    body { font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto; }
    .success { background: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .stat { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .details { background: #f9fafb; padding: 16px; border-radius: 8px; font-size: 14px; }
    pre { overflow-x: auto; }
  </style>
</head>
<body>
  <div class="success">
    <h1 style="margin: 0;">✅ Stock Sync Complete!</h1>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${results.length}</div>
      <div class="stat-label">Total Tickers</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #10b981;">${successful}</div>
      <div class="stat-label">Successful</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #ef4444;">${failed}</div>
      <div class="stat-label">Failed</div>
    </div>
  </div>

  <div class="details">
    <p><strong>Days synced:</strong> ${days}</p>
    <p><strong>Completed at:</strong> ${new Date().toISOString()}</p>
  </div>

  <details style="margin-top: 20px;">
    <summary style="cursor: pointer; padding: 12px; background: #f3f4f6; border-radius: 8px;">
      View JSON Response
    </summary>
    <pre style="background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 8px;">${JSON.stringify({
      success: true,
      summary: { total: results.length, successful, failed, days },
      results,
      completedAt: new Date().toISOString()
    }, null, 2)}</pre>
  </details>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('❌ Stock sync failed:', error);

    const html = `<!DOCTYPE html>
<html>
<head><title>Sync Failed</title></head>
<body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
  <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0;">❌ Stock Sync Failed</h1>
  </div>
  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px;">
    <p style="margin: 0; color: #991b1b;"><strong>Error:</strong> ${error.message}</p>
  </div>
  <details style="margin-top: 20px;">
    <summary style="cursor: pointer; padding: 12px; background: #f3f4f6; border-radius: 8px;">
      View Error Details
    </summary>
    <pre style="background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 8px;">${error.stack || error.message}</pre>
  </details>
</body>
</html>`;

    return new NextResponse(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
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
