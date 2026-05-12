import { NextRequest, NextResponse } from 'next/server'
import { getExpensesByMonth, saveExpense, deleteExpense } from '@/services/familyFinance'
import type { FamilyExpense } from '@/types/family'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const expenses = await getExpensesByMonth(month)
  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const expense = (await req.json()) as FamilyExpense
    await saveExpense(expense)
    return NextResponse.json({ expense })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteExpense(id)
  return NextResponse.json({ ok: true })
}
