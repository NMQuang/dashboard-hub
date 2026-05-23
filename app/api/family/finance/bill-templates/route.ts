import { NextRequest, NextResponse } from 'next/server'
import { getBillTemplates, updateBillTemplate } from '@/services/familyFinance'

export async function GET(): Promise<NextResponse> {
  const templates = await getBillTemplates()
  return NextResponse.json({ templates })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { id, enabled, estimatedAmount } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updates: Record<string, unknown> = {}
    if (enabled !== undefined) updates.enabled = enabled
    if ('estimatedAmount' in body) updates.estimated_amount = estimatedAmount ?? null
    await updateBillTemplate(id, updates as Parameters<typeof updateBillTemplate>[1])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
