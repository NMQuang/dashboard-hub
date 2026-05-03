import { NextRequest, NextResponse } from 'next/server'
import { fetchGoogleAlbums } from '@/services/googlePhotos'
import { getCachedGoogleAlbums, saveGoogleAlbumsCache } from '@/services/family-storage'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// GET /api/family/photos/google-albums
// Returns cached albums (up to 1h old) or fetches fresh from Google Photos.
export async function GET() {
  try {
    const cached = await getCachedGoogleAlbums()
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime()
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ albums: cached.albums, cachedAt: cached.cachedAt, fromCache: true })
      }
    }

    const { albums } = await fetchGoogleAlbums()
    await saveGoogleAlbumsCache(albums)
    return NextResponse.json({ albums, cachedAt: new Date().toISOString(), fromCache: false })
  } catch (e) {
    console.error('[google-albums] GET error:', e)
    return NextResponse.json({ albums: [], error: String(e) }, { status: 500 })
  }
}

// POST /api/family/photos/google-albums
// Force-refresh albums from Google Photos, bypassing the cache.
export async function POST(_req: NextRequest) {
  try {
    const { albums } = await fetchGoogleAlbums()
    await saveGoogleAlbumsCache(albums)
    return NextResponse.json({ albums, cachedAt: new Date().toISOString(), fromCache: false })
  } catch (e) {
    console.error('[google-albums] POST error:', e)
    return NextResponse.json({ albums: [], error: String(e) }, { status: 500 })
  }
}
