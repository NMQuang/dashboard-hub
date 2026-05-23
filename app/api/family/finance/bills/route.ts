import { NextRequest, NextResponse } from 'next/server'
import { getBillsByMonth, saveBill, deleteBill, saveExpense } from '@/services/familyFinance'
import type { FamilyBill, FamilyExpense } from '@/types/family'

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
      const updated: FamilyBill = {
        ...bill,
        status: 'paid',
        actualAmount,
        expenseId,
      }
      await saveBill(updated)
      return NextResponse.json({ bill: updated, expense })
    }

    const bill = body as FamilyBill
    await saveBill(bill)
    return NextResponse.json({ bill })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteBill(id)
  return NextResponse.json({ ok: true })
}
