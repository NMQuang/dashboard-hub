/**
 * Cron: Gold Price Alert
 * Schedule: 0,30 * * * *  (every 30 minutes)
 *
 * Checks if gold price moved more than GOLD_ALERT_THRESHOLD% (default 1.5%)
 * since last check. If yes, triggers Dify alert workflow + saves record.
 *
 * Required env vars:
 *   DIFY_API_KEY, DIFY_GOLD_ALERT_WORKFLOW_ID
 * Optional:
 *   GOLD_ALERT_THRESHOLD (default "1.5")
 */
import { NextResponse } from 'next/server'
import { triggerWorkflow } from '@/services/dify'
import { fetchGoldPrice, fetchVNGold } from '@/services/market'
import { fetchGoldNews } from '@/services/goldNews'
import { GOLD_HOLDINGS, calcGoldPortfolio } from '@/lib/familyGold'
import { saveAlert } from '@/lib/alert-store'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const LAST_PRICE_FILE = path.join(process.cwd(), '.next', 'cache', 'gold-last-price.json')

async function readLastPrice(): Promise<number | null> {
  try {
    const raw = await fs.readFile(LAST_PRICE_FILE, 'utf-8')
    return JSON.parse(raw).price
  } catch { return null }
}

async function writeLastPrice(price: number) {
  try {
    await fs.mkdir(path.dirname(LAST_PRICE_FILE), { recursive: true })
    await fs.writeFile(LAST_PRICE_FILE, JSON.stringify({ price, updatedAt: new Date().toISOString() }))
  } catch {}
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflowId = process.env.DIFY_GOLD_ALERT_WORKFLOW_ID
  if (!workflowId) {
    return NextResponse.json({ error: 'DIFY_GOLD_ALERT_WORKFLOW_ID not set' }, { status: 500 })
  }

  try {
    const gold = await fetchGoldPrice()
    const lastPrice = await readLastPrice()
    const threshold = parseFloat(process.env.GOLD_ALERT_THRESHOLD ?? '1.5') / 100

    // Always persist current price
    await writeLastPrice(gold.price)

    if (lastPrice === null) {
      return NextResponse.json({ skipped: true, reason: 'First run — baseline price saved', price: gold.price })
    }

    const change = (gold.price - lastPrice) / lastPrice
    if (Math.abs(change) < threshold) {
      return NextResponse.json({ skipped: true, reason: `Change ${(change * 100).toFixed(2)}% below threshold`, price: gold.price })
    }

    const direction = change >= 0 ? 'UP' : 'DOWN'
    const now = new Date()

    // Fetch enrichment data in parallel — never block the alert if these fail
    const [vnGoldResult, newsResult] = await Promise.allSettled([
      fetchVNGold(),
      fetchGoldNews(),
    ])

    const vnGold = vnGoldResult.status === 'fulfilled' ? vnGoldResult.value : []
    const news = newsResult.status === 'fulfilled' ? newsResult.value : []

    const mieng = vnGold.find((g) => g.key === 'mieng')
    const nhan = vnGold.find((g) => g.key === 'nhan')
    const portfolio = calcGoldPortfolio(GOLD_HOLDINGS, vnGold)

    const result = await triggerWorkflow(workflowId, {
      recipient_email: 'quangnmjp96@gmail.com',
      symbol: 'XAU/USD',
      direction,
      current_price: gold.price.toFixed(2),
      last_price: lastPrice.toFixed(2),
      change_pct: (change * 100).toFixed(2),
      triggered_at: now.toLocaleString('en-GB', { timeZone: 'Asia/Tokyo' }) + ' JST',
      // VN domestic gold
      vn_gold_mieng_buy: mieng?.buy ?? 0,
      vn_gold_mieng_sell: mieng?.sell ?? 0,
      vn_gold_nhan_buy: nhan?.buy ?? 0,
      vn_gold_nhan_sell: nhan?.sell ?? 0,
      // Top news headlines (up to 3)
      top_news_1: news[0]?.title ?? '',
      top_news_2: news[1]?.title ?? '',
      top_news_3: news[2]?.title ?? '',
      // Family portfolio snapshot
      portfolio_qty: portfolio.totalQuantity,
      portfolio_cost_vnd: portfolio.totalCostVND,
      portfolio_value_vnd: portfolio.totalCurrentVND,
      portfolio_pnl_vnd: portfolio.totalPnlVND,
      portfolio_pnl_pct: portfolio.totalPnlPct.toFixed(2),
    })

    await saveAlert({
      action: 'gold-alert',
      title: `Gold ${direction} Alert · ${(Math.abs(change) * 100).toFixed(2)}%`,
      summary: `Gold price moved ${direction} from $${lastPrice.toFixed(2)} to $${gold.price.toFixed(2)} (${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%)`,
      triggeredAt: now.toISOString(),
      emailSent: true,
      runId: result.run_id,
      outputs: result.data?.outputs,
    })

    return NextResponse.json({ triggered: true, direction, change_pct: (change * 100).toFixed(2), run_id: result.run_id })
  } catch (e) {
    console.error('[cron/gold-alert]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
