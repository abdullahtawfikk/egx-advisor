# EGX Advisor — Deployment Guide

## What's built
A full-stack Next.js app hosted on Vercel + Supabase that gives BUY/HOLD/SELL signals for all 30 EGX30 stocks with TA, news sentiment, stop-loss/take-profit levels, and bilingual AR/EN output.

## One-command deploy (Windows)

1. Open the `egx-advisor` folder in Windows Explorer
2. Right-click `deploy.ps1` → **Run with PowerShell**
3. If prompted, log into your Vercel account
4. Done — the URL is printed at the end

## Manual deploy (any OS)

```bash
# 1. Open terminal in this folder
cd egx-advisor

# 2. Install packages
npm install --legacy-peer-deps

# 3. Deploy (creates a new Vercel project called egx-advisor)
npx vercel deploy --prod --yes --name egx-advisor
```

## After deploy — add Env Vars in Vercel dashboard

Go to: https://vercel.com/dashboard → your egx-advisor project → Settings → Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://imucwryjgdvpgmwepxqs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(copy from .env file)* |
| `CRON_SECRET` | `egx-advisor-cron-2026` |

Then redeploy once for the env vars to take effect.

## First data run

After deployment, trigger the first pipeline pass by visiting:
```
https://your-app.vercel.app/api/cron/prices
```
This fetches live EGX30 prices from Yahoo Finance, computes TA signals, and populates the dashboard. Takes ~60 seconds. Refresh the homepage after.

## Cron schedule (auto-runs on Vercel)

| Cairo Time | Job |
|---|---|
| Every 5 min, Sun–Thu 10:00–14:30 | Price + TA refresh |
| Every 15 min, Sun–Thu | News refresh |
| Pre-open 07:00 | Overnight price check |
| Post-close 12:30 UTC | End-of-day digest |

## Architecture

```
Browser ──► Vercel (Next.js)
                ├─ /api/recommendations?symbol=COMI.CA  ← live TA on demand
                ├─ /api/cron/prices  ← cron: Yahoo Finance → Supabase
                └─ /api/cron/news    ← cron: RSS feeds → Supabase

Supabase (Postgres)
  ├─ tickers        (30 EGX30 stocks seeded ✓)
  ├─ ohlcv          (price history)
  ├─ recommendations (BUY/HOLD/SELL cards)
  ├─ news_items     (tagged, sentiment-scored)
  └─ fundamentals   (P/E, P/B, ROE…)
```

## Disclaimer

Educational tool only — not financial advice. EGX is volatile. Always verify with your broker.
