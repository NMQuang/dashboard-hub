/**
 * services/aiNews.ts
 * Fetches latest AI news per provider.
 *
 * Sources:
 *   claude  → Hacker News top stories filtered for Anthropic/Claude
 *             (Anthropic does not publish an RSS feed)
 *   openai  → https://openai.com/news/rss.xml
 *   gemini  → https://blog.google/innovation-and-ai/technology/ai/rss/
 *
 * Always resolves — never throws. Returns [] on all failures.
 */
import type { AiNewsItem, AiNewsProvider } from '@/types'

// ── Hacker News helpers (for Anthropic / Claude) ─────────────────────────────

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

const CLAUDE_KEYWORDS = ['anthropic', 'claude', 'claude 3', 'claude 4', 'claude opus', 'claude sonnet', 'claude haiku']

function isAnthropicRelated(title: string): boolean {
  const lower = title.toLowerCase()
  return CLAUDE_KEYWORDS.some((kw) => lower.includes(kw))
}

function relativeIso(unixSec: number): string {
  try {
    return new Date(unixSec * 1000).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

interface HNItem {
  id: number
  title: string
  url?: string
  score: number
  by: string
  time: number
}

async function fetchHNItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_BASE}/item/${id}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json() as Promise<HNItem>
  } catch {
    return null
  }
}

async function fetchAnthropicViaHN(maxItems = 5): Promise<AiNewsItem[]> {
  const res = await fetch(`${HN_BASE}/topstories.json`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`HN topstories ${res.status}`)

  const allIds = (await res.json() as number[]).slice(0, 100)
  const items = await Promise.all(allIds.slice(0, 60).map(fetchHNItem))

  const matched = items
    .filter((x): x is HNItem => x !== null && !!x.url && !!x.title && isAnthropicRelated(x.title))
    .slice(0, maxItems)

  return matched.map((item) => ({
    title: item.title,
    url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
    source: 'Hacker News',
    provider: 'claude' as AiNewsProvider,
    publishedAt: relativeIso(item.time),
  }))
}

// ── RSS helpers (for OpenAI and Google) ──────────────────────────────────────

const RSS_SOURCES: Array<{ url: string; source: string; provider: AiNewsProvider }> = [
  {
    url: 'https://openai.com/news/rss.xml',
    source: 'OpenAI Blog',
    provider: 'openai',
  },
  {
    url: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    source: 'Google AI Blog',
    provider: 'gemini',
  },
]

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function safeParsePubDate(raw: string): string {
  if (!raw) return new Date().toISOString()
  try {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, '').trim()
}

function parseRssItems(xml: string, source: string, provider: AiNewsProvider, maxItems = 5): AiNewsItem[] {
  const result: AiNewsItem[] = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g)
  if (!itemMatches) return result

  for (const item of itemMatches) {
    if (result.length >= maxItems) break
    try {
      const rawTitle =
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
        item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''

      const rawLink =
        item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ??
        item.match(/<guid[^>]*isPermaLink="true"[^>]*>([\s\S]*?)<\/guid>/)?.[1] ??
        item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? ''

      const rawDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''

      const rawDesc =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''

      const title = decodeEntities(rawTitle).trim()
      const url = decodeEntities(rawLink).trim()

      if (!title || !url) continue

      const summary = stripHtml(decodeEntities(rawDesc)).slice(0, 160).trim() || undefined

      result.push({
        title,
        url,
        source,
        provider,
        summary,
        publishedAt: safeParsePubDate(rawDate),
      })
    } catch {
      // skip malformed item
    }
  }

  return result
}

async function fetchRssNews(rssUrl: string, source: string, provider: AiNewsProvider): Promise<AiNewsItem[]> {
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardBot/1.0)' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`RSS ${res.status} from ${rssUrl}`)
  const xml = await res.text()
  return parseRssItems(xml, source, provider)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches latest AI news from all providers.
 * Uses Promise.allSettled — partial failures return whatever is available.
 * Always resolves. Returns [] if everything fails.
 */
export async function fetchAiNews(): Promise<AiNewsItem[]> {
  const results = await Promise.allSettled([
    fetchAnthropicViaHN(),
    ...RSS_SOURCES.map(({ url, source, provider }) => fetchRssNews(url, source, provider)),
  ])

  const all: AiNewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        all.push(item)
      }
    }
  }
  return all
}

/**
 * Returns news grouped by provider.
 * Each provider key is always present (may be an empty array).
 */
export async function fetchAiNewsByProvider(): Promise<Record<AiNewsProvider, AiNewsItem[]>> {
  const items = await fetchAiNews()
  const grouped: Record<AiNewsProvider, AiNewsItem[]> = {
    claude: [],
    openai: [],
    gemini: [],
  }
  for (const item of items) {
    grouped[item.provider].push(item)
  }
  return grouped
}
