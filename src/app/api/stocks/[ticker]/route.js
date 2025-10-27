import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.js';
import { YahooFinanceClient } from '@/lib/yahoo-finance.js';

/**
 * GET /api/stocks/[ticker]?range=1y&source=db
 * Get stock price data for charts
 *
 * Query params:
 * - range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y (default: 1y)
 * - source: db (database) or live (Yahoo Finance) (default: db)
 */
export async function GET(request, { params }) {
  try {
    // Next.js 15: params is now a Promise
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker.toUpperCase();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1y';
    const source = searchParams.get('source') || 'db';

    // Fetch from database
    if (source === 'db') {
      const days = getRangeDays(range);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data: prices, error } = await supabaseAdmin
        .from('stock_prices')
        .select('*')
        .eq('ticker', ticker)
        .gte('date', cutoffDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!prices || prices.length === 0) {
        return NextResponse.json({
          success: false,
          message: `No price data found in database for ${ticker}. Try source=live or run sync.`,
          ticker,
          range
        }, { status: 404 });
      }

      // Get metadata
      const { data: metadata } = await supabaseAdmin
        .from('stock_metadata')
        .select('*')
        .eq('ticker', ticker)
        .single();

      return NextResponse.json({
        success: true,
        source: 'database',
        ticker,
        range,
        companyName: metadata?.company_name,
        prices: prices.map(p => ({
          date: p.date,
          open: parseFloat(p.open),
          high: parseFloat(p.high),
          low: parseFloat(p.low),
          close: parseFloat(p.close),
          volume: parseInt(p.volume),
          adjClose: parseFloat(p.adj_close)
        })),
        metadata
      });
    }

    // Fetch live from Yahoo Finance
    if (source === 'live') {
      const yahooClient = new YahooFinanceClient();
      const chartData = await yahooClient.getChartData(ticker, range);

      return NextResponse.json({
        success: true,
        source: 'live',
        ticker,
        range,
        companyName: chartData.companyName,
        currentPrice: chartData.currentPrice,
        change: chartData.change,
        changePercent: chartData.changePercent,
        prices: chartData.prices
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid source parameter. Use "db" or "live".'
    }, { status: 400 });

  } catch (error) {
    console.error('Error fetching stock data:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Convert range string to number of days
 */
function getRangeDays(range) {
  const rangeToDays = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825
  };
  return rangeToDays[range] || 365;
}
