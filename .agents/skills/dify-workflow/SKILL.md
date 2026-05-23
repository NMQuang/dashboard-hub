---
name: dify-workflow
description: >
  Build or configure Dify AI workflow integrations: daily market reports, price alerts,
  Japanese study tips, automated summaries. Triggered when the user mentions "Dify",
  "daily report", "automated alert", "workflow", "trigger Dify", or "build an alert bot".
---

# Skill: Dify Workflow Integration

## Architecture
```
Vercel Cron / manual trigger
  → /api/dify (POST { action: 'trigger', workflowId, inputs })
  → services/dify.ts → api.dify.ai/v1/workflows/run
  → Dify executes: fetch prices → AI generates report → (optional) send notification
  → Response saved to display in /invest/alerts
```

## Dify API (already implemented in services/dify.ts)
```ts
// Trigger a workflow
POST /api/dify
{ action: 'trigger', workflowId: 'wf_xxx', inputs: { symbol: 'BTC', ... } }

// Get run result
POST /api/dify
{ action: 'run', workflowId: 'run_id_xxx' }

// Chat with a Dify app
POST /api/dify
{ action: 'chat', message: '今日の金相場は？', conversationId?: 'conv_xxx' }
```

## Recommended Dify workflow: Daily Market Brief

### Workflow inputs
```json
{ "date": "2025-06-01", "symbols": ["XAU", "BTC", "ETH", "JPY"] }
```

### Workflow steps (build in Dify UI)
1. **HTTP node** → GET `https://www.goldapi.io/api/XAU/USD` (gold price)
2. **HTTP node** → GET CoinGecko for BTC, ETH prices
3. **HTTP node** → GET exchange rate USD/JPY
4. **LLM node** → Prompt:
   ```
   以下の市場データを元に、日本語と英語でデイリーマーケットブリーフを作成してください。
   Gold: {{gold_price}} ({{gold_change}}%)
   BTC: {{btc_price}} ({{btc_change}}%)
   ETH: {{eth_price}} ({{eth_change}}%)
   USD/JPY: {{jpy_rate}}
   簡潔に、重要なポイントと今日の見通しを含めてください。
   ```
5. **End node** → output: `{ "brief": "...", "date": "..." }`

## Vercel Cron setup (daily 7 AM JST)
Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/market-brief", "schedule": "0 22 * * *" }
  ]
}
```
Create `app/api/cron/market-brief/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'

export async function GET() {
  const result = await triggerWorkflow(process.env.DIFY_WORKFLOW_ID!, {
    date: new Date().toISOString().split('T')[0],
    symbols: ['XAU', 'BTC', 'ETH'],
  })
  // Save result to DB or KV store
  return NextResponse.json(result)
}
```

## Price alert workflow
Trigger condition: price moves ±1.5% from last check
```ts
// Check every 30 min via cron
if (Math.abs(currentPrice - lastPrice) / lastPrice > 0.015) {
  await triggerWorkflow(ALERT_WORKFLOW_ID, { symbol, currentPrice, change })
}
```

## Saving reports (Vercel KV / localStorage fallback)
```ts
// Simple: save to localStorage via client
const reports = JSON.parse(localStorage.getItem('dify-reports') || '[]')
reports.unshift({ date, brief, createdAt: new Date().toISOString() })
localStorage.setItem('dify-reports', JSON.stringify(reports.slice(0, 30)))
```

## .env additions needed
```
DIFY_API_KEY=app-xxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=wf-xxxxxxxxxxxx    # daily market brief workflow ID
DIFY_ALERT_WORKFLOW_ID=wf-xxxxxxxxx # price alert workflow ID
```
