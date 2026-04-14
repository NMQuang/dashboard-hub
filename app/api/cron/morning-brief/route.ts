/**
 * Cron: Morning Market Brief
 * Schedule: 0 22 * * *  (22:00 UTC = 07:00 JST = 05:00 ICT/Vietnam)
 *
 * Fetches live market data, triggers the Dify "Morning Brief" workflow,
 * which generates a bilingual (EN+VI/JA) summary and sends Gmail.
 *
 * Required env vars:
 *   DIFY_MORNING_BRIEF_API_KEY, DIFY_MORNING_BRIEF_WORKFLOW_ID
 */
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'
import { fetchMarketSnapshot } from '@/services/market'
import { DEFAULT_WATCHLIST } from '@/lib/constants'
import { saveAlert } from '@/lib/alert-store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Protect cron endpoint from public access
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflowId = process.env.DIFY_MORNING_BRIEF_WORKFLOW_ID
  if (!workflowId) {
    return NextResponse.json({ error: 'DIFY_MORNING_BRIEF_WORKFLOW_ID not set' }, { status: 500 })
  }

  try {
    const snapshot = await fetchMarketSnapshot(DEFAULT_WATCHLIST)
    const now = new Date()
    const date = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const result = await triggerWorkflow(workflowId, {
      date,
      recipient_email: process.env.RECIPIENT_EMAIL ?? '',
      email_subject: `📊 Morning Market Brief – ${date}`,
      gold_price: snapshot.gold?.price?.toFixed(2) ?? 'N/A',
      gold_change: snapshot.gold?.change24h?.toFixed(2) ?? '0',
      btc_price: snapshot.coins?.find(c => c.symbol === 'BTC')?.price?.toFixed(0) ?? 'N/A',
      btc_change: snapshot.coins?.find(c => c.symbol === 'BTC')?.change24h?.toFixed(2) ?? '0',
      eth_price: snapshot.coins?.find(c => c.symbol === 'ETH')?.price?.toFixed(0) ?? 'N/A',
      eth_change: snapshot.coins?.find(c => c.symbol === 'ETH')?.change24h?.toFixed(2) ?? '0',
      fet_price: snapshot.coins?.find(c => c.symbol === 'FET')?.price?.toFixed(4) ?? 'N/A',
      jpy_rate: snapshot.forex?.find(f => f.symbol === 'JPY')?.price?.toFixed(2) ?? 'N/A',
      vnd_rate: snapshot.forex?.find(f => f.symbol === 'VND')?.price?.toFixed(0) ?? 'N/A',
    }, process.env.DIFY_MORNING_BRIEF_API_KEY)

    console.log('[cron/morning-brief] Dify result:', JSON.stringify(result, null, 2))

    await saveAlert({
      action: 'morning-brief',
      title: `Morning Brief · ${date}`,
      summary: `Triggered Dify workflow. Gold: $${snapshot.gold?.price?.toFixed(2)}, BTC: $${snapshot.coins?.find(c => c.symbol === 'BTC')?.price?.toFixed(0)}`,
      triggeredAt: now.toISOString(),
      emailSent: true,
      runId: result.run_id || result.workflow_run_id,
      outputs: result.data?.outputs || result.outputs,
    })

    return NextResponse.json({ success: true, run_id: result.run_id || result.workflow_run_id })
  } catch (e) {
    console.error('[cron/morning-brief]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
