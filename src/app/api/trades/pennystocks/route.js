import { supabase } from '@/lib/supabase.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/trades/pennystocks
 * Fetch insider trades for penny stocks (price < $5)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch trades where current stock price is under $5 (penny stock threshold)
    const { data, error } = await supabase
      .from('insider_trades')
      .select('*')
      .lt('current_stock_price', 5)
      .not('current_stock_price', 'is', null)
      .order('filing_date', { ascending: false })
      .order('transaction_value', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch penny stock trades' }, { status: 500 });
    }

    return NextResponse.json({ trades: data || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
