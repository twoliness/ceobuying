import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.js';

/**
 * GET /api/stocks/movers
 * Get top gainers and losers (Up Today / Down Today)
 *
 * Uses materialized view for fast performance
 * View is refreshed after each stock price sync
 */
export async function GET() {
  try {
    // Fetch top gainers
    const { data: gainers, error: gainersError } = await supabaseAdmin
      .from('stock_movers')
      .select('ticker, company_name, current_price, change, change_percent')
      .eq('mover_type', 'gainer')
      .order('change_percent', { ascending: false })
      .limit(10);

    if (gainersError) {
      console.error('Error fetching gainers:', gainersError);
      throw gainersError;
    }

    // Fetch top losers
    const { data: losers, error: losersError } = await supabaseAdmin
      .from('stock_movers')
      .select('ticker, company_name, current_price, change, change_percent')
      .eq('mover_type', 'loser')
      .order('change_percent', { ascending: true })
      .limit(10);

    if (losersError) {
      console.error('Error fetching losers:', losersError);
      throw losersError;
    }

    // Format response
    const upToday = (gainers || []).map(m => ({
      ticker: m.ticker,
      companyName: m.company_name,
      price: parseFloat(m.current_price),
      change: parseFloat(m.change),
      changePercent: parseFloat(m.change_percent.toFixed(2))
    }));

    const downToday = (losers || []).map(m => ({
      ticker: m.ticker,
      companyName: m.company_name,
      price: parseFloat(m.current_price),
      change: parseFloat(m.change),
      changePercent: parseFloat(m.change_percent.toFixed(2))
    }));

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
