import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/trades/hero
 * Fetch top 5 trades for hero cards
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('insider_trades')
      .select('*')
      .order('transaction_value', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch hero trades' }, { status: 500 });
    }

    return NextResponse.json({ trades: data || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
