import { NextRequest, NextResponse } from 'next/server'
import { getDebts, saveDebt, deleteDebt } from '@/services/familyFinance'
import { sendEmail } from '@/lib/email'
import type { FamilyDebt } from '@/types/family'

export async function GET(): Promise<NextResponse> {
  const debts = await getDebts()
  return NextResponse.json({ debts })
}

// Returns the milestone tier (0=none, 25, 50, 75, 100) for a paid ratio.
function milestone(paid: number, total: number): number {
  if (total <= 0) return 0
  const pct = paid / total
  if (pct >= 1) return 100
  if (pct >= 0.75) return 75
  if (pct >= 0.5) return 50
  if (pct >= 0.25) return 25
  return 0
}

function buildMilestoneHtml(debt: FamilyDebt, reached: number): string {
  const typeLabel = debt.type === 'owe' ? 'Tôi đang nợ' : 'Người ta nợ tôi'
  const emoji = reached === 100 ? '🎉' : reached >= 75 ? '🚀' : reached >= 50 ? '💪' : '📈'
  const paidFmt = new Intl.NumberFormat('ja-JP').format(debt.paidAmount)
  const totalFmt = new Intl.NumberFormat('ja-JP').format(debt.amount)
  return `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="background:linear-gradient(135deg,#1a1917,#2d2b28);color:#fff;padding:24px;border-radius:12px 12px 0 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.5;margin-bottom:8px;">
          🏠 Family Hub · Debt Milestone ${emoji}
        </div>
        <div style="font-size:22px;font-weight:600;">${reached}% đã thanh toán!</div>
      </div>
      <div style="background:#fff;border:1px solid #e8e6e1;border-top:none;padding:20px 24px;">
        <div style="font-size:13px;color:#6b6860;margin-bottom:4px;">${typeLabel}</div>
        <div style="font-size:17px;font-weight:600;color:#1a1917;margin-bottom:12px;">${debt.person}${debt.description ? ` · ${debt.description}` : ''}</div>
        <div style="background:#f5f4f2;border-radius:8px;padding:12px 16px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;">
            <span style="color:#6b6860;">Đã trả</span>
            <span style="font-weight:600;">${paidFmt} ${debt.currency}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:12px;">
            <span style="color:#6b6860;">Tổng</span>
            <span style="font-weight:600;">${totalFmt} ${debt.currency}</span>
          </div>
          <div style="background:#e8e6e1;border-radius:4px;height:8px;overflow:hidden;">
            <div style="background:#3b82f6;height:100%;width:${reached}%;border-radius:4px;"></div>
          </div>
        </div>
        ${reached === 100 ? '<div style="margin-top:16px;text-align:center;font-size:15px;color:#22c55e;font-weight:600;">🎊 Đã tất toán hoàn toàn!</div>' : ''}
      </div>
      <div style="background:#f5f4f2;padding:14px;border-radius:0 0 12px 12px;border:1px solid #e8e6e1;border-top:none;">
        <div style="font-size:11px;color:#a8a49d;text-align:center;">Gửi tự động từ Dashboard Hub · Family Finance</div>
      </div>
    </div>`
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const debt = (await req.json()) as FamilyDebt

    // Detect milestone crossing: fetch old state before saving
    const existingDebts = await getDebts()
    const oldDebt = existingDebts.find(d => d.id === debt.id)

    await saveDebt(debt)

    // Send milestone email if paidAmount crossed a threshold
    const recipientEmail = process.env.RECIPIENT_EMAIL
    if (recipientEmail && oldDebt) {
      const oldMilestone = milestone(oldDebt.paidAmount, oldDebt.amount)
      const newMilestone = milestone(debt.paidAmount, debt.amount)
      if (newMilestone > oldMilestone && newMilestone > 0) {
        const subject = `${newMilestone === 100 ? '🎉' : '📈'} Debt milestone: ${debt.person} đạt ${newMilestone}%`
        const html = buildMilestoneHtml(debt, newMilestone)
        sendEmail(recipientEmail, subject, html).catch(e =>
          console.error('[debts] milestone email failed:', e),
        )
      }
    }

    return NextResponse.json({ debt })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteDebt(id)
  return NextResponse.json({ ok: true })
}
