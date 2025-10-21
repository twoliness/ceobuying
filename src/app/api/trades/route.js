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
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased from 20

    let query = supabase
      .from('insider_trades')
      .select('*')
      .order('filing_date', { ascending: false })
      .order('transaction_value', { ascending: false });

    // Filter by type
    if (type === 'cluster') {
      // Show ALL real clusters from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
      
      query = query
        .eq('is_cluster_buy', true)
        .gte('filing_date', dateFilter);
      
      console.log(`Fetching clusters from ${dateFilter} onwards (limit: ${limit})`);
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

    const purchases = data?.filter(t => t.transaction_type === 'P').length || 0;
    const sales = data?.filter(t => t.transaction_type === 'S').length || 0;
    
    console.log(`Returning ${data?.length || 0} ${type || 'all'} trades (${purchases} buys, ${sales} sales)`);

    return NextResponse.json({ trades: data || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
