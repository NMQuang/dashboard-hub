import { NextRequest, NextResponse } from 'next/server'
import { getFinanceHistory } from '@/services/familyFinance'
import type { FinanceEntityType } from '@/types/family'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams
  const limit = Math.min(Number(params.get('limit') ?? 50), 100)
  const offset = Number(params.get('offset') ?? 0)
  const entityType = (params.get('type') ?? undefined) as FinanceEntityType | undefined
  const entries = await getFinanceHistory({ limit, offset, entityType })
  return NextResponse.json({ entries, hasMore: entries.length === limit })
}
