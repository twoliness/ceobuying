import { supabase } from '@/lib/supabase.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/trades
 * Fetch insider trades with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'cluster', 'buys', 'sales'
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('insider_trades')
      .select('*')
      .order('filing_date', { ascending: false })
      .order('transaction_value', { ascending: false });

    // Filter by type
    if (type === 'cluster') {
      query = query.eq('is_cluster_buy', true);
    } else if (type === 'buys') {
      query = query.eq('transaction_type', 'P');
    } else if (type === 'sales') {
      query = query.eq('transaction_type', 'S');
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }

    return NextResponse.json({ trades: data || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
