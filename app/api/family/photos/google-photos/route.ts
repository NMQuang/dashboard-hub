import { NextRequest, NextResponse } from 'next/server'
import { fetchGooglePhotosPage, fetchAlbumPhotos } from '@/services/googlePhotos'
import { googlePhotoToDisplay } from '@/lib/familyPhotoUtils'
import type { DisplayPhoto } from '@/types/family'

// GET /api/family/photos/google-photos?pageToken=...&pageSize=100&albumId=...
export async function GET(req: NextRequest) {
  const pageToken = req.nextUrl.searchParams.get('pageToken') ?? undefined
  const rawSize   = req.nextUrl.searchParams.get('pageSize') ?? '100'
  const pageSize  = Math.min(Math.max(1, parseInt(rawSize, 10) || 100), 100)
  const albumId   = req.nextUrl.searchParams.get('albumId') ?? undefined

  const { photos, nextPageToken } = albumId
    ? await fetchAlbumPhotos(albumId, pageSize, pageToken)
    : await fetchGooglePhotosPage(pageSize, pageToken)

  const displayPhotos: DisplayPhoto[] = photos.map(p => ({
    ...googlePhotoToDisplay(p),
    ...(albumId ? { googleAlbumId: albumId } : {}),
  }))

  return NextResponse.json({ photos: displayPhotos, nextPageToken })
}
