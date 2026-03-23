import { NextRequest, NextResponse } from 'next/server'
import { fetchMarketSnapshot } from '@/services/market'
import { DEFAULT_WATCHLIST } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols')?.split(',') ?? DEFAULT_WATCHLIST
  try {
    const snapshot = await fetchMarketSnapshot(symbols)
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
