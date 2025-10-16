InsiderPulse MVP - Simple PRD
What We're Building
A daily insider trading tracker with AI insights. Landing page shows trades, Telegram bot delivers AI summaries.

Target Market

OpenInsider gets ~220K visits/month - we want 5% (11K users) in Year 1
Audience: 77% male, age 25-34, retail investors
Gap: 97% desktop usage = mobile opportunity


Core Features
Landing Page (insiderpulse.com)

Top 5 hero cards - Big trades, scannable
3 grouped tables:

🔥 Cluster Buys (multiple insiders, same stock)
📈 Insider Buys (>$500k)
📉 Insider Sales (>$100k)


Columns: Filing Date, Trade Date, Ticker, Company, Insider, Title, Type (P/S), Price, Qty, Owned, ΔOwn, Value
Updates: 5:30pm ET daily
CTA: "Join Telegram for AI Insights"

Telegram Bot (@InsiderPulseBot)

Daily push at 5:30pm ET
Top 20 trades with:

Company + Ticker
Current price + 7-day % change
AI summary: "Bullish buy at 52-week low" or "Cluster of 3 buys this week"


Commands: /start, /today, /help, /stop


Tech Stack
ComponentToolBackendNode.js + ExpressDatabasePostgreSQL (Supabase)FrontendNext.js 14 + TailwindBotnode-telegram-bot-apiHostingVercel + Railway (free tiers)APIsSEC EDGAR, Yahoo Finance, Claude

Data Flow
SEC EDGAR (5pm ET) 
  → Parse Form 4 XML 
  → Filter buys >$500k 
  → Enrich with stock price 
  → Generate AI summaries 
  → Store in DB 
  → Publish to landing page + Telegram

Success Metrics
Week 1:

100 Telegram subscribers
500 landing page visits

Month 1:

1,000 Telegram subscribers
10,000 landing page visits
50% daily open rate

Month 3:

5,000 subscribers
Product-market fit signal


Timeline

Days 1-2: Build SEC scraper
Days 3-4: Build landing page
Days 5-6: Build Telegram bot
Day 7: Test everything
Day 8: Launch 🚀


Budget

Domain: $12/year
Claude API: $10/month (1K users)
Hosting: Free
Total: ~$10/month


What's NOT in MVP
❌ Search/filtering
❌ User accounts
❌ Email newsletter
❌ Historical data
❌ Custom alerts
❌ Premium features

Key Decisions
✅ Casual AI tone (not formal)
✅ $500k minimum trade size
✅ Telegram (not email) for daily push
✅ Show both buys AND sales
✅ ET timezone only