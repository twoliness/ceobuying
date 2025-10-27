import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.js';

/**
 * GET /api/stocks/movers
 * Get top gainers and losers (Up Today / Down Today)
 *
 * Calculates % change between latest close and previous close
 */
export async function GET() {
  try {
    // Get all tickers with at least 2 days of data
    const { data: tickers, error: tickersError } = await supabaseAdmin
      .from('stock_metadata')
      .select('ticker');

    if (tickersError) {
      throw tickersError;
    }

    if (!tickers || tickers.length === 0) {
      return NextResponse.json({
        success: true,
        upToday: [],
        downToday: []
      });
    }

    const movers = [];

    // For each ticker, get the last 2 days of data to calculate % change
    for (const { ticker } of tickers) {
      const { data: prices, error: pricesError } = await supabaseAdmin
        .from('stock_prices')
        .select('date, close')
        .eq('ticker', ticker)
        .order('date', { ascending: false })
        .limit(2);

      if (pricesError || !prices || prices.length < 2) {
        continue; // Skip if not enough data
      }

      const latest = prices[0];
      const previous = prices[1];

      const change = latest.close - previous.close;
      const changePercent = ((change / previous.close) * 100).toFixed(2);

      // Get metadata for company name
      const { data: metadata } = await supabaseAdmin
        .from('stock_metadata')
        .select('company_name')
        .eq('ticker', ticker)
        .single();

      movers.push({
        ticker,
        companyName: metadata?.company_name || ticker,
        price: parseFloat(latest.close),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent)
      });
    }

    // Sort by change percent
    movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    // Get top 10 gainers (positive change)
    const upToday = movers
      .filter(m => m.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10);

    // Get top 10 losers (negative change)
    const downToday = movers
      .filter(m => m.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      upToday,
      downToday,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching movers:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
