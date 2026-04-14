/**
 * Cron: Crypto Daily Digest — BTC, ETH, FET
 * Schedule: 0 23 * * *  (23:00 UTC = 08:00 JST = 06:00 ICT)
 *
 * Fetches latest crypto prices and sends a digest email via Dify workflow.
 *
 * Required env vars:
 *   DIFY_CRYPTO_DIGEST_API_KEY, DIFY_CRYPTO_DIGEST_WORKFLOW_ID
 */
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'
import { fetchCryptoPrices } from '@/services/market'
import { saveAlert } from '@/lib/alert-store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflowId = process.env.DIFY_CRYPTO_DIGEST_WORKFLOW_ID
  if (!workflowId) {
    return NextResponse.json({ error: 'DIFY_CRYPTO_DIGEST_WORKFLOW_ID not set' }, { status: 500 })
  }

  try {
    const coins = await fetchCryptoPrices(['BTC', 'ETH', 'FET'])
    const btc = coins.find(c => c.symbol === 'BTC')
    const eth = coins.find(c => c.symbol === 'ETH')
    const fet = coins.find(c => c.symbol === 'FET')

    const now = new Date()
    const date = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const result = await triggerWorkflow(workflowId, {
      date,
      recipient_email: process.env.RECIPIENT_EMAIL ?? '',
      email_subject: `📈 Crypto Digest – ${date}`,
      btc_price:  btc?.price?.toFixed(0)   ?? 'N/A',
      btc_change: btc?.change24h?.toFixed(2) ?? '0',
      eth_price:  eth?.price?.toFixed(0)   ?? 'N/A',
      eth_change: eth?.change24h?.toFixed(2) ?? '0',
      fet_price:  fet?.price?.toFixed(4)   ?? 'N/A',
      fet_change: fet?.change24h?.toFixed(2) ?? '0',
    }, process.env.DIFY_CRYPTO_DIGEST_API_KEY)

    await saveAlert({
      action: 'crypto-digest',
      title: `Crypto Digest · ${date}`,
      summary: `BTC $${btc?.price?.toFixed(0)} (${btc?.change24h?.toFixed(2)}%) · ETH $${eth?.price?.toFixed(0)} (${eth?.change24h?.toFixed(2)}%) · FET $${fet?.price?.toFixed(4)}`,
      triggeredAt: now.toISOString(),
      emailSent: true,
      runId: result.run_id,
      outputs: result.data?.outputs,
    })

    return NextResponse.json({ success: true, run_id: result.run_id })
  } catch (e) {
    console.error('[cron/crypto-digest]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
