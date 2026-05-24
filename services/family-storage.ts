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
import { supabase } from '@/lib/supabase'

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
    console.warn(logPrefix('kvSet'), `KV disabled — key "${key}" saved to memory only (will not survive cold start)`)
    return false
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

// ── Photos — Supabase primary, KV fallback ────────────────────────────────

type PhotoRow = {
  id: string; filename: string; url: string; thumbnail_url: string
  taken_at: string; uploaded_at: string; uploaded_by: string
  tags: string[]; caption: string | null; location: string | null
  size_bytes: number; width: number; height: number
}
type GooglePhotoRow = {
  id: string; url: string; thumbnail_url: string; filename: string
  description: string | null; taken_at: string; created_at: string
  mime_type: string; width: number; height: number; synced_at: string
}

function photoToRow(p: FamilyPhoto): PhotoRow {
  return {
    id: p.id, filename: p.filename, url: p.url, thumbnail_url: p.thumbnailUrl,
    taken_at: p.takenAt, uploaded_at: p.uploadedAt, uploaded_by: p.uploadedBy,
    tags: p.tags, caption: p.caption ?? null, location: p.location ?? null,
    size_bytes: p.sizeBytes, width: p.width, height: p.height,
  }
}
function rowToPhoto(r: PhotoRow): FamilyPhoto {
  return {
    id: r.id, filename: r.filename, url: r.url, thumbnailUrl: r.thumbnail_url,
    takenAt: r.taken_at, uploadedAt: r.uploaded_at,
    uploadedBy: r.uploaded_by as 'me' | 'partner',
    tags: r.tags, caption: r.caption ?? undefined, location: r.location ?? undefined,
    sizeBytes: r.size_bytes, width: r.width, height: r.height, albumIds: [],
  }
}
function googlePhotoToRow(p: GoogleFamilyPhoto, syncedAt: string): GooglePhotoRow {
  return {
    id: p.id, url: p.url, thumbnail_url: p.thumbnailUrl, filename: p.filename,
    description: p.description ?? null, taken_at: p.takenAt, created_at: p.createdAt,
    mime_type: p.mimeType, width: p.width, height: p.height, synced_at: syncedAt,
  }
}
function rowToGooglePhoto(r: GooglePhotoRow): GoogleFamilyPhoto {
  return {
    id: r.id, url: r.url, thumbnailUrl: r.thumbnail_url, filename: r.filename,
    description: r.description ?? undefined, takenAt: r.taken_at, createdAt: r.created_at,
    mimeType: r.mime_type, width: r.width, height: r.height, source: 'google_photos' as const,
  }
}

export async function getAllPhotos(): Promise<FamilyPhoto[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_photos').select('*').order('taken_at', { ascending: false })
      if (error) throw error
      return (data as PhotoRow[]).map(rowToPhoto)
    } catch (err) { console.error(logPrefix('getAllPhotos'), err) }
  }
  const result = await kvGet<FamilyPhoto[]>('family:photos')
  return Array.isArray(result) ? result : []
}

export async function getPhoto(id: string): Promise<FamilyPhoto | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_photos').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data ? rowToPhoto(data as PhotoRow) : null
    } catch (err) { console.error(logPrefix('getPhoto'), err) }
  }
  return kvGet<FamilyPhoto>(`family:photo:${id}`)
}

export async function savePhoto(photo: FamilyPhoto): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('family_photos').upsert(photoToRow(photo))
      if (error) throw error
      return
    } catch (err) { console.error(logPrefix('savePhoto'), err) }
  }
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
  await savePhoto({ ...photo, caption, captionGeneratedAt: new Date().toISOString() })
}

export async function deletePhoto(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('family_photos').delete().eq('id', id)
      if (error) throw error
      return
    } catch (err) { console.error(logPrefix('deletePhoto'), err) }
  }
  await kvDelete(`family:photo:${id}`)
  const all = Array.from(await getAllPhotos())
  await kvSet('family:photos', all.filter((p) => p.id !== id))
}

export async function getPhotosByTag(tag: string): Promise<FamilyPhoto[]> {
  const all = await getAllPhotos()
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

export async function getStoryByToken(token: string): Promise<FamilyPhotoStory | null> {
  const all = await getFamilyPhotoStories()
  return all.find((s) => s.shareToken === token) ?? null
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

// ── Google Photos Picker — Supabase primary, KV fallback ──────────────────────

interface PickedPhotosStore {
  photos: GoogleFamilyPhoto[]
  syncedAt: string
}

export async function getPickedGooglePhotos(): Promise<GoogleFamilyPhoto[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_google_photos').select('*').order('taken_at', { ascending: false })
      if (error) throw error
      return (data as GooglePhotoRow[]).map(rowToGooglePhoto)
    } catch (err) { console.error(logPrefix('getPickedGooglePhotos'), err) }
  }
  const result = await kvGet<PickedPhotosStore>('family:google_picked_photos')
  return Array.isArray(result?.photos) ? result!.photos : []
}

export async function getPickedPhotosSyncedAt(): Promise<string | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_google_photos').select('synced_at').order('synced_at', { ascending: false }).limit(1)
      if (error) throw error
      return (data as { synced_at: string }[])[0]?.synced_at ?? null
    } catch (err) { console.error(logPrefix('getPickedPhotosSyncedAt'), err) }
  }
  const result = await kvGet<PickedPhotosStore>('family:google_picked_photos')
  return result?.syncedAt ?? null
}

export async function savePickedGooglePhotos(photos: GoogleFamilyPhoto[]): Promise<boolean> {
  if (supabase) {
    try {
      const syncedAt = new Date().toISOString()
      if (photos.length > 0) {
        const { error: upsertErr } = await supabase
          .from('family_google_photos')
          .upsert(photos.map(p => googlePhotoToRow(p, syncedAt)))
        if (upsertErr) throw upsertErr
        // Delete photos removed from the list
        const ids = photos.map(p => p.id)
        const { error: delErr } = await supabase
          .from('family_google_photos').delete().not('id', 'in', `(${ids.map(id => `"${id}"`).join(',')})`)
        if (delErr) throw delErr
      } else {
        // Clear all
        await supabase.from('family_google_photos').delete().neq('id', '')
      }
      return true
    } catch (err) { console.error(logPrefix('savePickedGooglePhotos'), err) }
  }
  return kvSet('family:google_picked_photos', {
    photos,
    syncedAt: new Date().toISOString(),
  } satisfies PickedPhotosStore)
}

export async function deletePickedGooglePhoto(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('family_google_photos').delete().eq('id', id)
      if (error) throw error
      return
    } catch (err) { console.error(logPrefix('deletePickedGooglePhoto'), err) }
  }
  const current = await getPickedGooglePhotos()
  await savePickedGooglePhotos(current.filter(p => p.id !== id))
}