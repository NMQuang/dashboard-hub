/**
 * Cron: Daily Vietnam Gold Morning Alert
 * Schedule: 0 0 * * *  (00:00 UTC = 07:00 ICT Vietnam)
 *
 * Sends a daily morning email with:
 *  - Vietnam domestic gold prices (miếng, nhẫn, SJC, nữ trang)
 *  - % change vs previous trading day
 *  - International XAU/USD for context
 *  - Top gold news headlines from VnExpress
 *  - Family portfolio snapshot (if holdings configured in lib/familyGold.ts)
 *
 * Required env vars:
 *   DIFY_API_KEY, DIFY_GOLD_ALERT_WORKFLOW_ID
 *
 * ── Dify workflow inputs ─────────────────────────────────────────────────────
 * Configure these variables in your Dify workflow:
 *
 *  recipient_email    string  $RECIPIENT_EMAIL (env var)
 *  date               string  "Thứ Hai, 06 tháng 4 năm 2026"
 *  triggered_at       string  "07:00 ICT"
 *
 *  xau_price          string  "$3020.50"
 *  xau_change         string  "-0.42"      (% vs 24h)
 *
 *  vn_mieng_buy       string  "168.1 triệu"
 *  vn_mieng_sell      string  "171.1 triệu"
 *  vn_mieng_change    string  "-0.81"      (% vs prev trading day)
 *
 *  vn_nhan_buy        string  "168.1 triệu"
 *  vn_nhan_sell       string  "171.1 triệu"
 *  vn_nhan_change     string  "-0.81"
 *
 *  vn_sjc_buy         string  "170.1 triệu"
 *  vn_sjc_sell        string  "173.1 triệu"
 *  vn_sjc_change      string  "-0.80"
 *
 *  vn_nutrang_buy     string  "166.1 triệu"
 *  vn_nutrang_sell    string  "170.1 triệu"
 *  vn_nutrang_change  string  "-0.82"
 *
 *  top_news_1         string  Headline text
 *  top_news_1_url     string  Article URL
 *  top_news_2         string
 *  top_news_2_url     string
 *  top_news_3         string
 *  top_news_3_url     string
 *
 *  portfolio_qty      string  "2"          (lượng held, "0" if none)
 *  portfolio_cost     string  "164.0 triệu"
 *  portfolio_value    string  "168.1 triệu"
 *  portfolio_pnl      string  "+4.1 triệu"
 *  portfolio_pnl_pct  string  "+2.50"
 * ────────────────────────────────────────────────────────────────────────────
 */
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'
import { fetchVNGold, fetchGoldPrice } from '@/services/market'
import { fetchGoldNews } from '@/services/goldNews'
import { GOLD_HOLDINGS, calcGoldPortfolio } from '@/lib/familyGold'
import { saveAlert } from '@/lib/alert-store'
import type { VNGoldPrice } from '@/types'

export const dynamic = 'force-dynamic'

// ── Dify response shape ───────────────────────────────────────────────────────
interface DifyWorkflowResult {
  run_id?: string
  workflow_run_id?: string
  data?: { outputs?: Record<string, unknown> }
  outputs?: Record<string, unknown>
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTrieu(vnd: number): string {
  if (vnd <= 0) return '—'
  return `${(vnd / 1_000_000).toFixed(1)} triệu`
}

function fmtChange(pct: number): string {
  if (pct === 0) return '0.00'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}`
}

function findGold(vnGold: VNGoldPrice[], key: string): VNGoldPrice | undefined {
  return vnGold.find((g) => g.key === key)
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflowId = process.env.DIFY_GOLD_ALERT_WORKFLOW_ID
  if (!workflowId) {
    return NextResponse.json({ error: 'DIFY_GOLD_ALERT_WORKFLOW_ID not set' }, { status: 500 })
  }

  try {
    const now = new Date()
    const date = now.toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    })
    const triggeredAt = now.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
    }) + ' ICT'

    // Fetch all data in parallel — never crash if a source fails
    const [vnGoldResult, xauResult, newsResult] = await Promise.allSettled([
      fetchVNGold(),
      fetchGoldPrice(),
      fetchGoldNews(),
    ])

    const vnGold = vnGoldResult.status === 'fulfilled' ? vnGoldResult.value : []
    const xau   = xauResult.status   === 'fulfilled' ? xauResult.value   : null
    const news  = newsResult.status  === 'fulfilled' ? newsResult.value  : []

    const mieng   = findGold(vnGold, 'mieng')
    const nhan    = findGold(vnGold, 'nhan')
    const sjc     = findGold(vnGold, 'nguyen_lieu')
    const nutrang = findGold(vnGold, 'nu_trang')

    const portfolio = calcGoldPortfolio(GOLD_HOLDINGS, vnGold)

    const inputs: Record<string, string> = {
      recipient_email: process.env.RECIPIENT_EMAIL ?? '',
      date,
      triggered_at: triggeredAt,

      // International gold context
      xau_price:  xau ? `$${xau.price.toFixed(2)}` : 'N/A',
      xau_change: xau ? fmtChange(xau.change24h)   : '0.00',

      // Vietnam domestic gold
      vn_mieng_buy:    fmtTrieu(mieng?.buy  ?? 0),
      vn_mieng_sell:   fmtTrieu(mieng?.sell ?? 0),
      vn_mieng_change: fmtChange(mieng?.change24h ?? 0),

      vn_nhan_buy:    fmtTrieu(nhan?.buy  ?? 0),
      vn_nhan_sell:   fmtTrieu(nhan?.sell ?? 0),
      vn_nhan_change: fmtChange(nhan?.change24h ?? 0),

      vn_sjc_buy:    fmtTrieu(sjc?.buy  ?? 0),
      vn_sjc_sell:   fmtTrieu(sjc?.sell ?? 0),
      vn_sjc_change: fmtChange(sjc?.change24h ?? 0),

      vn_nutrang_buy:    fmtTrieu(nutrang?.buy  ?? 0),
      vn_nutrang_sell:   fmtTrieu(nutrang?.sell ?? 0),
      vn_nutrang_change: fmtChange(nutrang?.change24h ?? 0),

      // Top 3 news headlines
      top_news_1:     news[0]?.title ?? '',
      top_news_1_url: news[0]?.url   ?? '',
      top_news_2:     news[1]?.title ?? '',
      top_news_2_url: news[1]?.url   ?? '',
      top_news_3:     news[2]?.title ?? '',
      top_news_3_url: news[2]?.url   ?? '',

      // Family portfolio
      portfolio_qty:     String(portfolio.totalQuantity),
      portfolio_cost:    fmtTrieu(portfolio.totalCostVND),
      portfolio_value:   fmtTrieu(portfolio.totalCurrentVND),
      portfolio_pnl:     fmtTrieu(Math.abs(portfolio.totalPnlVND)),
      portfolio_pnl_pct: fmtChange(portfolio.totalPnlPct),
    }

    const refSell   = mieng?.sell      ?? 0
    const refChange = mieng?.change24h ?? 0
    const alertTitle = `Báo Giá Vàng Sáng · ${now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
    const alertSummary = `Vàng Miếng: ${fmtTrieu(refSell)} (${fmtChange(refChange)}%)${news[0] ? ` · ${news[0].title.slice(0, 70)}` : ''}`

    let raw: DifyWorkflowResult
    try {
      raw = await triggerWorkflow(workflowId, inputs) as DifyWorkflowResult
    } catch (difyErr) {
      // Dify failed — save a failure record so we have visibility, then rethrow
      console.error('[cron/gold-alert] Dify trigger failed:', difyErr)
      await saveAlert({
        action:      'gold-alert',
        title:       alertTitle,
        summary:     alertSummary,
        triggeredAt: now.toISOString(),
        emailSent:   false,
        status:      'failed',
        error:       String(difyErr),
      })
      return NextResponse.json({ error: String(difyErr) }, { status: 500 })
    }

    const runId = raw.run_id || raw.workflow_run_id || ''

    await saveAlert({
      action:      'gold-alert',
      title:       alertTitle,
      summary:     alertSummary,
      triggeredAt: now.toISOString(),
      emailSent:   true,
      runId,
      outputs:     raw.data?.outputs ?? raw.outputs,
      status:      'success',
    })

    return NextResponse.json({
      success: true,
      run_id: runId,
      snapshot: {
        vn_mieng_sell:   fmtTrieu(refSell),
        vn_mieng_change: fmtChange(refChange),
        news_count:      news.length,
        portfolio_qty:   portfolio.totalQuantity,
      },
    })
  } catch (e) {
    console.error('[cron/gold-alert]', e)
    // Top-level catch: save failure record for any unexpected error
    await saveAlert({
      action:      'gold-alert',
      title:       `Báo Giá Vàng Sáng · ${new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
      summary:     'Unexpected error — see error field',
      triggeredAt: new Date().toISOString(),
      emailSent:   false,
      status:      'failed',
      error:       String(e),
    })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
