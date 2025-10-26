import { NextResponse } from 'next/server';
import { TelegramPoster } from '@/lib/telegram-poster.js';
import { formatDailyWatch } from '@/lib/message-formatter.js';
import { supabaseAdmin } from '@/lib/supabase.js';

/**
 * POST /api/telegram/post-daily
 * Triggered by Skedbit to post daily update to free channel
 *
 * Security: Requires CRON_SECRET in Authorization header
 */
export async function POST(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('❌ Unauthorized post attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📬 Starting daily Telegram post...');

    // Parse optional parameters
    const body = await request.json().catch(() => ({}));
    const timeframe = body.timeframe || '24h'; // 24h, 12h, 1h

    // Get cutoff time
    const now = new Date();
    const cutoffTime = new Date(now);

    switch(timeframe) {
      case '1h':
        cutoffTime.setHours(cutoffTime.getHours() - 1);
        break;
      case '12h':
        cutoffTime.setHours(cutoffTime.getHours() - 12);
        break;
      case '24h':
      default:
        cutoffTime.setHours(cutoffTime.getHours() - 24);
    }

    const cutoffDate = cutoffTime.toISOString();

    // Fetch top buys
    const { data: topBuys, error: buysError } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .eq('transaction_type', 'P')
      .gte('filing_date', cutoffDate)
      .order('transaction_value', { ascending: false })
      .limit(5);

    if (buysError) {
      console.error('Error fetching top buys:', buysError);
      throw buysError;
    }

    // Fetch cluster buys
    const { data: clusters, error: clustersError } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .eq('transaction_type', 'P')
      .eq('is_cluster_buy', true)
      .gte('filing_date', cutoffDate)
      .gte('cluster_count', 2)
      .order('transaction_value', { ascending: false })
      .limit(10);

    if (clustersError) {
      console.error('Error fetching clusters:', clustersError);
      throw clustersError;
    }

    // Fetch top sales
    const { data: topSales, error: salesError } = await supabaseAdmin
      .from('insider_trades')
      .select('*')
      .eq('transaction_type', 'S')
      .gte('filing_date', cutoffDate)
      .order('transaction_value', { ascending: false })
      .limit(3);

    if (salesError) {
      console.error('Error fetching top sales:', salesError);
      throw salesError;
    }

    console.log(`📊 Found: ${topBuys.length} buys, ${clusters.length} clusters, ${topSales.length} sales`);

    // Check if we have any data
    if (topBuys.length === 0 && clusters.length === 0 && topSales.length === 0) {
      console.log('⚠️  No trades found in timeframe');
      return NextResponse.json({
        success: true,
        message: 'No trades to post',
        postedAt: new Date().toISOString()
      });
    }

    // Format message
    const message = formatDailyWatch({
      topBuys,
      clusters,
      topSales
    });

    console.log('📝 Message formatted, length:', message.length);

    // Send to Telegram
    const poster = new TelegramPoster();
    const result = await poster.sendToFreeChannel(message);

    console.log('✅ Posted to Telegram successfully');

    return NextResponse.json({
      success: true,
      message: 'Posted to free channel',
      postedAt: new Date().toISOString(),
      messageId: result.message_id,
      stats: {
        topBuys: topBuys.length,
        clusters: clusters.length,
        topSales: topSales.length
      }
    });

  } catch (error) {
    console.error('❌ Error posting to Telegram:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/telegram/post-daily
 * Get endpoint info and test configuration
 */
export async function GET() {
  const isSecured = !!process.env.CRON_SECRET;
  const hasTelegramToken = !!process.env.TELEGRAM_TOKEN;
  const hasFreeChannel = !!process.env.FREE_CHAT_ID;

  return NextResponse.json({
    status: 'ready',
    message: 'Skedbit endpoint for posting daily updates to free Telegram channel',
    secured: isSecured,
    configured: {
      telegramToken: hasTelegramToken,
      freeChannelId: hasFreeChannel,
      supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET)
    },
    usage: {
      method: 'POST',
      headers: isSecured ? { 'Authorization': 'Bearer YOUR_CRON_SECRET' } : {},
      body: {
        timeframe: '24h | 12h | 1h (optional, default: 24h)'
      },
      curl: isSecured
        ? 'curl -X POST https://ceobuying.com/api/telegram/post-daily -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" -d \'{"timeframe":"24h"}\''
        : 'curl -X POST https://ceobuying.com/api/telegram/post-daily -H "Content-Type: application/json" -d \'{"timeframe":"24h"}\''
    },
    schedules: {
      'post-market': '03:30 UTC (post-market scan)',
      'overnight': '08:00 UTC (overnight update)',
      'market-open': '14:00 UTC (U.S. market open pulse)'
    }
  });
}
