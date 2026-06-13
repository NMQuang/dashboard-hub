import { NextRequest, NextResponse } from 'next/server'
import { getExpensesByMonth, saveExpense, deleteExpense, logFinanceHistory } from '@/services/familyFinance'
import type { FamilyExpense } from '@/types/family'
import { EXPENSE_CATEGORY_LABELS } from '@/types/family'

function fmtExpense(e: FamilyExpense): string {
  const amt = e.currency === 'JPY'
    ? `¥${new Intl.NumberFormat('ja-JP').format(e.amount)}`
    : `${new Intl.NumberFormat('vi-VN').format(e.amount)}₫`
  return `${amt} — ${EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}${e.note ? ` (${e.note})` : ''}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const expenses = await getExpensesByMonth(month)
  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const expense = (await req.json()) as FamilyExpense
    const existing = (await getExpensesByMonth(expense.spentDate.slice(0, 7))).find(e => e.id === expense.id)
    await saveExpense(expense)
    const action = existing ? 'updated' : 'created'
    await logFinanceHistory({
      entityType: 'expense',
      entityId: expense.id,
      action,
      description: `${action === 'created' ? 'Thêm' : 'Cập nhật'} chi tiêu ${fmtExpense(expense)}`,
      snapshot: expense as unknown as Record<string, unknown>,
      month: expense.spentDate.slice(0, 7),
    })
    return NextResponse.json({ expense })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const month = req.nextUrl.searchParams.get('month') ?? undefined
  const desc = req.nextUrl.searchParams.get('desc') ?? 'khoản chi tiêu'
  await deleteExpense(id)
  await logFinanceHistory({ entityType: 'expense', entityId: id, action: 'deleted', description: `Xóa ${desc}`, month })
  return NextResponse.json({ ok: true })
}
