import type { AssetPrice, MarketSnapshot } from '@/types'

// ── Gold via goldapi.io ───────────────────────────────────────────────────
export async function fetchGoldPrice(): Promise<AssetPrice> {
  const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
    headers: {
      'x-access-token': process.env.GOLD_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }, // 5 min cache
  })

  if (!res.ok) throw new Error(`GoldAPI error: ${res.status}`)
  const data = await res.json()

  return {
    symbol: 'XAU',
    name: 'Gold',
    price: data.price,
    change24h: data.ch ?? 0,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  }
}

// ── Crypto via CoinGecko ──────────────────────────────────────────────────
const COIN_IDS: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  USDT:  'tether',
  XRP:   'ripple',
  ADA:   'cardano',
  AVAX:  'avalanche-2',
  MATIC: 'matic-network',
  DOT:   'polkadot',
  FET:   'fetch-ai',       // Fetch.ai
}

const COIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana',
  binancecoin: 'BNB', tether: 'Tether', ripple: 'XRP',
  cardano: 'Cardano', 'avalanche-2': 'Avalanche',
  'matic-network': 'Polygon', polkadot: 'Polkadot',
  'fetch-ai': 'Fetch.ai',
}

export async function fetchCryptoPrices(symbols: string[]): Promise<AssetPrice[]> {
  const ids = symbols.map(s => COIN_IDS[s]).filter(Boolean).join(',')
  if (!ids) return []

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: Record<string, string> = apiKey && apiKey !== 'your_coingecko_key_here'
    ? { 'x-cg-demo-api-key': apiKey }
    : {}

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`

  const res = await fetch(url, { headers, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data = await res.json()

  return symbols
    .map(sym => {
      const id = COIN_IDS[sym]
      if (!id || !data[id]) return null
      return {
        symbol: sym,
        name: COIN_NAMES[id] ?? sym,
        price: data[id].usd,
        change24h: data[id].usd_24h_change ?? 0,
        currency: 'USD',
        updatedAt: new Date(data[id].last_updated_at * 1000).toISOString(),
      } satisfies AssetPrice
    })
    .filter((x): x is AssetPrice => x !== null)
}

// ── Forex via exchangerate-api (free, all pairs in one call) ─────────────
const FOREX_PAIRS = [
  { symbol: 'JPY', name: 'USD / JPY', currency: 'JPY' },
  { symbol: 'VND', name: 'USD / VND', currency: 'VND' },
]

export async function fetchForex(): Promise<AssetPrice[]> {
  const res = await fetch(
    'https://open.er-api.com/v6/latest/USD',
    { next: { revalidate: 3600 } }   // 1-hr cache — free tier updates hourly
  )
  if (!res.ok) throw new Error('Forex API error')
  const data = await res.json()

  return FOREX_PAIRS
    .filter(p => data.rates[p.symbol] != null)
    .map(p => ({
      symbol: p.symbol,
      name: p.name,
      price: data.rates[p.symbol],
      change24h: 0,    // free tier excludes 24h delta
      currency: p.currency,
      updatedAt: new Date().toISOString(),
    }))
}

// ── Aggregate snapshot ────────────────────────────────────────────────────
export async function fetchMarketSnapshot(watchlist: string[]): Promise<MarketSnapshot> {
  const cryptoSymbols = watchlist.filter(s => s !== 'XAU')
  const [gold, coins, forex] = await Promise.allSettled([
    fetchGoldPrice(),
    fetchCryptoPrices(cryptoSymbols),
    fetchForex(),
  ])

  return {
    gold:  gold.status  === 'fulfilled' ? gold.value      : mockGold(),
    coins: coins.status === 'fulfilled' ? coins.value     : [],
    forex: forex.status === 'fulfilled' ? forex.value     : [],
  }
}

// ── Mock fallback (dev / API key missing) ────────────────────────────────
function mockGold(): AssetPrice {
  return { symbol: 'XAU', name: 'Gold', price: 3024.5, change24h: 0.42, currency: 'USD', updatedAt: new Date().toISOString() }
}
