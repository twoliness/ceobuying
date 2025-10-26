#!/usr/bin/env node

/**
 * Test Telegram posting with flexible timeframe
 * Use this when you want to test with older data
 */

import 'dotenv/config';
import { TelegramPoster } from '../lib/telegram-poster.js';
import { formatDailyWatch } from '../lib/message-formatter.js';
import { supabaseAdmin } from '../lib/supabase.js';

async function testWithTimeframe(days = 7) {
  console.log(`🧪 Testing Telegram Posting (Last ${days} days)\n`);

  // 1. Test connection
  console.log('1️⃣ Testing Telegram connection...');
  const poster = new TelegramPoster();
  const connectionTest = await poster.testConnection();

  if (!connectionTest.success) {
    console.error('❌ Connection failed:', connectionTest.error);
    process.exit(1);
  }

  console.log('✅ Connected to Telegram bot:', connectionTest.bot.username);
  console.log('');

  // 2. Fetch data with flexible timeframe
  console.log(`2️⃣ Fetching trades from database (last ${days} days)...`);

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString();

  const { data: topBuys, error: buysError } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'P')
    .gte('filing_date', cutoffDate)
    .order('transaction_value', { ascending: false })
    .limit(5);

  if (buysError) {
    console.error('❌ Error fetching buys:', buysError);
    process.exit(1);
  }

  const { data: clusters, error: clustersError } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'P')
    .eq('is_cluster_buy', true)
    .gte('filing_date', cutoffDate)
    .gte('cluster_count', 2)
    .order('transaction_value', { ascending: false })
    .limit(10);

  if (clustersError) {
    console.error('❌ Error fetching clusters:', clustersError);
    process.exit(1);
  }

  const { data: topSales, error: salesError } = await supabaseAdmin
    .from('insider_trades')
    .select('*')
    .eq('transaction_type', 'S')
    .gte('filing_date', cutoffDate)
    .order('transaction_value', { ascending: false })
    .limit(3);

  if (salesError) {
    console.error('❌ Error fetching sales:', salesError);
    process.exit(1);
  }

  console.log(`   ✓ ${topBuys.length} buys, ${clusters.length} clusters, ${topSales.length} sales`);

  if (topBuys.length === 0 && clusters.length === 0 && topSales.length === 0) {
    console.log('\n⚠️  No trades found! Options:');
    console.log('   1. Run scraper: npm run test:scraper');
    console.log('   2. Try longer timeframe: node src/scripts/test-telegram-with-data.js 30');
    process.exit(0);
  }

  console.log('');

  // 3. Format message
  console.log('3️⃣ Formatting message...');
  const message = formatDailyWatch({ topBuys, clusters, topSales });
  console.log(`   Message length: ${message.length} characters`);
  console.log('');

  // 4. Preview message
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 MESSAGE PREVIEW:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(message);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 5. Ask for confirmation
  console.log('⚠️  This will POST to:', process.env.FREE_CHAT_ID);
  console.log('\nType "yes" to post or anything else to cancel:');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('> ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cancelled. No message sent.');
      process.exit(0);
    }

    // 6. Send to Telegram
    console.log('\n4️⃣ Posting to Telegram...');
    try {
      const result = await poster.sendToFreeChannel(message);
      console.log('✅ Successfully posted!');
      console.log('   Message ID:', result.message_id);
      console.log('   Channel:', process.env.FREE_CHAT_ID);
      console.log('\n🎉 Check your Telegram channel!');
    } catch (error) {
      console.error('❌ Failed to post:', error.message);
      process.exit(1);
    }
  });
}

// Get days from command line arg or default to 7
const days = parseInt(process.argv[2]) || 7;
testWithTimeframe(days);
