import { NextRequest, NextResponse } from 'next/server'
import { getBillsByMonth, saveBill, deleteBill, saveExpense, logFinanceHistory } from '@/services/familyFinance'
import type { FamilyBill, FamilyExpense } from '@/types/family'

function fmtBillAmt(bill: FamilyBill, amount?: number): string {
  const n = amount ?? bill.actualAmount ?? bill.estimatedAmount
  if (!n) return ''
  return bill.currency === 'JPY'
    ? ` ¥${new Intl.NumberFormat('ja-JP').format(n)}`
    : ` ${new Intl.NumberFormat('vi-VN').format(n)}₫`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const bills = await getBillsByMonth(month)
  return NextResponse.json({ bills })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    // mark-paid action: create expense entry then update bill
    if (body._action === 'mark-paid') {
      const { bill, actualAmount } = body as { bill: FamilyBill; actualAmount: number }
      const expenseId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const expense: FamilyExpense = {
        id: expenseId,
        country: bill.country,
        category: bill.category as FamilyExpense['category'],
        amount: actualAmount,
        currency: bill.currency,
        spentDate: bill.dueDate ?? `${bill.month}-01`,
        note: bill.name + (bill.note ? ` — ${bill.note}` : ''),
        createdAt: new Date().toISOString(),
      }
      await saveExpense(expense)
      const updated: FamilyBill = { ...bill, status: 'paid', actualAmount, expenseId }
      await saveBill(updated)
      logFinanceHistory({
        entityType: 'bill',
        entityId: bill.id,
        action: 'updated',
        description: `Thanh toán hóa đơn "${bill.name}"${fmtBillAmt(bill, actualAmount)} [${bill.country}]`,
        snapshot: updated as unknown as Record<string, unknown>,
        month: bill.month,
      })
      return NextResponse.json({ bill: updated, expense })
    }

    const bill = body as FamilyBill
    const existing = (await getBillsByMonth(bill.month)).find(b => b.id === bill.id)
    await saveBill(bill)
    const action = existing ? 'updated' : 'created'
    logFinanceHistory({
      entityType: 'bill',
      entityId: bill.id,
      action,
      description: `${action === 'created' ? 'Thêm' : 'Cập nhật'} hóa đơn "${bill.name}"${fmtBillAmt(bill)} [${bill.country}]`,
      snapshot: bill as unknown as Record<string, unknown>,
      month: bill.month,
    })
    return NextResponse.json({ bill })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const month = req.nextUrl.searchParams.get('month') ?? undefined
  const desc = req.nextUrl.searchParams.get('desc') ?? 'hóa đơn'
  await deleteBill(id)
  logFinanceHistory({ entityType: 'bill', entityId: id, action: 'deleted', description: `Xóa ${desc}`, month })
  return NextResponse.json({ ok: true })
}
