import { NextRequest, NextResponse } from 'next/server'
import { getDebts, saveDebt, deleteDebt } from '@/services/familyFinance'
import type { FamilyDebt } from '@/types/family'

export async function GET(): Promise<NextResponse> {
  const debts = await getDebts()
  return NextResponse.json({ debts })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const debt = (await req.json()) as FamilyDebt
    await saveDebt(debt)
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
