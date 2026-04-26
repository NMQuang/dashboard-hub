// ── Market ──────────────────────────────────────
export interface AssetPrice {
  symbol: string
  name: string
  price: number
  change24h: number      // percentage
  currency: string       // 'USD' | 'JPY'
  updatedAt: string      // ISO string
}

export interface VNGoldPrice {
  key: string
  brand: string
  sourceName: string
  source?: string | null
  buy: number
  sell: number
  change24h: number
  updatedAt: string
}

export interface MarketSnapshot {
  gold: AssetPrice
  coins: AssetPrice[]
  forex: AssetPrice[]
  vnGold: VNGoldPrice[]
}

// ── AI News ──────────────────────────────────────
export type AiNewsProvider = 'claude' | 'openai' | 'gemini'

export interface AiNewsItem {
  title: string
  url: string
  source: string          // e.g. 'Anthropic Blog', 'OpenAI Blog'
  provider: AiNewsProvider
  summary?: string
  publishedAt: string     // ISO string
}

// ── Dev News ─────────────────────────────────────
export type DevNewsSource = 'dev.to' | 'Qiita'

export interface DevNewsItem {
  title: string
  url: string
  source: DevNewsSource
  author: string
  summary?: string
  tags: string[]
  reactions: number
  publishedAt: string       // ISO string
  readingTime?: number      // minutes (dev.to only)
}

// ── Gold News ────────────────────────────────────
export interface GoldNewsItem {
  title: string
  url: string
  publishedAt: string   // ISO string
  source: string        // e.g. 'VnExpress'
}

// ── Family Gold Holdings ─────────────────────────
// type must match VNGoldPrice.key values from services/market.ts GOLD_GROUPS
export type GoldType = 'mieng' | 'nhan' | 'nguyen_lieu' | 'nu_trang'

export interface GoldHolding {
  id: string
  purchasedAt: string   // YYYY-MM-DD
  type: GoldType
  quantity: number      // lượng (tael) — 1 lượng = 37.5g
  buyPrice: number      // VND / lượng at purchase time
  note?: string
}

export interface GoldPortfolioSummary {
  totalQuantity: number
  totalCostVND: number
  totalCurrentVND: number
  totalPnlVND: number
  totalPnlPct: number   // %
  updatedAt: string
}

// ── Weather ──────────────────────────────────────
export interface WeatherData {
  city: string
  country: string
  temp: number           // celsius
  feels_like: number
  humidity: number
  wind_speed: number
  description: string
  icon: string
}

// ── GitHub ───────────────────────────────────────
export interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  updated_at: string
  topics: string[]
  private: boolean
}

export interface GithubEvent {
  id: string
  type: string
  repo: { name: string; url: string }
  payload: {
    commits?: Array<{ message: string }>
    ref?: string
    action?: string
    number?: number                                          // top-level PR number GitHub sends
    pull_request?: { title?: string; number?: number }      // fields may be absent on truncated events
  }
  created_at: string
}

// ── AI Chat ──────────────────────────────────────
export type AIProvider = 'claude' | 'openai' | 'gemini'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  provider?: AIProvider
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  provider: AIProvider
  context?: string
  createdAt: string
  updatedAt: string
}

// ── Dify ─────────────────────────────────────────
export interface DifyWorkflow {
  id: string
  name: string
  description: string
  trigger: 'daily' | 'manual' | 'price_alert'
  lastRun: string | null
  nextRun: string | null
  status: 'active' | 'paused' | 'error'
}

export interface DifyRun {
  id: string
  workflowId: string
  status: 'running' | 'succeeded' | 'failed'
  output: string
  startedAt: string
  finishedAt: string | null
}

// ── Japanese / Onsite Phrases ────────────────────
export const ONSITE_CATEGORIES = [
  '会議', 'メール', '電話', '報告', '相談', '依頼', '謝罪', '確認',
] as const

export type OnsiteCategory = typeof ONSITE_CATEGORIES[number]

export type PhraseType = 'sample_phrase' | 'template' | 'scenario_example'
export type PhraseDifficulty = 'basic' | 'practical'

export interface JapanesePhrase {
  id: string
  category: OnsiteCategory
  japanese: string
  vietnamese?: string
  note?: string
  tags?: string[]
  phraseType?: PhraseType
  title?: string
  difficulty?: PhraseDifficulty
  categoryVi?: string
  createdAt: string
  updatedAt?: string
}

// ── Navigation ───────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: string
  children?: NavItem[]
}

// ── Settings ─────────────────────────────────────
export interface UserSettings {
  onsiteDate: string
  githubUsername: string
  watchlist: string[]
  preferredAI: AIProvider
  language: 'en' | 'vi' | 'ja'
  timezone: string
}
