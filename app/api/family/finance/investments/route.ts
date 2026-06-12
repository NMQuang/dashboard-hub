import { NextRequest, NextResponse } from 'next/server'
import { getInvestments, saveInvestment, deleteInvestment } from '@/services/familyInvestments'
import { logFinanceHistory } from '@/services/familyFinance'
import type { FamilyInvestment } from '@/types/family'

const TYPE_LABELS: Record<string, string> = {
  gold: 'Vàng', crypto: 'Crypto', savings: 'Tiết kiệm', stock: 'Cổ phiếu',
}

export async function GET(): Promise<NextResponse> {
  const investments = await getInvestments()
  return NextResponse.json({ investments })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const investment = (await req.json()) as FamilyInvestment
    const all = await getInvestments()
    const existing = all.find(i => i.id === investment.id)
    await saveInvestment(investment)
    const action = existing ? 'updated' : 'created'
    const typeLabel = TYPE_LABELS[investment.type] ?? investment.type
    const qtyFmt = `${investment.quantity} ${investment.currency}`
    logFinanceHistory({
      entityType: 'investment',
      entityId: investment.id,
      action,
      description: `${action === 'created' ? 'Thêm' : 'Cập nhật'} đầu tư ${typeLabel}: ${investment.assetName} (${qtyFmt})`,
      snapshot: investment as unknown as Record<string, unknown>,
    })
    return NextResponse.json({ investment })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const desc = req.nextUrl.searchParams.get('desc') ?? 'đầu tư'
  await deleteInvestment(id)
  logFinanceHistory({ entityType: 'investment', entityId: id, action: 'deleted', description: `Xóa ${desc}` })
  return NextResponse.json({ ok: true })
}
