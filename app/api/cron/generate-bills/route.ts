/**
 * Cron: Auto-generate monthly bills
 * Schedule: 0 1 25 * *  (01:00 UTC ngày 25 = 10:00 JST = 08:00 ICT)
 *
 * Ngày 25 hàng tháng → tự động tạo pending bills cho THÁNG SAU
 * từ family_bill_templates đang enabled.
 *
 * Smart estimate: dùng actual_amount tháng trước nếu template chưa set estimated_amount.
 *
 * Auth:
 *   - Vercel cron: Authorization: Bearer CRON_SECRET
 *   - Manual từ UI: query param ?secret=CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateBillsForMonth } from '@/services/familyFinance'

export const dynamic = 'force-dynamic'

function nextMonth(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET

  // Auth: header (Vercel cron) or query param (manual trigger)
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  const authed =
    !secret ||
    authHeader === `Bearer ${secret}` ||
    querySecret === secret

  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Month: query param (manual) or next month (cron)
  const monthParam = req.nextUrl.searchParams.get('month')
  const targetMonth = monthParam ?? nextMonth()

  // Validate YYYY-MM format
  if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
    return NextResponse.json({ error: 'Invalid month format (YYYY-MM)' }, { status: 400 })
  }

  try {
    const result = await generateBillsForMonth(targetMonth)
    console.log(`[cron/generate-bills] month=${targetMonth} created=${result.created} skipped=${result.skipped}`)
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err) {
    console.error('[cron/generate-bills]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
