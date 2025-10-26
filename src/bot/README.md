# Telegram Bot for CEO Buying

This bot manages premium memberships for the CEO Buying Telegram channels.

## Features

- **Free Channel Access** - Anyone can join the free channel for daily updates
- **Premium Verification** - Subscribers verify their email to get premium access
- **Auto-Approval** - Automatically approve join requests for verified premium members
- **Subscription Management** - Check status, cancel, update billing via Stripe
- **Privacy Controls** - Users can delete their data with `/delete` command

## Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow prompts
3. Copy the bot token and add to `.env`:
   ```
   TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 2. Create Channels

Create two Telegram channels:

1. **Free Channel** - Public updates (e.g., @ceobuying_free)
2. **Premium Channel** - Premium subscribers only (e.g., @ceobuying_premium)

For premium channel:
- Set it to **Private**
- Enable **"Approve New Members"** in channel settings
- Add your bot as an **Administrator** with permission to approve join requests

Add channel IDs to `.env`:
```
PREMIUM_CHAT_ID=@ceobuying_premium
FREE_CHAT_ID=@ceobuying_free
```

### 3. Configure Environment Variables

Update `.env` with all required variables:

```env
# Telegram Bot
TELEGRAM_TOKEN=your_bot_token_from_botfather
PREMIUM_CHAT_ID=@your_premium_channel
FREE_CHAT_ID=@your_free_channel
STRIPE_PORTAL_URL=https://billing.stripe.com/p/login/your_portal_url
SUPPORT_EMAIL=contact@ceobuying.com
```

### 4. Set Up Database (TODO)

The current bot has stub functions that need to be connected to your database:

- `findMember({ email, userId })` - Look up subscriber by email or Telegram user ID
- `upsertMember({ email, userId })` - Link Telegram user to email/subscription
- `markDeleted(userId)` - Delete/anonymize user data
- `isActive(userId)` - Check if user has active subscription
- `listExpiredUserIds()` - Get list of expired subscriptions for cleanup

**Implementation Options:**

1. **Supabase** (Recommended - already in use)
   - Create a `telegram_members` table with columns: `user_id`, `email`, `status`, `expires_at`, `plan`
   - Update via Stripe webhooks or manual API

2. **Stripe + Metadata**
   - Store Telegram user ID in Stripe customer metadata
   - Query Stripe API to check subscription status

### 5. Set Up Stripe Webhooks (Optional)

To automatically update member status when subscriptions are created/canceled:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Update database when events occur

## Running the Bot

### Local Development
```bash
npm run bot:start
```

### Production

The bot needs to run continuously. Options:

1. **Separate Process on Server**
   ```bash
   # Using PM2 (recommended)
   pm2 start src/bot/bot.js --name ceobuying-bot
   pm2 save
   pm2 startup
   ```

2. **Docker Container**
   ```dockerfile
   FROM node:20
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   CMD ["npm", "run", "bot:start"]
   ```

3. **Railway/Render** (Easy deployment)
   - Deploy bot as separate service
   - Set environment variables in platform dashboard
   - Bot will auto-restart if it crashes

**Note:** The bot runs independently from your Next.js web app. Don't run it on Vercel as serverless functions - it needs to be a long-running process.

## Bot Commands

Users can interact with the bot via these commands:

- `/start` - Welcome message with overview
- `/help` - List of available commands
- `/verify <email>` - Verify premium subscription
- `/join` - Get link to join premium channel
- `/status` - Check subscription status
- `/free` - Get link to free channel
- `/premium` - Learn about premium benefits
- `/alerts` - View posting schedule (UTC times)
- `/privacy` - Privacy policy summary
- `/delete` - Delete user data and revoke access

## Scheduled Cleanup (via Skedbit)

The bot exports a `cleanupExpired()` function to remove expired members from the premium channel.

**Important:** This runs via **Skedbit** (Supabase scheduled functions), NOT Vercel cron.

### Setup Skedbit Cron

1. In your Supabase project, create a new Edge Function:
   ```typescript
   // supabase/functions/cleanup-expired-members/index.ts
   import { cleanupExpired } from './bot.js'

   Deno.serve(async (req) => {
     const count = await cleanupExpired()
     return new Response(JSON.stringify({ removed: count }))
   })
   ```

2. Schedule it in Supabase:
   ```sql
   -- Run daily at 2 AM UTC
   SELECT cron.schedule(
     'cleanup-expired-members',
     '0 2 * * *',
     $$
     SELECT net.http_post(
       url := 'https://your-project.supabase.co/functions/v1/cleanup-expired-members',
       headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     );
     $$
   );
   ```

Alternatively, trigger it manually:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-expired-members \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Testing

1. Start the bot: `npm run bot:start`
2. Message your bot on Telegram
3. Try `/start` and `/help` commands
4. Test verification flow:
   - Add a test email to your database with `status: 'active'`
   - Send `/verify test@example.com`
   - Send `/join` and request to join premium channel
   - Bot should auto-approve if verification succeeded

## Security Notes

- Never commit `.env` file with real tokens
- Use environment variables in production
- Validate email addresses before linking to Telegram accounts
- Rate limit verification attempts to prevent abuse
- Log all verification attempts for audit trail

## Troubleshooting

**Bot doesn't respond:**
- Check `TELEGRAM_TOKEN` is correct
- Ensure bot is running (`npm run bot:start` shows "ceobuying_bot live")
- Check for errors in console output

**Auto-approval not working:**
- Verify bot is admin in premium channel
- Check "Approve New Members" is enabled
- Ensure `PREMIUM_CHAT_ID` matches your channel
- Verify user has `status: 'active'` in database

**Channel ID issues:**
- Public channels: use `@channelname` format
- Private channels: use numeric ID like `-1001234567890`
- Get numeric ID: Forward a message from channel to [@userinfobot](https://t.me/userinfobot)

## Next Steps

1. ✅ Bot code created
2. ✅ Dependencies installed
3. ✅ Environment variables defined
4. ⏳ Create database schema for members
5. ⏳ Implement database functions
6. ⏳ Set up Stripe webhooks
7. ⏳ Deploy bot to production server
8. ⏳ Configure Skedbit cron for cleanup
9. ⏳ Test end-to-end flow
