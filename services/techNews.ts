/**
 * services/techNews.ts
 * Fetches top AI/IT stories from Hacker News API (no auth needed).
 * Filters for Claude, AI, LLM, dev tools, and tech news.
 */

export interface TechNewsItem {
  id: number
  title: string
  url: string
  score: number
  by: string
  time: number        // unix timestamp
  descendants?: number
}

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

const AI_KEYWORDS = [
  'claude', 'anthropic', 'openai', 'gpt', 'llm', 'ai ', 'artificial intelligence',
  'gemini', 'mistral', 'llama', 'copilot', 'chatgpt', 'deepseek',
  'machine learning', 'neural', 'transformer', 'agent', 'rag',
]

function isAiOrTech(title: string): boolean {
  const lower = title.toLowerCase()
  return AI_KEYWORDS.some((kw) => lower.includes(kw))
}

function relativeTime(unixSec: number): string {
  const diffMs = Date.now() - unixSec * 1000
  const h = Math.floor(diffMs / (1000 * 60 * 60))
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

async function fetchItem(id: number): Promise<TechNewsItem | null> {
  try {
    const res = await fetch(`${HN_BASE}/item/${id}.json`, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    return res.json() as Promise<TechNewsItem>
  } catch {
    return null
  }
}

export async function fetchTechNews(maxItems = 8): Promise<(TechNewsItem & { timeAgo: string })[]> {
  try {
    // Fetch top story IDs
    const res = await fetch(`${HN_BASE}/topstories.json`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const ids = (await res.json() as number[]).slice(0, 80)

    // Fetch first batch of items in parallel
    const items = await Promise.all(ids.slice(0, 40).map(fetchItem))
    const valid = items.filter((x): x is TechNewsItem => x !== null && !!x.url && !!x.title)

    // Prefer AI/Claude stories, fill with general tech
    const aiItems = valid.filter((x) => isAiOrTech(x.title))
    const otherItems = valid.filter((x) => !isAiOrTech(x.title))

    const merged = [...aiItems, ...otherItems].slice(0, maxItems)
    return merged.map((item) => ({ ...item, timeAgo: relativeTime(item.time) }))
  } catch {
    return []
  }
}
