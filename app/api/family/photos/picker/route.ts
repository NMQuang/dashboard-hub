import { NextRequest, NextResponse } from 'next/server'
import { getStoredGoogleRefreshToken, savePickedGooglePhotos } from '@/services/family-storage'
import { createPickerSession, getPickerSession, getPickerMediaItems } from '@/services/googlePhotosPicker'
import type { GoogleFamilyPhoto } from '@/types'

export const maxDuration = 60

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

// PUT { sessionId } — fetch selected items and save Google CDN URLs to KV
// No R2 download — photos are served directly from Google's CDN.
// baseUrl from Picker API is a time-limited CDN URL; re-sync to refresh.
export async function PUT(req: NextRequest) {
  const body = await req.json() as { sessionId?: string }
  const { sessionId } = body
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const items = await getPickerMediaItems(accessToken, sessionId)
    const imageItems = items.filter(item => item.mediaFile.mimeType.startsWith('image/'))

    console.info('[picker] saving', imageItems.length, 'photos (Google CDN URLs) to KV...')

    const photos: GoogleFamilyPhoto[] = imageItems.map(item => {
      const { id, createTime, mediaFile } = item
      const { baseUrl, mimeType, filename, mediaFileMetadata } = mediaFile
      return {
        id,
        url:          `${baseUrl}=d`,
        thumbnailUrl: `${baseUrl}=w400`,
        filename:     filename ?? `photo_${id}`,
        description:  undefined,
        takenAt:      createTime,
        createdAt:    createTime,
        mimeType,
        width:        mediaFileMetadata?.width  ?? 0,
        height:       mediaFileMetadata?.height ?? 0,
        source:       'google_photos' as const,
      }
    })

    await savePickedGooglePhotos(photos)
    console.info('[picker] saved', photos.length, 'photos to KV')
    return NextResponse.json({ count: photos.length, photos })
  } catch (err) {
    console.error('[picker] PUT error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
