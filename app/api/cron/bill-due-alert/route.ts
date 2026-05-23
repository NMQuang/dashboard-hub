/**
 * Cron: Bill Due Alert
 * Schedule: 0 22 * * *  (22:00 UTC = 07:00 JST = 05:00 ICT)
 *
 * Runs daily. Sends email when pending bills are due in 1 or 3 days (JST).
 *
 * Auth:
 *   - Vercel cron: Authorization: Bearer CRON_SECRET
 *   - Manual from UI: ?secret=CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { saveAlert } from '@/lib/alert-store'

export const dynamic = 'force-dynamic'

// JST = UTC+9
function jstDateString(offsetDays: number): string {
  const d = new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000)
  return d.toISOString().slice(0, 10)
}

function formatAmount(amount: number | null | undefined, currency: string): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('ja-JP').format(amount) + ' ' + currency
}

function buildBillAlertHtml(
  bills: Array<{ name: string; country: string; currency: string; estimated_amount?: number; due_date: string }>,
  today: string,
): string {
  const rows = bills.map(b => {
    const daysLeft = Math.round(
      (new Date(b.due_date).getTime() - new Date(today).getTime()) / 86400_000,
    )
    const urgency = daysLeft <= 1 ? '#ef4444' : '#f97316'
    const flag = b.country === 'JP' ? '🇯🇵' : '🇻🇳'
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:20px;text-align:center;width:40px;">${flag}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;">
          <div style="font-size:15px;font-weight:600;color:#1a1917;">${b.name}</div>
          <div style="font-size:13px;color:#6b6860;margin-top:3px;">
            Dự kiến: <strong>${formatAmount(b.estimated_amount, b.currency)}</strong>
            &nbsp;·&nbsp;Hạn: <span style="color:${urgency};font-weight:600;">${b.due_date} (còn ${daysLeft} ngày)</span>
          </div>
        </td>
      </tr>`
  }).join('')

  return `
    <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="background:linear-gradient(135deg,#1a1917,#2d2b28);color:#fff;padding:24px;border-radius:12px 12px 0 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.5;margin-bottom:8px;">
          🏠 Family Hub · Nhắc bill
        </div>
        <div style="font-size:20px;font-weight:500;">
          ${bills.length} bill sắp đến hạn
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8e6e1;border-top:none;">
        ${rows}
      </table>
      <div style="background:#f5f4f2;padding:16px;border-radius:0 0 12px 12px;border:1px solid #e8e6e1;border-top:none;">
        <div style="font-size:11px;color:#a8a49d;text-align:center;">
          Gửi tự động từ Dashboard Hub · Family Finance
        </div>
      </div>
    </div>`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  const authed = !secret || authHeader === `Bearer ${secret}` || querySecret === secret
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recipientEmail = process.env.RECIPIENT_EMAIL
  if (!recipientEmail) return NextResponse.json({ error: 'RECIPIENT_EMAIL not set' }, { status: 500 })

  try {
    const todayJST = jstDateString(0)
    const in1Day = jstDateString(1)
    const in3Days = jstDateString(3)

    let bills: Array<{
      id: string; name: string; country: string; currency: string
      estimated_amount?: number; due_date: string; status: string
    }> = []

    if (supabase) {
      const { data, error } = await supabase
        .from('family_bills')
        .select('id,name,country,currency,estimated_amount,due_date,status')
        .eq('status', 'pending')
        .in('due_date', [in1Day, in3Days])
        .order('due_date', { ascending: true })

      if (error) {
        console.error('[cron/bill-due-alert] Supabase error:', error)
        return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
      }
      bills = data ?? []
    }

    console.log(`[cron/bill-due-alert] today=${todayJST} pending bills due in 1/3 days: ${bills.length}`)

    if (bills.length === 0) {
      return NextResponse.json({ success: true, billsFound: 0, message: 'No bills due in 1 or 3 days' })
    }

    const subject = `💳 Nhắc thanh toán: ${bills.length} bill sắp đến hạn`
    const html = buildBillAlertHtml(bills, todayJST)
    const emailSent = await sendEmail(recipientEmail, subject, html)

    await saveAlert({
      action: 'bill-due-alert',
      title: `Bill Due Alert · ${todayJST}`,
      summary: `${bills.length} bill(s) due soon: ${bills.map(b => b.name).join(', ')}`,
      triggeredAt: new Date().toISOString(),
      emailSent,
      status: emailSent ? 'success' : 'failed',
      error: emailSent ? undefined : 'Email sending failed',
    })

    return NextResponse.json({ success: true, billsFound: bills.length, emailSent })
  } catch (e) {
    console.error('[cron/bill-due-alert]', e)
    await saveAlert({
      action: 'bill-due-alert',
      title: 'Bill Due Alert · ERROR',
      summary: String(e),
      triggeredAt: new Date().toISOString(),
      emailSent: false,
      status: 'failed',
      error: String(e),
    })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
