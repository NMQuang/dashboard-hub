---
name: deploy-vercel
description: >
  Deploy the dashboard to Vercel, configure env vars, set up cron jobs, or
  troubleshoot build errors. Triggered when the user asks to "deploy", "push to Vercel",
  "set up production", "configure environment", "fix build error", or "add cron job".
---

# Skill: Deploy to Vercel

## Pre-deploy checklist
- [ ] All API keys added to `.env.local` and tested locally
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes
- [ ] No `console.log` in production code
- [ ] `.env.local` is in `.gitignore` ✅ (already configured)
- [ ] `vercel.json` is correct (region: `sin1` for Japan/VN proximity)

## Deploy commands
```bash
# First time
npm i -g vercel
vercel login
vercel        # follow prompts → links to Vercel project

# Subsequent deploys
vercel        # preview deploy
vercel --prod # production deploy
```

## Environment variables — add ALL of these in Vercel Dashboard
```
Project → Settings → Environment Variables → Add

# Required for AI chat
ANTHROPIC_API_KEY
OPENAI_API_KEY
GEMINI_API_KEY

# Required for market data
GOLD_API_KEY
COINGECKO_API_KEY      (optional — free tier works without)

# Required for GitHub
GITHUB_TOKEN
GITHUB_USERNAME

# Required for Dify
DIFY_API_KEY
DIFY_BASE_URL
DIFY_WORKFLOW_ID
DIFY_ALERT_WORKFLOW_ID  (optional)

# Optional
WEATHER_API_KEY

# Public (safe to expose)
NEXT_PUBLIC_ONSITE_DATE=2025-07-01
NEXT_PUBLIC_GITHUB_USERNAME=your-handle
NEXT_PUBLIC_APP_NAME=dashboard-hub.hq
```

## Common build errors and fixes

### Error: `Module not found: 'some-package'`
```bash
npm install some-package
git add package.json package-lock.json
git commit -m "chore: add missing dependency"
```

### Error: `Type error: Property X does not exist on type Y`
- Check `types/index.ts` — add missing field
- Or use optional chaining: `data?.field`

### Error: `API key is not defined`
- The env var is not set in Vercel
- Go to Project → Settings → Environment Variables → Add it

### Error: `fetch failed` on API route
- Check if external API is reachable (goldapi.io, coingecko.com)
- Add fallback/mock data for when API is down

## Vercel cron setup
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/market-brief",
      "schedule": "0 22 * * *"
    }
  ]
}
```
Note: `0 22 * * *` UTC = 7:00 AM JST (UTC+9).
For HCMC (UTC+7): use `0 0 * * *` (7:00 AM ICT).

## Custom domain (optional)
1. Vercel Dashboard → Project → Settings → Domains
2. Add `dashboard.yourdomain.com`
3. Update DNS: CNAME → `cname.vercel-dns.com`

## Redeploy after env var changes
Vercel auto-redeploys when env vars change — or trigger manually:
```bash
vercel --prod --force
```
