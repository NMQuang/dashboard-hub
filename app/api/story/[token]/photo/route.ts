import { NextRequest, NextResponse } from 'next/server'
import { getStoryByToken, getPickedGooglePhotos } from '@/services/family-storage'
import { getStoredGoogleRefreshToken } from '@/services/family-storage'

const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()

let _tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token

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

  const data = await res.json() as { access_token?: string; expires_in?: number }
  if (!data.access_token) return null

  const ttl = ((data.expires_in ?? 3600) - 120) * 1000
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + ttl }
  return data.access_token
}

// GET /api/story/[token]/photo?photoId=xxx&size=thumb|full
// Public — validates shareToken, then proxies Google CDN image.
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params
  const photoId = req.nextUrl.searchParams.get('photoId')
  const size    = req.nextUrl.searchParams.get('size') ?? 'thumb'

  if (!photoId) return new NextResponse('Missing photoId', { status: 400 })

  const story = await getStoryByToken(token)
  if (!story) return new NextResponse('Story not found', { status: 404 })
  if (!story.photoIds.includes(photoId)) return new NextResponse('Photo not in story', { status: 403 })

  const photos = await getPickedGooglePhotos()
  const photo  = photos.find(p => p.id === photoId)
  if (!photo) return new NextResponse('Photo not found', { status: 404 })

  const targetUrl = size === 'full' ? photo.url : photo.thumbnailUrl

  const accessToken = await getAccessToken()
  const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const upstream = await fetch(targetUrl, { headers, cache: 'no-store' })
  if (!upstream.ok) return new NextResponse('Upstream error', { status: upstream.status })

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'
  const bytes = await upstream.arrayBuffer()

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
