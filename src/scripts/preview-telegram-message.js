#!/usr/bin/env node

/**
 * Preview Telegram message (no network required)
 * Just shows what would be posted
 */

import 'dotenv/config';
import { formatDailyWatch } from '../lib/message-formatter.js';
import { supabaseAdmin } from '../lib/supabase.js';

async function previewMessage(days = 7) {
  console.log(`📱 Previewing Telegram Message (Last ${days} days)\n`);

  // Fetch data
  console.log('Fetching trades from database...');

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString();

  const { data: topBuys } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'P')
    .gte('filing_date', cutoffDate)
    .order('transaction_value', { ascending: false })
    .limit(5);

  const { data: clusters } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'P')
    .eq('is_cluster_buy', true)
    .gte('filing_date', cutoffDate)
    .gte('cluster_count', 2)
    .order('transaction_value', { ascending: false })
    .limit(10);

  const { data: topSales } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'S')
    .gte('filing_date', cutoffDate)
    .order('transaction_value', { ascending: false })
    .limit(3);

  console.log(`✓ Found ${topBuys?.length || 0} buys, ${clusters?.length || 0} clusters, ${topSales?.length || 0} sales\n`);

  if (!topBuys?.length && !clusters?.length && !topSales?.length) {
    console.log('⚠️  No trades found!');
    process.exit(0);
  }

  // Format message
  const message = formatDailyWatch({
    topBuys: topBuys || [],
    clusters: clusters || [],
    topSales: topSales || []
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 MESSAGE PREVIEW:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(message);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n✅ Message length: ${message.length} characters`);
  console.log('💡 To actually post, use: npm run test:telegram:7d\n');
}

const days = parseInt(process.argv[2]) || 7;
previewMessage(days);
