/**
 * services/goldNews.ts
 * Fetches gold-related news from Vietnamese news RSS feeds.
 * Always returns an array — never throws.
 */
import type { GoldNewsItem } from '@/types'

// kinh-doanh/vang.rss was removed by VnExpress; use the business feed and filter locally
const VN_EXPRESS_RSS = 'https://vnexpress.net/rss/kinh-doanh.rss'

const GOLD_KEYWORDS = ['vàng', 'vang', 'btmc', 'sjc', 'pnj', 'kim loại quý', 'gia vang', 'giá vàng', 'vàng miếng', 'vàng nhẫn']

function isGoldRelated(title: string): boolean {
  const lower = title.toLowerCase()
  return GOLD_KEYWORDS.some((kw) => lower.includes(kw))
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

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseRssItems(xml: string, source: string, filterFn?: (title: string) => boolean): GoldNewsItem[] {
  const result: GoldNewsItem[] = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g)
  if (!itemMatches) return result

  for (const item of itemMatches.slice(0, 40)) {
    try {
      const rawTitle =
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
        item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''

      const rawLink =
        item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ??
        item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? ''

      const rawDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''

      const title = decodeEntities(rawTitle).trim()
      const url = rawLink.trim()

      if (!title || !url) continue
      if (filterFn && !filterFn(title)) continue
      if (result.length >= 8) break

      result.push({
        title,
        url,
        source,
        publishedAt: safeParsePubDate(rawDate),
      })
    } catch {
      // skip malformed item, continue parsing the rest
    }
  }

  return result
}

async function fetchVnExpressGold(): Promise<GoldNewsItem[]> {
  const res = await fetch(VN_EXPRESS_RSS, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardBot/1.0)' },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`VnExpress RSS ${res.status}`)
  const xml = await res.text()
  return parseRssItems(xml, 'VnExpress', isGoldRelated)
}

/**
 * Fetches gold news from Vietnamese news sources.
 * Always resolves — returns [] on all failures.
 */
export async function fetchGoldNews(): Promise<GoldNewsItem[]> {
  const results = await Promise.allSettled([fetchVnExpressGold()])

  const all: GoldNewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      all.push(...r.value)
    }
  }
  return all
}
