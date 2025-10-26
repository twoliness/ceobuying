import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Delete trades with invalid tickers (NONE, NULL, empty, etc.)
 * These are typically private companies that shouldn't be in our public stock tracker
 */
async function cleanupInvalidTickers() {
  console.log('🧹 Cleaning up trades with invalid tickers...\n');

  try {
    // First, check what we're about to delete
    const { data: invalidTrades, error: selectError } = await supabaseAdmin
      .from('insider_trades')
      .select('id, ticker, company_name, filing_date, transaction_value')
      .or('ticker.is.null,ticker.eq.NONE,ticker.eq.,ticker.eq.N/A,ticker.eq.NA,ticker.eq.NULL');

    if (selectError) {
      console.error('❌ Error fetching invalid trades:', selectError);
      return;
    }

    if (!invalidTrades || invalidTrades.length === 0) {
      console.log('✅ No invalid ticker trades found. Database is clean!');
      return;
    }

    console.log(`Found ${invalidTrades.length} trades with invalid tickers:\n`);
    invalidTrades.forEach(trade => {
      console.log(`  - ${trade.company_name} (${trade.ticker || 'NULL'}): $${parseFloat(trade.transaction_value).toLocaleString()} on ${trade.filing_date}`);
    });

    console.log('\n🗑️  Deleting these trades...');

    // Delete them
    const { error: deleteError } = await supabaseAdmin
      .from('insider_trades')
      .delete()
      .or('ticker.is.null,ticker.eq.NONE,ticker.eq.,ticker.eq.N/A,ticker.eq.NA,ticker.eq.NULL');

    if (deleteError) {
      console.error('❌ Error deleting trades:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${invalidTrades.length} trades with invalid tickers`);
    console.log('\n📋 Summary of deleted companies:');

    const companySummary = {};
    invalidTrades.forEach(trade => {
      const name = trade.company_name;
      if (!companySummary[name]) {
        companySummary[name] = { count: 0, ticker: trade.ticker || 'NULL' };
      }
      companySummary[name].count++;
    });

    Object.entries(companySummary).forEach(([company, info]) => {
      console.log(`  - ${company} (${info.ticker}): ${info.count} trade(s)`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanupInvalidTickers();
