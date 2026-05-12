import { NextRequest, NextResponse } from 'next/server'
import { getIncomeByMonth, saveIncome, deleteIncome } from '@/services/familyFinance'
import type { FamilyIncome } from '@/types/family'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const income = await getIncomeByMonth(month)
  return NextResponse.json({ income })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const income = (await req.json()) as FamilyIncome
    await saveIncome(income)
    return NextResponse.json({ income })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteIncome(id)
  return NextResponse.json({ ok: true })
}
