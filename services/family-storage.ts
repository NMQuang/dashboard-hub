/**
 * Family data storage via Vercel KV (Redis).
 * All keys are namespaced under "family:" to avoid collisions.
 *
 * Key schema:
 *   family:photos          → FamilyPhoto[] (full list)
 *   family:photo:{id}      → FamilyPhoto   (single)
 *   family:albums          → PhotoAlbum[]
 *   family:checkins:{YYYY-MM} → DailyCheckIn[] (by month)
 *   family:events          → FamilyEvent[]
 *   family:tasks           → FamilyTask[]
 *   family:budget:{YYYY-MM} → BudgetEntry[]
 *   family:stories         → PhotoStory[]
 */

import type {
  FamilyPhoto, PhotoAlbum, DailyCheckIn,
  FamilyEvent, FamilyTask, BudgetEntry, PhotoStory,
} from './family-types'

// ── KV client (Vercel KV / Upstash Redis) ────────────────────────────────
// We use fetch-based REST API so it works without @vercel/kv package.
// Set FAMILY_KV_REST_API_URL + FAMILY_KV_REST_API_TOKEN in .env.local

const KV_URL   = process.env.FAMILY_KV_REST_API_URL ?? ''
const KV_TOKEN = process.env.FAMILY_KV_REST_API_TOKEN ?? ''

async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_URL) return null
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    next: { revalidate: 0 }, // always fresh
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.result === null) return null
  try { return JSON.parse(data.result) as T } catch { return null }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (!KV_URL) return
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(value)),
  })
}

// ── Photos ────────────────────────────────────────────────────────────────

export async function getAllPhotos(): Promise<FamilyPhoto[]> {
  return (await kvGet<FamilyPhoto[]>('family:photos')) ?? []
}

export async function getPhoto(id: string): Promise<FamilyPhoto | null> {
  return kvGet<FamilyPhoto>(`family:photo:${id}`)
}

export async function savePhoto(photo: FamilyPhoto): Promise<void> {
  await kvSet(`family:photo:${photo.id}`, photo)
  const all = await getAllPhotos()
  const idx = all.findIndex(p => p.id === photo.id)
  if (idx >= 0) all[idx] = photo
  else all.unshift(photo)
  await kvSet('family:photos', all)
}

export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  const photo = await getPhoto(id)
  if (!photo) return
  await savePhoto({ ...photo, caption, captionGeneratedAt: new Date().toISOString() })
}

export async function deletePhoto(id: string): Promise<void> {
  const all = await getAllPhotos()
  await kvSet('family:photos', all.filter(p => p.id !== id))
}

export async function getPhotosByTag(tag: string): Promise<FamilyPhoto[]> {
  const all = await getAllPhotos()
  return all.filter(p => p.tags.includes(tag))
}

// Group photos by YYYY-MM for timeline view
export function groupByMonth(photos: FamilyPhoto[]): Record<string, FamilyPhoto[]> {
  const groups: Record<string, FamilyPhoto[]> = {}
  for (const p of photos) {
    const month = p.takenAt.slice(0, 7) // YYYY-MM
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  }
  return groups
}

// ── Albums ────────────────────────────────────────────────────────────────

export async function getAlbums(): Promise<PhotoAlbum[]> {
  return (await kvGet<PhotoAlbum[]>('family:albums')) ?? []
}

export async function saveAlbum(album: PhotoAlbum): Promise<void> {
  const all = await getAlbums()
  const idx = all.findIndex(a => a.id === album.id)
  if (idx >= 0) all[idx] = album
  else all.push(album)
  await kvSet('family:albums', all)
}

// ── Check-ins ─────────────────────────────────────────────────────────────

export async function getCheckIns(yearMonth: string): Promise<DailyCheckIn[]> {
  return (await kvGet<DailyCheckIn[]>(`family:checkins:${yearMonth}`)) ?? []
}

export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  const ym = checkIn.date.slice(0, 7)
  const all = await getCheckIns(ym)
  const idx = all.findIndex(c => c.id === checkIn.id)
  if (idx >= 0) all[idx] = checkIn
  else all.unshift(checkIn)
  await kvSet(`family:checkins:${ym}`, all)
}

export async function getRecentCheckIns(days = 14): Promise<DailyCheckIn[]> {
  const months = new Set<string>()
  for (let i = 0; i <= days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    months.add(d.toISOString().slice(0, 7))
  }
  const results = await Promise.all([...months].map(m => getCheckIns(m)))
  return results.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, days)
}

// ── Events ────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<FamilyEvent[]> {
  return (await kvGet<FamilyEvent[]>('family:events')) ?? []
}

export async function saveEvent(event: FamilyEvent): Promise<void> {
  const all = await getEvents()
  const idx = all.findIndex(e => e.id === event.id)
  if (idx >= 0) all[idx] = event
  else all.push(event)
  all.sort((a, b) => a.date.localeCompare(b.date))
  await kvSet('family:events', all)
}

export async function deleteEvent(id: string): Promise<void> {
  const all = await getEvents()
  await kvSet('family:events', all.filter(e => e.id !== id))
}

export async function getUpcomingEvents(days = 30): Promise<FamilyEvent[]> {
  const all = await getEvents()
  const now = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
  return all.filter(e => e.date >= now && e.date <= limit)
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<FamilyTask[]> {
  return (await kvGet<FamilyTask[]>('family:tasks')) ?? []
}

export async function saveTask(task: FamilyTask): Promise<void> {
  const all = await getTasks()
  const idx = all.findIndex(t => t.id === task.id)
  if (idx >= 0) all[idx] = task
  else all.push(task)
  await kvSet('family:tasks', all)
}

export async function deleteTask(id: string): Promise<void> {
  const all = await getTasks()
  await kvSet('family:tasks', all.filter(t => t.id !== id))
}

// ── Budget ────────────────────────────────────────────────────────────────

export async function getBudgetEntries(yearMonth: string): Promise<BudgetEntry[]> {
  return (await kvGet<BudgetEntry[]>(`family:budget:${yearMonth}`)) ?? []
}

export async function saveBudgetEntry(entry: BudgetEntry): Promise<void> {
  const ym = entry.date.slice(0, 7)
  const all = await getBudgetEntries(ym)
  const idx = all.findIndex(e => e.id === entry.id)
  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)
  await kvSet(`family:budget:${ym}`, all)
}

// ── Stories ───────────────────────────────────────────────────────────────

export async function getStories(): Promise<PhotoStory[]> {
  return (await kvGet<PhotoStory[]>('family:stories')) ?? []
}

export async function saveStory(story: PhotoStory): Promise<void> {
  const all = await getStories()
  const idx = all.findIndex(s => s.id === story.id)
  if (idx >= 0) all[idx] = story
  else all.unshift(story)
  await kvSet('family:stories', all)
}
