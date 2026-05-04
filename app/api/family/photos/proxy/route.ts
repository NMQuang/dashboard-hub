import { NextRequest, NextResponse } from 'next/server'
import { getPickedGooglePhotos } from '@/services/family-storage'
import { getStoredGoogleRefreshToken } from '@/services/family-storage'

const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()

// Cache the access token for its ~1h lifetime so we don't hit Google on every image request.
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

  const ttl = ((data.expires_in ?? 3600) - 120) * 1000 // expire 2 min early
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + ttl }
  return data.access_token
}

// GET /api/family/photos/proxy?id={photoId}&size=thumb|full
// Protected by middleware — requires family_auth cookie.
export async function GET(req: NextRequest) {
  const id   = req.nextUrl.searchParams.get('id')
  const size = req.nextUrl.searchParams.get('size') ?? 'thumb'
  if (!id) return new NextResponse('Missing id', { status: 400 })

  // Look up the stored Google CDN URL from KV
  const photos = await getPickedGooglePhotos()
  const photo  = photos.find(p => p.id === id)
  if (!photo) return new NextResponse('Photo not found', { status: 404 })

  const targetUrl = size === 'full' ? photo.url : photo.thumbnailUrl

  // Fetch from Google with OAuth token
  const accessToken = await getAccessToken()
  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {}

  const upstream = await fetch(targetUrl, { headers, cache: 'no-store' })
  if (!upstream.ok) {
    console.error('[photo-proxy] upstream failed', upstream.status, 'for photo', id)
    return new NextResponse('Upstream error', { status: upstream.status })
  }

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'
  const bytes = await upstream.arrayBuffer()

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      // Cache in browser for 1 hour; CDN can cache for up to 1 day.
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
