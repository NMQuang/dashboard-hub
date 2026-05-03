/**
 * Family data storage with resilient fallback.
 *
 * Primary storage:
 * - Vercel KV / Upstash Redis REST API
 *
 * Fallback storage:
 * - In-memory store (process-local)
 *
 * Why this design:
 * - Never crash the app if KV is misconfigured or temporarily unavailable
 * - Local development still works even without KV env vars
 * - UI should not get stuck just because persistence is down
 *
 * Env:
 * - FAMILY_KV_REST_API_URL
 * - FAMILY_KV_REST_API_TOKEN
 */

import type {
  FamilyPhoto,
  PhotoAlbum,
  DailyCheckIn,
  FamilyEvent,
  FamilyTask,
  BudgetEntry,
  PhotoStory,
  FamilyPhotoStory,
  GooglePhotoAlbum,
} from '@/types/family-types'
import type { GoogleFamilyPhoto } from '@/types'

const KV_URL = (process.env.FAMILY_KV_REST_API_URL ?? '').trim()
const KV_TOKEN = (process.env.FAMILY_KV_REST_API_TOKEN ?? '').trim()
const KV_ENABLED = Boolean(KV_URL && KV_TOKEN)

const REQUEST_TIMEOUT_MS = 8000

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

// Process-local fallback store.
// Good for local/dev and graceful degradation.
// Note: not shared across server instances and resets on restart/deploy.
const memoryStore = new Map<string, unknown>()

function logPrefix(scope: string) {
  return `[family-storage:${scope}]`
}

function withTimeout(signalMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), signalMs)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  }
}

function safeParseStoredValue<T>(value: unknown): T | null {
  if (value == null) return null

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      // In some cases the upstream may already store plain strings.
      // If T expects a string, this still works logically.
      return value as T
    }
  }

  return value as T
}

async function kvFetch(path: string, init?: RequestInit): Promise<Response | null> {
  if (!KV_ENABLED) return null

  const { signal, clear } = withTimeout()

  try {
    const res = await fetch(`${KV_URL}${path}`, {
      ...init,
      signal,
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })
    return res
  } catch (error) {
    console.error(logPrefix('kvFetch'), 'fetch failed:', error)
    return null
  } finally {
    clear()
  }
}

async function kvGet<T>(key: string): Promise<T | null> {
  // 1) Try KV first if configured
  if (KV_ENABLED) {
    const res = await kvFetch(`/get/${encodeURIComponent(key)}`)

    if (res?.ok) {
      try {
        const data = (await res.json()) as { result?: unknown }
        const parsed = safeParseStoredValue<T>(data?.result)
        if (parsed !== null) return parsed
      } catch (error) {
        console.error(logPrefix('kvGet'), `invalid JSON for key "${key}":`, error)
      }
    } else if (res) {
      console.warn(logPrefix('kvGet'), `KV returned ${res.status} for key "${key}"`)
    }
  } else {
    console.warn(logPrefix('kvGet'), 'KV disabled: missing FAMILY_KV_REST_API_URL or FAMILY_KV_REST_API_TOKEN')
  }

  // 2) Fallback to memory store
  return (memoryStore.get(key) as T | undefined) ?? null
}

async function kvSet(key: string, value: unknown): Promise<boolean> {
  // Always update memory fallback first, so local flow still works even if KV fails.
  memoryStore.set(key, value)

  if (!KV_ENABLED) {
    return true
  }

  const res = await kvFetch(`/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  })

  if (!res) {
    console.warn(logPrefix('kvSet'), `KV unavailable, wrote only to memory for key "${key}"`)
    return false
  }

  if (!res.ok) {
    console.warn(logPrefix('kvSet'), `KV set failed ${res.status} for key "${key}"`)
    return false
  }

  return true
}

async function kvDelete(key: string): Promise<boolean> {
  memoryStore.delete(key)

  if (!KV_ENABLED) {
    return true
  }

  const res = await kvFetch(`/del/${encodeURIComponent(key)}`, {
    method: 'POST',
  })

  if (!res) {
    console.warn(logPrefix('kvDelete'), `KV unavailable, deleted only from memory for key "${key}"`)
    return false
  }

  if (!res.ok) {
    console.warn(logPrefix('kvDelete'), `KV delete failed ${res.status} for key "${key}"`)
    return false
  }

  return true
}

// ── Photos ────────────────────────────────────────────────────────────────

export async function getAllPhotos(): Promise<FamilyPhoto[]> {
  const result = await kvGet<FamilyPhoto[]>('family:photos')
  return Array.isArray(result) ? result : []
}

export async function getPhoto(id: string): Promise<FamilyPhoto | null> {
  return kvGet<FamilyPhoto>(`family:photo:${id}`)
}

export async function savePhoto(photo: FamilyPhoto): Promise<void> {
  await kvSet(`family:photo:${photo.id}`, photo)

  const all = Array.from(await getAllPhotos())
  const idx = all.findIndex((p) => p.id === photo.id)

  if (idx >= 0) all[idx] = photo
  else all.unshift(photo)

  await kvSet('family:photos', all)
}

export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  const photo = await getPhoto(id)
  if (!photo) return

  await savePhoto({
    ...photo,
    caption,
    captionGeneratedAt: new Date().toISOString(),
  })
}

export async function deletePhoto(id: string): Promise<void> {
  await kvDelete(`family:photo:${id}`)

  const all = Array.from(await getAllPhotos())
  await kvSet(
    'family:photos',
    all.filter((p) => p.id !== id),
  )
}

export async function getPhotosByTag(tag: string): Promise<FamilyPhoto[]> {
  const all = Array.from(await getAllPhotos())
  return all.filter((p) => p.tags.includes(tag))
}

export function groupByMonth(photos: FamilyPhoto[]): Record<string, FamilyPhoto[]> {
  const groups: Record<string, FamilyPhoto[]> = {}

  for (const p of photos) {
    const month = p.takenAt.slice(0, 7)
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  }

  return groups
}

// ── Albums ────────────────────────────────────────────────────────────────

export async function getAlbums(): Promise<PhotoAlbum[]> {
  const result = await kvGet<PhotoAlbum[]>('family:albums')
  return Array.isArray(result) ? result : []
}

export async function saveAlbum(album: PhotoAlbum): Promise<void> {
  const all = Array.from(await getAlbums())
  const idx = all.findIndex((a) => a.id === album.id)

  if (idx >= 0) all[idx] = album
  else all.push(album)

  await kvSet('family:albums', all)
}

// ── Check-ins ─────────────────────────────────────────────────────────────

export async function getCheckIns(yearMonth: string): Promise<DailyCheckIn[]> {
  const result = await kvGet<DailyCheckIn[]>(`family:checkins:${yearMonth}`)
  return Array.isArray(result) ? result : []
}

export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  const ym = checkIn.date.slice(0, 7)
  const all = Array.from(await getCheckIns(ym))
  const idx = all.findIndex((c) => c.id === checkIn.id)

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

  const results = await Promise.all(Array.from(months).map((m) => getCheckIns(m)))
  return results
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days)
}

// ── Events ────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<FamilyEvent[]> {
  const result = await kvGet<FamilyEvent[]>('family:events')
  return Array.isArray(result) ? result : []
}

export async function saveEvent(event: FamilyEvent): Promise<void> {
  const all = Array.from(await getEvents())
  const idx = all.findIndex((e) => e.id === event.id)

  if (idx >= 0) all[idx] = event
  else all.push(event)

  all.sort((a, b) => a.date.localeCompare(b.date))
  await kvSet('family:events', all)
}

export async function deleteEvent(id: string): Promise<void> {
  const all = Array.from(await getEvents())
  await kvSet(
    'family:events',
    all.filter((e) => e.id !== id),
  )
}

export async function getUpcomingEvents(days = 30): Promise<FamilyEvent[]> {
  const all = Array.from(await getEvents())
  const now = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

  return all.filter((e) => e.date >= now && e.date <= limit)
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<FamilyTask[]> {
  const result = await kvGet<FamilyTask[]>('family:tasks')
  return Array.isArray(result) ? result : []
}

export async function saveTask(task: FamilyTask): Promise<void> {
  const all = Array.from(await getTasks())
  const idx = all.findIndex((t) => t.id === task.id)

  if (idx >= 0) all[idx] = task
  else all.push(task)

  await kvSet('family:tasks', all)
}

export async function deleteTask(id: string): Promise<void> {
  const all = Array.from(await getTasks())
  await kvSet(
    'family:tasks',
    all.filter((t) => t.id !== id),
  )
}

// ── Budget ────────────────────────────────────────────────────────────────

export async function getBudgetEntries(yearMonth: string): Promise<BudgetEntry[]> {
  const result = await kvGet<BudgetEntry[]>(`family:budget:${yearMonth}`)
  return Array.isArray(result) ? result : []
}

export async function saveBudgetEntry(entry: BudgetEntry): Promise<void> {
  const ym = entry.date.slice(0, 7)
  const all = Array.from(await getBudgetEntries(ym))
  const idx = all.findIndex((e) => e.id === entry.id)

  if (idx >= 0) all[idx] = entry
  else all.unshift(entry)

  await kvSet(`family:budget:${ym}`, all)
}

// ── Stories ───────────────────────────────────────────────────────────────

export async function getStories(): Promise<PhotoStory[]> {
  const result = await kvGet<PhotoStory[]>('family:stories')
  return Array.isArray(result) ? result : []
}

export async function saveStory(story: PhotoStory): Promise<void> {
  const all = Array.from(await getStories())
  const idx = all.findIndex((s) => s.id === story.id)

  if (idx >= 0) all[idx] = story
  else all.unshift(story)

  await kvSet('family:stories', all)
}

// ── Family Photo Stories (source-agnostic, used by /family/photos hub) ────────
// Stored separately from legacy 'family:stories' to avoid type conflicts.

export async function getFamilyPhotoStories(): Promise<FamilyPhotoStory[]> {
  const result = await kvGet<FamilyPhotoStory[]>('family:photo_stories')
  return Array.isArray(result) ? result : []
}

export async function saveFamilyPhotoStory(story: FamilyPhotoStory): Promise<void> {
  const all = Array.from(await getFamilyPhotoStories())
  const idx = all.findIndex((s) => s.id === story.id)

  if (idx >= 0) all[idx] = story
  else all.unshift(story)

  await kvSet('family:photo_stories', all)
}

export async function deleteFamilyPhotoStory(id: string): Promise<void> {
  const all = Array.from(await getFamilyPhotoStories())
  await kvSet('family:photo_stories', all.filter((s) => s.id !== id))
}

// ── Google OAuth token store ──────────────────────────────────────────────────
// Allows storing the refresh_token in KV so the setup page can persist it
// without requiring .env.local to be manually edited.

export async function getStoredGoogleRefreshToken(): Promise<string | null> {
  return kvGet<string>('google_oauth:refresh_token')
}

export async function saveStoredGoogleRefreshToken(token: string): Promise<void> {
  await kvSet('google_oauth:refresh_token', token)
}

export async function deleteStoredGoogleRefreshToken(): Promise<void> {
  await kvDelete('google_oauth:refresh_token')
}

// ── Google Albums cache ───────────────────────────────────────────────────────
// Cached list of Google Photos albums with a timestamp for cache validation.

interface GoogleAlbumsCache {
  albums: GooglePhotoAlbum[]
  cachedAt: string
}

export async function getCachedGoogleAlbums(): Promise<GoogleAlbumsCache | null> {
  return kvGet<GoogleAlbumsCache>('family:google_albums_cache')
}

export async function saveGoogleAlbumsCache(albums: GooglePhotoAlbum[]): Promise<void> {
  await kvSet('family:google_albums_cache', {
    albums,
    cachedAt: new Date().toISOString(),
  } satisfies GoogleAlbumsCache)
}

// ── Google Photos Picker — synced photos ──────────────────────────────────────
// Photos the user has selected via the Picker API flow, saved permanently in KV.

interface PickedPhotosStore {
  photos: GoogleFamilyPhoto[]
  syncedAt: string
}

export async function getPickedGooglePhotos(): Promise<GoogleFamilyPhoto[]> {
  const result = await kvGet<PickedPhotosStore>('family:google_picked_photos')
  return Array.isArray(result?.photos) ? result!.photos : []
}

export async function getPickedPhotosSyncedAt(): Promise<string | null> {
  const result = await kvGet<PickedPhotosStore>('family:google_picked_photos')
  return result?.syncedAt ?? null
}

export async function savePickedGooglePhotos(photos: GoogleFamilyPhoto[]): Promise<void> {
  await kvSet('family:google_picked_photos', {
    photos,
    syncedAt: new Date().toISOString(),
  } satisfies PickedPhotosStore)
}