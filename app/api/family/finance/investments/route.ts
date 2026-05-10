import { NextRequest, NextResponse } from 'next/server'
import { getInvestments, saveInvestment, deleteInvestment } from '@/services/familyInvestments'
import type { FamilyInvestment } from '@/types/family'

export async function GET(): Promise<NextResponse> {
  const investments = await getInvestments()
  return NextResponse.json({ investments })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const investment = (await req.json()) as FamilyInvestment
    await saveInvestment(investment)
    return NextResponse.json({ investment })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteInvestment(id)
  return NextResponse.json({ ok: true })
}
