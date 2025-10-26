// bot.js
// npm i telegraf node-fetch
import 'dotenv/config';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';

// === ENV ===
// TELEGRAM_TOKEN=xxx
// PREMIUM_CHAT_ID=@your_premium_channel OR -100123456789
// FREE_CHAT_ID=@your_free_channel
// STRIPE_PORTAL_URL=https://billing.stripe.com/p/...
// SUPPORT_EMAIL=contact@ceobuying.com

const {
  TELEGRAM_TOKEN,
  PREMIUM_CHAT_ID,
  FREE_CHAT_ID,
  STRIPE_PORTAL_URL,
  SUPPORT_EMAIL
} = process.env;

const bot = new Telegraf(TELEGRAM_TOKEN);

// ----------------------
// Storage / Whitelist stubs (replace with your DB)
// ----------------------
/** Look up by email or telegram user id */
async function findMember({ email, userId }) {
  // return { email, userId, status: 'active'|'expired'|'none', expires_at: '2025-01-01', plan:'premium' }
  return null;
}
async function upsertMember({ email, userId }) {
  // create or update record to attach userId to email
  return { email, userId, status: 'active' };
}
async function markDeleted(userId) {
  // anonymize/delete user rows; also queue channel removal if needed
  return true;
}
async function isActive(userId) {
  const row = await findMember({ userId });
  return row && row.status === 'active';
}
async function listExpiredUserIds() {
  // return array of userIds whose status is expired
  return [];
}

// ----------------------
// Premium Channel Gate helpers
// ----------------------
async function approveJoinRequest(chatId, userId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/approveChatJoinRequest`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ chat_id: chatId, user_id: userId })
  });
}
async function declineJoinRequest(chatId, userId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/declineChatJoinRequest`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ chat_id: chatId, user_id: userId })
  });
}
async function kickFromPremium(userId) {
  // Optional scheduled cleanup when subscriptions expire
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/banChatMember`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ chat_id: PREMIUM_CHAT_ID, user_id: userId })
  });
}

// ----------------------
// Commands
// ----------------------
bot.start(async (ctx) => {
  await ctx.reply(
`Welcome to CEOBuying 👋

Free: quick Daily Watch.
Premium: AI-edited brief with clusters & notable changes.

• To verify premium:  /verify your@email
• Premium info:       /premium
• Join premium:       /join
• Schedule (UTC):     /alerts

Not financial advice.`
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
`What I can do:
/verify <email>  – verify premium
/join            – premium access steps
/status          – subscription status
/free            – link to free channel
/premium         – what's in premium
/alerts          – posting schedule (UTC)
/privacy         – privacy policy
/delete          – delete my data`
  );
});

bot.command('free', (ctx) => ctx.reply(`Free channel:\n${FREE_CHAT_ID}`));

bot.command('premium', (ctx) =>
  ctx.reply(
`Premium includes:
• AI-edited Daily Watch (6 highlights)
• Cluster & role-weighted context
• Notable changes vs. yesterday
• Automated posts 3× daily (UTC-aligned)

To upgrade, subscribe then run /verify <email>.`
  )
);

bot.command('alerts', (ctx) =>
  ctx.reply(
`Posting Schedule (UTC)
• 03:30 – post-market scan
• 08:00 – overnight update
• 14:00 – U.S. market open pulse

Times may shift slightly as activity patterns change.`
  )
);

bot.command('privacy', (ctx) =>
  ctx.reply(
`Privacy: we store your Telegram ID/username and email for access control. Billing handled by Stripe. Delete anytime with /delete or email ${SUPPORT_EMAIL}.`
  )
);

bot.command('status', async (ctx) => {
  const row = await findMember({ userId: ctx.from.id });
  if (!row) return ctx.reply(`Status: not verified.\nUse /verify <email> (same email used at checkout).`);
  return ctx.reply(
`Status: ${row.status || 'unknown'}
Plan: ${row.plan || '—'}
Renews/Expires: ${row.expires_at || '—'}`
  );
});

// /verify email@example.com
bot.hears(/^\/verify\s+(.+)$/i, async (ctx) => {
  const email = ctx.match[1].trim().toLowerCase();
  // look up whitelist (you update via Stripe webhook/Zap)
  const record = await findMember({ email });
  if (!record) {
    return ctx.reply(
`We couldn't find that email on the premium list.
If you already paid, reply with your receipt.
Otherwise, subscribe here:
${STRIPE_PORTAL_URL || 'https://your-stripe-link'}`
    );
  }
  // attach Telegram user to the record
  await upsertMember({ email, userId: ctx.from.id });
  return ctx.reply(
`✅ Verified!
Next step: /join to access the premium channel.
If you get "Request to Join", we'll auto-approve within seconds.`
  );
});

bot.command('join', async (ctx) => {
  return ctx.reply(
`Premium access:
1) Tap this link: ${PREMIUM_CHAT_ID}
2) Request to Join
3) We'll auto-approve verified members.

If not verified yet, use:
/verify your@email`
  );
});

bot.command('delete', async (ctx) => {
  await markDeleted(ctx.from.id);
  try { await kickFromPremium(ctx.from.id); } catch {}
  return ctx.reply(`Your data was queued for deletion and access will be revoked. If you need help: ${SUPPORT_EMAIL}`);
});

// ----------------------
// Join-request gate (auto-approve only if active)
// ----------------------
bot.on('chat_join_request', async (ctx) => {
  const req = ctx.update.chat_join_request;
  const userId = req.from.id;
  const chatId = req.chat.id; // should be PREMIUM_CHAT_ID
  const ok = await isActive(userId);
  if (ok) {
    await approveJoinRequest(chatId, userId);
    try { await bot.telegram.sendMessage(userId, `✅ Approved. Welcome to Premium.`); } catch {}
  } else {
    await declineJoinRequest(chatId, userId);
    try { await bot.telegram.sendMessage(userId, `We couldn't verify premium for this account. Use /verify <email> or subscribe: ${STRIPE_PORTAL_URL || ''}`); } catch {}
  }
});

// ----------------------
// (Optional) nightly cleanup task you can call via cron
// ----------------------
export async function cleanupExpired() {
  const ids = await listExpiredUserIds();
  await Promise.all(ids.map(kickFromPremium));
  return ids.length;
}

// ----------------------
bot.launch().then(() => console.log('ceobuying_bot live'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
