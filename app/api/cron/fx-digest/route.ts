/**
 * Cron: JPY/VND Weekly FX Digest
 * Schedule: 0 0 * * 1  (00:00 UTC Monday = 09:00 JST Monday = 07:00 ICT Monday)
 *
 * Fetches week's JPY and VND rates, sends a weekly summary via Dify.
 *
 * Required env vars:
 *   DIFY_API_KEY, DIFY_FX_DIGEST_WORKFLOW_ID
 */
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'
import { fetchForex } from '@/services/market'
import { saveAlert } from '@/lib/alert-store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflowId = process.env.DIFY_FX_DIGEST_WORKFLOW_ID
  if (!workflowId) {
    return NextResponse.json({ error: 'DIFY_FX_DIGEST_WORKFLOW_ID not set' }, { status: 500 })
  }

  try {
    const forex = await fetchForex()
    const jpy = forex.find(f => f.symbol === 'JPY')
    const vnd = forex.find(f => f.symbol === 'VND')

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

    const result = await triggerWorkflow(workflowId, {
      week: weekLabel,
      recipient_email: process.env.RECIPIENT_EMAIL ?? '',
      jpy_rate: jpy?.price?.toFixed(2) ?? 'N/A',
      vnd_rate: vnd?.price?.toFixed(0) ?? 'N/A',
      triggered_at: now.toLocaleString('en-GB', { timeZone: 'Asia/Tokyo' }) + ' JST',
    })

    await saveAlert({
      action: 'fx-digest',
      title: `FX Weekly Digest · ${weekLabel}`,
      summary: `USD/JPY ¥${jpy?.price?.toFixed(2)} · USD/VND ₫${vnd?.price?.toFixed(0)}`,
      triggeredAt: now.toISOString(),
      emailSent: true,
      runId: result.run_id,
      outputs: result.data?.outputs,
    })

    return NextResponse.json({ success: true, run_id: result.run_id })
  } catch (e) {
    console.error('[cron/fx-digest]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
