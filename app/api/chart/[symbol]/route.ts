import { NextRequest, NextResponse } from 'next/server'

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  FET: 'fetch-ai',
  XRP: 'ripple',
  ADA: 'cardano',
  DOT: 'polkadot',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const coinId = COIN_IDS[upper]

  if (!coinId) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 's-maxage=1800' },
    })
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: Record<string, string> =
    apiKey && apiKey !== 'your_coingecko_key_here'
      ? { 'x-cg-demo-api-key': apiKey }
      : {}

  try {
    const url =
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart` +
      `?vs_currency=usd&days=1&interval=hourly`

    const res = await fetch(url, { headers, next: { revalidate: 1800 } })
    if (!res.ok) return NextResponse.json([])

    const data = await res.json()
    const points = (data.prices as [number, number][]).map(([ts, price]) => ({
      time: new Date(ts).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price,
    }))

    return NextResponse.json(points, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json([])
  }
}
