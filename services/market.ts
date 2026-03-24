import type { AssetPrice, MarketSnapshot, VNGoldPrice } from '@/types'

function parseLooseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function parseGoldThousands(value: unknown): number {
  if (typeof value === 'number') return value * 1000
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/,/g, '').replace(/[^\d.-]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) ? num * 1000 : 0
}

function safePercent(current: number, previous?: number | null): number {
  if (!previous || previous <= 0 || current <= 0) return 0
  return ((current - previous) / previous) * 100
}

// ── Gold via goldapi.io ───────────────────────────────────────────────────
export async function fetchGoldPrice(): Promise<AssetPrice> {
  const apiKey = process.env.GOLD_API_KEY
  if (!apiKey) throw new Error('GOLD_API_KEY is not configured')

  const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
    headers: {
      'x-access-token': apiKey,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`GoldAPI error: ${res.status}`)
  const data = await res.json()

  return {
    symbol: 'XAU',
    name: 'Gold',
    price: data.price,
    change24h: data.chp ?? data.ch ?? 0,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  }
}

// ── Crypto via CoinGecko ──────────────────────────────────────────────────
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  USDT: 'tether',
  XRP: 'ripple',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  FET: 'fetch-ai',
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

  const res = await fetch(url, { headers, next: { revalidate: 60 } })
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
        updatedAt: data[id].last_updated_at ? new Date(data[id].last_updated_at * 1000).toISOString() : new Date().toISOString(),
      } satisfies AssetPrice
    })
    .filter((x): x is AssetPrice => x !== null)
}

// ── Forex via exchangerate-api ────────────────────────────────────────────
const FOREX_PAIRS = [
  { symbol: 'JPY', name: 'USD / JPY', currency: 'JPY' },
  { symbol: 'VND', name: 'USD / VND', currency: 'VND' },
]

export async function fetchForex(): Promise<AssetPrice[]> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Forex API error')
  const data = await res.json()

  return FOREX_PAIRS
    .filter(p => data.rates?.[p.symbol] != null)
    .map(p => ({
      symbol: p.symbol,
      name: p.name,
      price: data.rates[p.symbol],
      change24h: 0,
      currency: p.currency,
      updatedAt: new Date().toISOString(),
    }))
}

// ── Vietnam Domestic Gold (DOJI + BTMC + PNJ fallback) ───────────────────
async function fetchDojiGold(): Promise<VNGoldPrice[]> {
  const res = await fetch('https://giavang.doji.vn/api/giavang/', { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`DOJI gold error: ${res.status}`)
  const xml = await res.text()

  const rows = Array.from(xml.matchAll(/<Row\s+([^>]+)\/?>/gi)).map(match => {
    const attrs = match[1]
    const getAttr = (name: string) => (attrs.match(new RegExp(`${name}='([^']*)'`, 'i')) ?? [])[1] ?? ''
    
    return {
      name: getAttr('Name'),
      key: getAttr('Key'),
      sell: parseGoldThousands(getAttr('Sell')),
      buy: parseGoldThousands(getAttr('Buy')),
      change: parseLooseNumber(getAttr('Change')),
    }
  })

  const pick = (predicate: (row: { name: string; key: string }) => boolean) => rows.find(predicate)
  const result: VNGoldPrice[] = []

  const sjc = pick(r => /sjc/i.test(r.name) || /sjc/i.test(r.key))
  if (sjc) {
    result.push({
      brand: 'Vàng Miếng SJC',
      buy: sjc.buy,
      sell: sjc.sell,
      change24h: sjc.change,
      updatedAt: new Date().toISOString(),
    })
  }

  const doji = pick(r => /doji/i.test(r.name) || /doji/i.test(r.key))
  if (doji) {
    result.push({
      brand: 'Vàng Miếng DOJI',
      buy: doji.buy,
      sell: doji.sell,
      change24h: doji.change,
      updatedAt: new Date().toISOString(),
    })
  }

  const sjcRing = pick(r => /(nhẫn|1-5|24k|9999)/i.test(r.name) && /sjc/i.test(r.name + r.key))
  if (sjcRing) {
    result.push({
      brand: 'Nhẫn SJC 1-5 Chỉ 24k',
      buy: sjcRing.buy,
      sell: sjcRing.sell,
      change24h: sjcRing.change,
      updatedAt: new Date().toISOString(),
    })
  }

  return result
}

async function fetchBTMCGold(): Promise<VNGoldPrice[]> {
  const res = await fetch('https://api.btmc.vn/api/BTMCAPI/getpricebtmc', { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`BTMC gold error: ${res.status}`)
  const data = await res.json()

  const rows = Array.isArray(data?.DataList) ? data.DataList : []
  const pick = (predicate: (row: any) => boolean) => rows.find(predicate)
  const result: VNGoldPrice[] = []

  const btmc24k = pick((row: any) => /999\.9|24k/i.test(String(row?.n ?? '')))
  if (btmc24k) {
    const buy = parseLooseNumber(btmc24k.pb ?? btmc24k.buy ?? btmc24k.Buy)
    const sell = parseLooseNumber(btmc24k.ps ?? btmc24k.sell ?? btmc24k.Sell)
    result.push({
      brand: 'Nhẫn Tròn Trơn BTMC 24k',
      buy,
      sell,
      change24h: safePercent(sell, parseLooseNumber(btmc24k.pt ?? btmc24k.yesterday ?? 0)),
      updatedAt: new Date().toISOString(),
    })
  }

  return result
}

async function fetchPNJGold(): Promise<VNGoldPrice[]> {
  // PNJ does not expose a stable public API.
  return [{
    brand: 'Nhẫn Trơn PNJ 24k',
    buy: 0,
    sell: 0,
    change24h: 0,
    updatedAt: new Date().toISOString(),
  }]
}

export async function fetchVNGold(): Promise<VNGoldPrice[]> {
  const [doji, btmc, pnj] = await Promise.allSettled([
    fetchDojiGold(),
    fetchBTMCGold(),
    fetchPNJGold(),
  ])

  // Fixed set of brands to always display
  const targetBrands = [
    'Vàng Miếng SJC',
    'Vàng Miếng DOJI',
    'Nhẫn Trơn PNJ 24k',
    'Nhẫn Tròn Trơn BTMC 24k'
  ]

  const merged = new Map<string, VNGoldPrice>()
  
  // Initialize with empty data for fixed brands
  for (const brand of targetBrands) {
    const mockMatch = mockVNGold().find(m => m.brand === brand)
    merged.set(brand, {
      brand,
      buy: 0,
      sell: 0,
      change24h: 0,
      updatedAt: new Date().toISOString(),
      ...(mockMatch && { buy: 0, sell: 0 }) // Explicitly start at 0
    })
  }

  const add = (items: VNGoldPrice[]) => {
    for (const item of items) {
      if (item.buy <= 0 || item.sell <= 0) continue
      
      const key = item.brand
      // If the API didn't provide a change percentage, try to use a realistic placeholder from mock data
      const change24h = item.change24h !== 0 ? item.change24h : (merged.get(key)?.change24h || 0)

      if (merged.has(key)) {
        merged.set(key, { ...item, change24h })
      } else if (key.includes('SJC') && !key.includes('Nhẫn')) {
        merged.set('Vàng Miếng SJC', { ...item, brand: 'Vàng Miếng SJC', change24h })
      } else if (key.includes('DOJI') && !key.includes('Nhẫn')) {
        merged.set('Vàng Miếng DOJI', { ...item, brand: 'Vàng Miếng DOJI', change24h })
      }
    }
  }

  if (doji.status === 'fulfilled') add(doji.value)
  if (btmc.status === 'fulfilled') add(btmc.value)
  if (pnj.status === 'fulfilled') add(pnj.value)

  return Array.from(merged.values())
}

// ── Aggregate snapshot ────────────────────────────────────────────────────
export async function fetchMarketSnapshot(watchlist: string[]): Promise<MarketSnapshot> {
  const cryptoSymbols = watchlist.filter(s => s !== 'XAU')
  const [gold, coins, forex, vnGold] = await Promise.allSettled([
    fetchGoldPrice(),
    fetchCryptoPrices(cryptoSymbols),
    fetchForex(),
    fetchVNGold(),
  ])

  return {
    gold: gold.status === 'fulfilled' ? gold.value : mockGold(),
    coins: coins.status === 'fulfilled' ? coins.value : [],
    forex: forex.status === 'fulfilled' ? forex.value : [],
    vnGold: vnGold.status === 'fulfilled' ? vnGold.value : mockVNGold(),
  }
}

function mockGold(): AssetPrice {
  return {
    symbol: 'XAU',
    name: 'Gold',
    price: 3024.5,
    change24h: 0.42,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  }
}

function mockVNGold(): VNGoldPrice[] {
  return [
    { brand: 'Vàng Miếng SJC', buy: 158000000, sell: 160000000, change24h: 3.45, updatedAt: new Date().toISOString() },
    { brand: 'Vàng Miếng DOJI', buy: 158000000, sell: 160000000, change24h: 3.2, updatedAt: new Date().toISOString() },
    { brand: 'Nhẫn Trơn PNJ 24k', buy: 0, sell: 0, change24h: 0, updatedAt: new Date().toISOString() },
    { brand: 'Nhẫn Tròn Trơn BTMC 24k', buy: 143000000, sell: 146000000, change24h: 2.1, updatedAt: new Date().toISOString() },
  ]
}
