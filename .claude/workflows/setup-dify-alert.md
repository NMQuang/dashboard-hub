# Set Up Dify Daily Alert

Configure a Dify workflow to send daily market briefs to the dashboard.

## Steps

1. Ask: "Do you have a Dify account set up? What is your DIFY_API_KEY?"
   If not: guide to https://app.dify.ai → Create account → Create new app (Workflow type)

2. Walk through creating the Dify workflow (user does this in Dify UI):
   ```
   Workflow name: "Daily Market Brief"
   Inputs: date (text), symbols (text)

   Nodes:
   1. HTTP Request → GET goldapi.io/api/XAU/USD
      Header: x-access-token = {env.GOLD_API_KEY}

   2. HTTP Request → GET CoinGecko simple/price
      Params: ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true

   3. HTTP Request → GET open.er-api.com/v6/latest/USD

   4. LLM (Claude/GPT) → Generate brief
      System: "You are a financial analyst. Create concise bilingual (EN+JA) daily brief."
      User: "Date: {{date}}\nGold: ${{gold}}\nBTC: ${{btc}}\nETH: ${{eth}}\nUSD/JPY: ¥{{jpy}}"

   5. End → output: text (the brief)
   ```

3. After creating: copy the Workflow ID from Dify URL.

4. Add to `.env.local`:
   ```
   DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
   DIFY_WORKFLOW_ID=wf-xxxxxxxxxxxxxxxx
   ```

5. Add Vercel cron to `vercel.json`:
   ```json
   "crons": [{ "path": "/api/cron/market-brief", "schedule": "0 22 * * *" }]
   ```
   Note: 22:00 UTC = 07:00 JST (Japan), 05:00 ICT (Vietnam)

6. Create the cron API route `app/api/cron/market-brief/route.ts`:
   ```ts
   import { NextResponse } from 'next/server'
   import { triggerWorkflow } from '@/services/dify'

   export async function GET() {
     const result = await triggerWorkflow(process.env.DIFY_WORKFLOW_ID!, {
       date: new Date().toLocaleDateString('ja-JP'),
       symbols: 'XAU,BTC,ETH,SOL',
     })
     return NextResponse.json({ success: true, runId: result.run_id })
   }
   ```

7. Update `app/invest/alerts/page.tsx` to fetch and display reports from the cron.

8. Redeploy to Vercel:
   ```bash
   vercel --prod
   ```

9. Test manually: `curl https://your-app.vercel.app/api/cron/market-brief`

10. Confirm: "Dify daily brief is configured. It will run at 07:00 JST every day."
