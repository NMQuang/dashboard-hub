import { NextRequest, NextResponse } from 'next/server'
import { getStoredGoogleRefreshToken, savePickedGooglePhotos } from '@/services/family-storage'
import { createPickerSession, getPickerSession, getPickerMediaItems } from '@/services/googlePhotosPicker'
import { getPresignedUploadUrl } from '@/services/family-r2'
import type { GoogleFamilyPhoto } from '@/types'
import type { PickerMediaItem } from '@/services/googlePhotosPicker'

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

// PUT { sessionId } — fetch selected items, download to R2, save to KV
export async function PUT(req: NextRequest) {
  const body = await req.json() as { sessionId?: string }
  const { sessionId } = body
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const items = await getPickerMediaItems(accessToken, sessionId)
    const imageItems = items.filter(item => item.mediaFile.mimeType.startsWith('image/'))

    console.info('[picker] downloading', imageItems.length, 'photos to R2...')

    // Download all photos to R2 in parallel (batches of 10)
    const photos: GoogleFamilyPhoto[] = []
    for (let i = 0; i < imageItems.length; i += 10) {
      const batch = imageItems.slice(i, i + 10)
      const results = await Promise.allSettled(batch.map(item => downloadToR2(item, accessToken)))
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) photos.push(r.value)
      }
    }

    await savePickedGooglePhotos(photos)
    console.info('[picker] saved', photos.length, 'photos to KV (R2 URLs)')
    return NextResponse.json({ count: photos.length, photos })
  } catch (err) {
    console.error('[picker] PUT error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadToR2(sourceUrl: string, key: string, contentType: string, authToken?: string): Promise<string> {
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)

  const fetchHeaders: Record<string, string> = {}
  if (authToken) fetchHeaders['Authorization'] = `Bearer ${authToken}`
  const imgRes = await fetch(sourceUrl, { headers: fetchHeaders, cache: 'no-store' })
  if (!imgRes.ok) throw new Error(`Fetch ${sourceUrl} failed: ${imgRes.status}`)

  const bytes = await imgRes.arrayBuffer()
  const r2Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  })
  if (!r2Res.ok) throw new Error(`R2 upload failed: ${r2Res.status}`)

  return publicUrl
}

async function downloadToR2(item: PickerMediaItem, authToken: string): Promise<GoogleFamilyPhoto | null> {
  const { id, createTime, mediaFile } = item
  const { baseUrl, mimeType, filename, mediaFileMetadata } = mediaFile
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'

  const fullKey  = `google-photos/${id}.${ext}`
  const thumbKey = `google-photos/${id}_thumb.jpg`

  const [fullResult, thumbResult] = await Promise.allSettled([
    uploadToR2(`${baseUrl}=w2048`, fullKey,  mimeType,       authToken),
    uploadToR2(`${baseUrl}=w400`,  thumbKey, 'image/jpeg',   authToken),
  ])

  if (fullResult.status === 'rejected') {
    console.error('[picker] full upload failed for', id, fullResult.reason)
  }
  if (thumbResult.status === 'rejected') {
    console.error('[picker] thumb upload failed for', id, thumbResult.reason)
  }

  const url          = fullResult.status  === 'fulfilled' ? fullResult.value  : null
  const thumbnailUrl = thumbResult.status === 'fulfilled' ? thumbResult.value : null

  // Skip this photo entirely if both failed
  if (!url && !thumbnailUrl) {
    console.error('[picker] skipping photo', id, '— both R2 uploads failed')
    return null
  }

  return {
    id,
    url:          url          ?? thumbnailUrl!,
    thumbnailUrl: thumbnailUrl ?? url!,
    filename:     filename ?? `photo_${id}.${ext}`,
    description:  undefined,
    takenAt:      createTime,
    createdAt:    createTime,
    mimeType,
    width:        mediaFileMetadata?.width  ?? 0,
    height:       mediaFileMetadata?.height ?? 0,
    source:       'google_photos' as const,
  }
}
