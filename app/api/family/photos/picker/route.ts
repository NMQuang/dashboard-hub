import { NextRequest, NextResponse } from 'next/server'
import { getStoredGoogleRefreshToken, getPickedGooglePhotos, savePickedGooglePhotos } from '@/services/family-storage'
import { createPickerSession, getPickerSession, getPickerMediaItems } from '@/services/googlePhotosPicker'
import type { PickerMediaItem } from '@/services/googlePhotosPicker'
import { serverUploadToR2, deletePhotoFromR2, R2_CONFIGURED } from '@/services/family-r2'
import type { GoogleFamilyPhoto } from '@/types'

export const maxDuration = 60

const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? '').trim()

// Process picker items in batches to avoid overwhelming Vercel/R2 limits
async function inBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<Array<R | null>> {
  const results: Array<R | null> = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map(fn))
    for (const s of settled) {
      results.push(s.status === 'fulfilled' ? s.value : null)
    }
  }
  return results
}

// Returns null when the photo cannot be stored durably.
// Never stores ephemeral Google Picker CDN URLs — they expire with the session
// and cannot be refreshed via OAuth.
async function processPickerItem(
  item: PickerMediaItem,
  existingById: Map<string, GoogleFamilyPhoto>,
): Promise<GoogleFamilyPhoto | null> {
  const { id, createTime, mediaFile } = item
  const { baseUrl, mimeType, filename, mediaFileMetadata } = mediaFile
  const safeFilename = filename ?? `photo_${id}`
  const ext = safeFilename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeMime = mimeType || 'image/jpeg'

  // Already stored in R2 — reuse permanent URL, skip re-download
  const existing = existingById.get(id)
  if (existing && R2_PUBLIC_BASE && existing.url.startsWith(R2_PUBLIC_BASE)) {
    return existing
  }

  if (!R2_CONFIGURED) {
    console.warn(`[picker] R2 not configured — cannot persist photo ${id} durably; skipping`)
    return null
  }

  const r2Key = `google-photos/${id}.${ext}`

  // Two attempts: Google CDN can have transient failures
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const dlRes = await fetch(`${baseUrl}=d`, { cache: 'no-store' })
      if (!dlRes.ok) {
        console.warn(`[picker] Google download failed for ${id} (HTTP ${dlRes.status}), attempt ${attempt}`)
        if (attempt === 2) return null
        continue
      }
      const buffer = await dlRes.arrayBuffer()
      const r2Url = await serverUploadToR2(r2Key, buffer, safeMime)
      return {
        id,
        url:          r2Url,
        thumbnailUrl: r2Url,
        filename:     safeFilename,
        description:  undefined,
        takenAt:      createTime,
        createdAt:    createTime,
        mimeType:     safeMime,
        width:        mediaFileMetadata?.width  ?? 0,
        height:       mediaFileMetadata?.height ?? 0,
        source:       'google_photos' as const,
      }
    } catch (err) {
      console.warn(`[picker] R2 upload failed for ${id}, attempt ${attempt}:`, err)
      if (attempt === 2) return null
    }
  }

  return null
}

const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()

async function getAccessToken(): Promise<string | null> {
  const refreshToken =
    (process.env.GOOGLE_REFRESH_TOKEN ?? '').trim() ||
    ((await getStoredGoogleRefreshToken()) ?? '')
  if (!refreshToken) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }).toString(),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json() as { access_token?: string; error?: string }
  return data.access_token ?? null
}

// POST — create a new picker session
export async function POST() {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Google chưa được kết nối' }, { status: 401 })
    }
    const session = await createPickerSession(accessToken)
    return NextResponse.json({ sessionId: session.id, pickerUri: session.pickerUri })
  } catch (err) {
    console.error('[picker] POST error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET ?sessionId= — poll whether user has finished picking
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const session = await getPickerSession(accessToken, sessionId)
    return NextResponse.json({ done: session.mediaItemsSet })
  } catch (err) {
    console.error('[picker] GET error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT { sessionId } — fetch selected items, upload to R2 for permanent storage, save to KV.
// Picker baseUrls are session-scoped and expire — they are NEVER stored directly.
// Photos that fail R2 upload are skipped; count of skipped photos is returned as `failed`.
export async function PUT(req: NextRequest) {
  const body = await req.json() as { sessionId?: string }
  const { sessionId } = body
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const items = await getPickerMediaItems(accessToken, sessionId)
    const imageItems = items.filter(item => item.mediaFile.mimeType.startsWith('image/'))

    const existing = await getPickedGooglePhotos()
    const existingById = new Map(existing.map(p => [p.id, p]))

    console.info('[picker] processing', imageItems.length, 'photos (R2 upload enabled:', R2_CONFIGURED, ')...')

    const processed = await inBatches(imageItems, 5, item => processPickerItem(item, existingById))
    const photos = processed.filter((p): p is GoogleFamilyPhoto => p !== null)
    const failedCount = imageItems.length - photos.length

    // Merge — new/refreshed photos replace same IDs, keep others
    const newIds = new Set(photos.map(p => p.id))
    const merged = [...photos, ...existing.filter(p => !newIds.has(p.id))]

    const kvPersisted = await savePickedGooglePhotos(merged)
    const r2Count = photos.filter(p => R2_PUBLIC_BASE && p.url.startsWith(R2_PUBLIC_BASE)).length
    console.info(`[picker] saved ${photos.length} photos (R2: ${r2Count} permanent, failed: ${failedCount}, kvPersisted: ${String(kvPersisted)})`)

    return NextResponse.json({ count: photos.length, failed: failedCount, photos, kvPersisted })
  } catch (err) {
    console.error('[picker] PUT error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — clear all synced Google Photos from KV and attempt R2 cleanup
export async function DELETE() {
  try {
    const photos = await getPickedGooglePhotos()

    if (R2_CONFIGURED && R2_PUBLIC_BASE) {
      const r2Photos = photos.filter(p => p.url.startsWith(R2_PUBLIC_BASE))
      await Promise.allSettled(
        r2Photos.map(p => {
          const key = p.url.slice(R2_PUBLIC_BASE.length + 1)
          return deletePhotoFromR2(key)
        })
      )
    }

    await savePickedGooglePhotos([])
    return NextResponse.json({ ok: true, deleted: photos.length })
  } catch (err) {
    console.error('[picker] DELETE error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
