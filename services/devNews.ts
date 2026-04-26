/**
 * services/devNews.ts
 * Fetches IT/DEV articles from dev.to and Qiita public APIs.
 * No auth required for basic access on either platform.
 * Always resolves — never throws. Returns [] per source on failure.
 */
import type { DevNewsItem, DevNewsSource } from '@/types'

// ── dev.to ────────────────────────────────────────────────────────────────────

interface DevToUser {
  name: string
  username: string
}

interface DevToArticle {
  id: number
  title: string
  description: string
  url: string
  published_timestamp: string
  tag_list: string[]
  positive_reactions_count: number
  reading_time_minutes: number
  user: DevToUser
}

function isDevToArticle(val: unknown): val is DevToArticle {
  if (typeof val !== 'object' || val === null) return false
  const a = val as Record<string, unknown>
  return (
    typeof a['id'] === 'number' &&
    typeof a['title'] === 'string' &&
    typeof a['url'] === 'string' &&
    typeof a['published_timestamp'] === 'string'
  )
}

/**
 * Fetches top trending articles from dev.to for given tags.
 * Uses `top=7` (top in last 7 days) for fresh content.
 */
async function fetchDevToByTag(tag: string, perPage = 5): Promise<DevNewsItem[]> {
  const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&top=7&per_page=${perPage}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`dev.to ${res.status} tag=${tag}`)

  const raw: unknown = await res.json()
  if (!Array.isArray(raw)) return []

  const items: DevNewsItem[] = []
  for (const item of raw) {
    if (!isDevToArticle(item)) continue
    items.push({
      title: item.title,
      url: item.url,
      source: 'dev.to',
      author: item.user.name ?? item.user.username,
      summary: item.description || undefined,
      tags: Array.isArray(item.tag_list) ? item.tag_list.slice(0, 4) : [],
      reactions: item.positive_reactions_count,
      publishedAt: item.published_timestamp,
      readingTime: item.reading_time_minutes,
    })
  }
  return items
}

/**
 * Fetches from multiple dev.to tags, deduplicates by url, returns top N by reactions.
 */
async function fetchDevTo(maxItems = 8): Promise<DevNewsItem[]> {
  const tags = ['ai', 'programming', 'webdev', 'devops']
  const results = await Promise.allSettled(tags.map((tag) => fetchDevToByTag(tag, 10)))

  const seen = new Set<string>()
  const all: DevNewsItem[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (!seen.has(item.url)) {
        seen.add(item.url)
        all.push(item)
      }
    }
  }

  // Sort by reactions descending, take top N
  all.sort((a, b) => b.reactions - a.reactions)
  return all.slice(0, maxItems)
}

// ── Qiita ─────────────────────────────────────────────────────────────────────

interface QiitaUser {
  id: string
  name: string
}

interface QiitaTag {
  name: string
}

interface QiitaItem {
  id: string
  title: string
  url: string
  created_at: string
  likes_count: number
  tags: QiitaTag[]
  user: QiitaUser
}

function isQiitaItem(val: unknown): val is QiitaItem {
  if (typeof val !== 'object' || val === null) return false
  const a = val as Record<string, unknown>
  return (
    typeof a['id'] === 'string' &&
    typeof a['title'] === 'string' &&
    typeof a['url'] === 'string' &&
    typeof a['created_at'] === 'string'
  )
}

/**
 * Fetches latest Qiita articles for a tag query.
 */
async function fetchQiitaByTag(tag: string, perPage = 5): Promise<DevNewsItem[]> {
  const url = `https://qiita.com/api/v2/items?page=1&per_page=${perPage}&query=${encodeURIComponent(`tag:${tag}`)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Qiita ${res.status} tag=${tag}`)

  const raw: unknown = await res.json()
  if (!Array.isArray(raw)) return []

  const items: DevNewsItem[] = []
  for (const item of raw) {
    if (!isQiitaItem(item)) continue
    items.push({
      title: item.title,
      url: item.url,
      source: 'Qiita',
      author: item.user.name || item.user.id,
      tags: Array.isArray(item.tags) ? item.tags.map((t) => t.name).slice(0, 4) : [],
      reactions: item.likes_count,
      publishedAt: item.created_at,
    })
  }
  return items
}

/**
 * Fetches from multiple Qiita tags, deduplicates, returns top N by likes.
 */
async function fetchQiita(maxItems = 8): Promise<DevNewsItem[]> {
  const tags = ['AI', 'TypeScript', 'Python', 'プログラミング']
  const results = await Promise.allSettled(tags.map((tag) => fetchQiitaByTag(tag, 8)))

  const seen = new Set<string>()
  const all: DevNewsItem[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (!seen.has(item.url)) {
        seen.add(item.url)
        all.push(item)
      }
    }
  }

  all.sort((a, b) => b.reactions - a.reactions)
  return all.slice(0, maxItems)
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface DevNewsBySource {
  devTo: DevNewsItem[]
  qiita: DevNewsItem[]
}

/**
 * Fetches IT/DEV articles from dev.to and Qiita in parallel.
 * Each source always resolves (empty array on failure).
 */
export async function fetchDevNewsBySource(): Promise<DevNewsBySource> {
  const [devToResult, qiitaResult] = await Promise.allSettled([
    fetchDevTo(),
    fetchQiita(),
  ])

  return {
    devTo: devToResult.status === 'fulfilled' ? devToResult.value : [],
    qiita: qiitaResult.status === 'fulfilled' ? qiitaResult.value : [],
  }
}

/**
 * Convenience: flat list of all dev news items sorted by publishedAt desc.
 * Always resolves.
 */
export async function fetchDevNews(): Promise<DevNewsItem[]> {
  const { devTo, qiita } = await fetchDevNewsBySource()
  const combined: DevNewsItem[] = []
  for (const item of devTo) combined.push(item)
  for (const item of qiita) combined.push(item)
  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  return combined
}

export type { DevNewsSource }
