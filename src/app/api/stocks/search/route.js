import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.js';

/**
 * GET /api/stocks/search?q=query
 * Search for stocks by ticker or company name
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    const searchTerm = query.trim().toUpperCase();

    // Search by ticker or company name
    const { data: results, error } = await supabaseAdmin
      .from('stock_metadata')
      .select('ticker, company_name, exchange, sector, industry')
      .or(`ticker.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
      .order('ticker')
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      results: results || []
    });

  } catch (error) {
    console.error('Error searching stocks:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
