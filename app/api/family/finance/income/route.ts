import { NextRequest, NextResponse } from 'next/server'
import { getIncomeByMonth, saveIncome, deleteIncome, logFinanceHistory } from '@/services/familyFinance'
import type { FamilyIncome } from '@/types/family'
import { INCOME_SOURCE_LABELS } from '@/types/family'

function fmtIncome(income: FamilyIncome): string {
  const amt = income.currency === 'JPY'
    ? `¥${new Intl.NumberFormat('ja-JP').format(income.amount)}`
    : income.currency === 'USD'
    ? `$${income.amount.toLocaleString()}`
    : `${new Intl.NumberFormat('vi-VN').format(income.amount)}₫`
  return `${amt} — ${INCOME_SOURCE_LABELS[income.source] ?? income.source}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const income = await getIncomeByMonth(month)
  return NextResponse.json({ income })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const income = (await req.json()) as FamilyIncome
    const existing = (await getIncomeByMonth(income.receivedDate.slice(0, 7))).find(i => i.id === income.id)
    await saveIncome(income)
    const action = existing ? 'updated' : 'created'
    logFinanceHistory({
      entityType: 'income',
      entityId: income.id,
      action,
      description: `${action === 'created' ? 'Thêm' : 'Cập nhật'} thu nhập ${fmtIncome(income)}`,
      snapshot: income as unknown as Record<string, unknown>,
      month: income.receivedDate.slice(0, 7),
    })
    return NextResponse.json({ income })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const month = req.nextUrl.searchParams.get('month') ?? undefined
  const desc = req.nextUrl.searchParams.get('desc') ?? 'khoản thu nhập'
  await deleteIncome(id)
  logFinanceHistory({ entityType: 'income', entityId: id, action: 'deleted', description: `Xóa ${desc}`, month })
  return NextResponse.json({ ok: true })
}
