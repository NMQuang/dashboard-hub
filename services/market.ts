import type { AssetPrice, MarketSnapshot, VNGoldPrice } from '@/types'

// ── Gold via goldapi.io ───────────────────────────────────────────────────
export async function fetchGoldPrice(): Promise<AssetPrice> {
  const apiKey = process.env.GOLD_API_KEY
  if (!apiKey) return mockGold()

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
    price: Number(data.price ?? 0),
    change24h: Number(data.ch ?? 0),
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
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  binancecoin: 'BNB',
  tether: 'Tether',
  ripple: 'XRP',
  cardano: 'Cardano',
  'avalanche-2': 'Avalanche',
  'matic-network': 'Polygon',
  polkadot: 'Polkadot',
  'fetch-ai': 'Fetch.ai',
}

export async function fetchCryptoPrices(symbols: string[]): Promise<AssetPrice[]> {
  const ids = symbols.map((s) => COIN_IDS[s]).filter(Boolean).join(',')
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
    .map((sym) => {
      const id = COIN_IDS[sym]
      if (!id || !data[id]) return null
      return {
        symbol: sym,
        name: COIN_NAMES[id] ?? sym,
        price: Number(data[id].usd ?? 0),
        change24h: Number(data[id].usd_24h_change ?? 0),
        currency: 'USD',
        updatedAt: data[id].last_updated_at
          ? new Date(data[id].last_updated_at * 1000).toISOString()
          : new Date().toISOString(),
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
    .filter((p) => data.rates?.[p.symbol] != null)
    .map((p) => ({
      symbol: p.symbol,
      name: p.name,
      price: Number(data.rates[p.symbol]),
      change24h: 0,
      currency: p.currency,
      updatedAt: new Date().toISOString(),
    }))
}

// ── Vietnam Domestic Gold from single official source (BTMC) ──────────────
type RawGoldRow = {
  source: string
  name: string
  buy: number
  sell: number
}

const BTMC_GOLD_URL = 'https://btmc.vn/gia-vang-theo-ngay.html'

const GOLD_GROUPS: Array<{
  key: string
  label: string
  keywords: string[]
}> = [
  {
    key: 'mieng',
    label: 'Vàng Miếng',
    keywords: ['vàng miếng', 'miếng', 'sjc', 'vrtl'],
  },
  {
    key: 'nhan',
    label: 'Vàng Nhẫn',
    keywords: ['nhẫn', 'nhẫn tròn', 'tròn trơn', 'bản vị nhẫn'],
  },
  {
    key: 'nguyen_lieu',
    label: 'Vàng 24k / Nguyên liệu',
    keywords: ['24k', '999.9', '99.99', '99,99', 'nguyên liệu'],
  },
  {
    key: 'nu_trang',
    label: 'Vàng Nữ Trang',
    keywords: ['nữ trang', 'trang sức'],
  },
]

function parseVnNumber(input: string): number {
  const raw = String(input).trim()
  const compact = raw.replace(/\.(?=\d{3}(\D|$))/g, '').replace(/,/g, '')
  const numeric = compact.replace(/[^\d]/g, '')
  const value = Number(numeric)
  if (!Number.isFinite(value) || value <= 0) return 0
  return value < 1_000_000 ? value * 1_000 : value
}

function cleanupName(input: string): string {
  return input.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function dedupeRawRows(rows: RawGoldRow[]): RawGoldRow[] {
  const map = new Map<string, RawGoldRow>()
  for (const row of rows) {
    const key = `${row.source}::${row.name.toLowerCase()}`
    if (!map.has(key)) map.set(key, row)
  }
  return Array.from(map.values())
}

function parseBTMCRows(html: string): RawGoldRow[] {
  const compact = cleanupName(html.replace(/<[^>]+>/g, ' '))
  const rows: RawGoldRow[] = []

  const rowPattern = /([A-ZÀ-Ỵa-zà-ỵ0-9./,&()\-\s]{4,140}?)\s+(\d{2,3}(?:[.,]\d{3}){0,3})\s+(\d{2,3}(?:[.,]\d{3}){0,3})/g
  for (const match of compact.matchAll(rowPattern)) {
    const name = cleanupName(match[1])
    const lower = name.toLowerCase()
    const buy = parseVnNumber(match[2])
    const sell = parseVnNumber(match[3])

    if (!name || buy <= 0 || sell <= 0) continue
    if (name.length < 4 || name.length > 120) continue
    if (/giá vàng|khu vực|hanoi|đvt|vnđ|read more|xem thêm|cập nhật/i.test(lower)) continue
    if (/ngày \d{1,2}[/-]\d{1,2}[/-]\d{4}/i.test(lower)) continue

    rows.push({ source: 'BTMC', name, buy, sell })
  }

  return dedupeRawRows(rows)
}

function scoreRow(row: RawGoldRow, group: (typeof GOLD_GROUPS)[number]): number {
  const name = row.name.toLowerCase()
  let score = 0

  for (const keyword of group.keywords) {
    if (name.includes(keyword.toLowerCase())) score += keyword.length * 3
  }

  if (group.key === 'mieng' && /nhẫn|nữ trang|trang sức|nguyên liệu/i.test(name)) score -= 20
  if (group.key === 'nhan' && /nữ trang|trang sức|nguyên liệu/i.test(name)) score -= 12
  if (group.key === 'nguyen_lieu' && /nhẫn|nữ trang|trang sức/i.test(name)) score -= 8
  if (group.key === 'nu_trang' && /nhẫn|nguyên liệu/i.test(name)) score -= 8

  return score
}

function mapRowsToGoldCards(rows: RawGoldRow[]): VNGoldPrice[] {
  const updatedAt = new Date().toISOString()

  return GOLD_GROUPS.map((group) => {
    const best = rows
      .map((row) => ({ row, score: scoreRow(row, group) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.row

    return {
      key: group.key,
      brand: group.label,
      sourceName: best?.name ?? '—',
      source: 'BTMC',
      buy: best?.buy ?? 0,
      sell: best?.sell ?? 0,
      change24h: 0,
      updatedAt,
    }
  })
}

async function fetchBTMCGoldRows(): Promise<RawGoldRow[]> {
  const res = await fetch(BTMC_GOLD_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MyDashboardBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`BTMC ${res.status}`)
  const html = await res.text()
  return parseBTMCRows(html)
}

export async function fetchVNGold(): Promise<VNGoldPrice[]> {
  try {
    const rows = await fetchBTMCGoldRows()
    if (!rows.length) return mockVNGold()

    const cards = mapRowsToGoldCards(rows)
    const hasRealData = cards.some((item) => item.buy > 0 && item.sell > 0)
    return hasRealData ? cards : mockVNGold()
  } catch {
    return mockVNGold()
  }
}

// ── Aggregate snapshot ────────────────────────────────────────────────────
export async function fetchMarketSnapshot(watchlist: string[]): Promise<MarketSnapshot> {
  const cryptoSymbols = watchlist.filter((s) => s !== 'XAU')
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

// ── Mock fallback ─────────────────────────────────────────────────────────
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
  const updatedAt = new Date().toISOString()
  return [
    {
      key: 'mieng',
      brand: 'Vàng Miếng',
      sourceName: 'VÀNG MIẾNG VRTL BẢO TÍN MINH CHÂU, 999.9 (24k)',
      source: 'BTMC',
      buy: 0,
      sell: 0,
      change24h: 0,
      updatedAt,
    },
    {
      key: 'nhan',
      brand: 'Vàng Nhẫn',
      sourceName: 'NHẪN TRÒN TRƠN BẢO TÍN MINH CHÂU, 999.9 (24k)',
      source: 'BTMC',
      buy: 0,
      sell: 0,
      change24h: 0,
      updatedAt,
    },
    {
      key: 'nguyen_lieu',
      brand: 'Vàng 24k / Nguyên liệu',
      sourceName: 'QUÀ MỪNG BẢN VỊ VÀNG BẢO TÍN MINH CHÂU, 999.9 (24k)',
      source: 'BTMC',
      buy: 0,
      sell: 0,
      change24h: 0,
      updatedAt,
    },
    {
      key: 'nu_trang',
      brand: 'Vàng Nữ Trang',
      sourceName: 'NỮ TRANG VÀNG 999.9 / 24k',
      source: 'BTMC',
      buy: 0,
      sell: 0,
      change24h: 0,
      updatedAt,
    },
  ]
}
