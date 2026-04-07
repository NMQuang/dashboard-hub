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

  const res = await fetch(url, { headers, next: { revalidate: 60 } })
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

// ── Vietnam Domestic Gold via BTMC JSON API ───────────────────────────────
//
// BTMC loads prices via JavaScript on their public page.
// The underlying API endpoint returns JSON directly.
//
// Endpoint: GET https://btmc.vn/ProductHome/getGoldDate?date=DD/MM/YYYY
// Unit:     raw value × 10,000 = VND per lượng (37.5g)
// Values:   HTML-wrapped, e.g. "<b>16810</b>" → 168,100,000 VND/lượng

// BTMC API types
interface BTMCApiData {
  btmcvangmiengmua: string | null
  btmcvangmiengban: string | null
  btmcvangnhanmua: string | null
  btmcvangnhanban: string | null
  btmcvangquamungmua: string | null
  btmcvangquamungban: string | null
  sjcmua: string | null
  sjcban: string | null
  trangsucmua: string | null
  trangsucban: string | null
  trangsucmua1: string | null
  trangsucban1: string | null
  vangnguyenlieumua: string | null
  vangnguyenlieuban: string | null
  xemchitiet: string | null
}

interface BTMCApiResponse {
  Data: BTMCApiData
}

const BTMC_UNIT = 10_000 // multiply raw integer by this to get VND per lượng

const BTMC_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://btmc.vn/gia-vang-theo-ngay.html',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
} as const

// Strip HTML tags and multiply by unit multiplier
function parseBtmcValue(raw: string | null | undefined): number {
  if (!raw) return 0
  const numeric = raw.replace(/<[^>]+>/g, '').replace(/[,.\s]/g, '').trim()
  const n = Number(numeric)
  return Number.isFinite(n) && n > 0 ? n * BTMC_UNIT : 0
}

// Returns a date in Vietnam timezone (UTC+7) as DD/MM/YYYY, offset by daysAgo
function getVnDateString(daysAgo = 0): string {
  const now = new Date()
  const vnMs = now.getTime() + 7 * 60 * 60 * 1000 - daysAgo * 24 * 60 * 60 * 1000
  const vnTime = new Date(vnMs)
  const day = String(vnTime.getUTCDate()).padStart(2, '0')
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0')
  const year = vnTime.getUTCFullYear()
  return `${day}/${month}/${year}`
}

// Fetches BTMC data for a specific date. Returns null if no data (weekend / holiday).
async function fetchBtmcForDate(dateStr: string): Promise<BTMCApiData | null> {
  try {
    const url = `https://btmc.vn/ProductHome/getGoldDate?date=${encodeURIComponent(dateStr)}`
    const res = await fetch(url, { headers: BTMC_HEADERS, next: { revalidate: 1800 } })
    if (!res.ok) return null
    const json = await res.json() as BTMCApiResponse
    const d = json.Data
    // Treat null/empty response as "no data for this date"
    return (d.btmcvangmiengban ?? d.btmcvangnhanban ?? d.sjcban) ? d : null
  } catch {
    return null
  }
}

// % change in sell price between today and previous trading day
function calcChange(todaySell: string | null | undefined, prevSell: string | null | undefined): number {
  const t = parseBtmcValue(todaySell)
  const p = parseBtmcValue(prevSell)
  if (t <= 0 || p <= 0) return 0
  return ((t - p) / p) * 100
}

export async function fetchVNGold(): Promise<VNGoldPrice[]> {
  try {
    // Fetch today and yesterday in parallel
    const [todayResult, prevResult] = await Promise.allSettled([
      fetchBtmcForDate(getVnDateString(0)),
      fetchBtmcForDate(getVnDateString(1)),
    ])

    const today = todayResult.status === 'fulfilled' ? todayResult.value : null
    let prev = prevResult.status === 'fulfilled' ? prevResult.value : null

    // BTMC closes on weekends/holidays — walk back up to 3 more days to find last trading day
    if (!prev) {
      const [d2, d3] = await Promise.allSettled([
        fetchBtmcForDate(getVnDateString(2)),
        fetchBtmcForDate(getVnDateString(3)),
      ])
      prev = (d2.status === 'fulfilled' && d2.value)
        ? d2.value
        : (d3.status === 'fulfilled' && d3.value) ? d3.value : null
    }

    if (!today) return []

    const updatedAt = new Date().toISOString()

    return [
      {
        key: 'mieng',
        brand: 'Vàng Miếng BTMC',
        sourceName: 'VÀNG MIẾNG VRTL BẢO TÍN MINH CHÂU, 999.9',
        source: 'BTMC',
        buy: parseBtmcValue(today.btmcvangmiengmua),
        sell: parseBtmcValue(today.btmcvangmiengban),
        change24h: calcChange(today.btmcvangmiengban, prev?.btmcvangmiengban),
        updatedAt,
      },
      {
        key: 'nhan',
        brand: 'Vàng Nhẫn',
        sourceName: 'NHẪN TRÒN TRƠN BẢO TÍN MINH CHÂU, 999.9',
        source: 'BTMC',
        buy: parseBtmcValue(today.btmcvangnhanmua),
        sell: parseBtmcValue(today.btmcvangnhanban),
        change24h: calcChange(today.btmcvangnhanban, prev?.btmcvangnhanban),
        updatedAt,
      },
      {
        key: 'nguyen_lieu',
        brand: 'Vàng SJC',
        sourceName: 'VÀNG MIẾNG SJC (qua BTMC)',
        source: 'SJC',
        buy: parseBtmcValue(today.sjcmua),
        sell: parseBtmcValue(today.sjcban),
        change24h: calcChange(today.sjcban, prev?.sjcban),
        updatedAt,
      },
      {
        key: 'nu_trang',
        brand: 'Vàng Nữ Trang',
        sourceName: 'NỮ TRANG VÀNG BẢO TÍN MINH CHÂU',
        source: 'BTMC',
        buy: parseBtmcValue(today.trangsucmua),
        sell: parseBtmcValue(today.trangsucban),
        change24h: calcChange(today.trangsucban, prev?.trangsucban),
        updatedAt,
      },
    ]
  } catch {
    return []
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
    vnGold: vnGold.status === 'fulfilled' ? vnGold.value : [],
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

