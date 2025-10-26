#!/usr/bin/env node

/**
 * Test Telegram posting
 * Actually posts a test message to your free channel
 */

import 'dotenv/config';
import { TelegramPoster } from '../lib/telegram-poster.js';
import { formatDailyWatch } from '../lib/message-formatter.js';
import { supabaseAdmin } from '../lib/supabase.js';

async function testTelegramPost() {
  console.log('🧪 Testing Telegram Posting\n');

  // 1. Test connection
  console.log('1️⃣ Testing Telegram connection...');
  const poster = new TelegramPoster();
  const connectionTest = await poster.testConnection();

  if (!connectionTest.success) {
    console.error('❌ Connection failed:', connectionTest.error);
    process.exit(1);
  }

  console.log('✅ Connected to Telegram bot:', connectionTest.bot.username);
  console.log('   Bot name:', connectionTest.bot.first_name);
  console.log('');

  // 2. Fetch real data from database
  console.log('2️⃣ Fetching trades from database (last 24h)...');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setHours(yesterday.getHours() - 24);
  const cutoffDate = yesterday.toISOString();

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

  console.log(`   Found ${topBuys.length} buys, ${clusters.length} clusters, ${topSales.length} sales`);
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
  console.log('⚠️  This will POST to your Telegram channel:', process.env.FREE_CHAT_ID);
  console.log('');
  console.log('Type "yes" to continue or anything else to cancel:');

  // Wait for user input
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

testTelegramPost();
