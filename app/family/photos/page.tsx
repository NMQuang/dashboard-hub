import type { Metadata } from 'next'
import { fetchGooglePhotosPage, fetchGoogleAlbums, getGooglePhotosStatus } from '@/services/googlePhotos'
import type { GooglePhotosStatus } from '@/services/googlePhotos'
import { getAllPhotos, getFamilyPhotoStories, getCachedGoogleAlbums, saveGoogleAlbumsCache } from '@/services/family-storage'
import { googlePhotoToDisplay, familyPhotoToDisplay } from '@/lib/familyPhotoUtils'
import PhotosHubClient from '@/components/family/PhotosHubClient'
import type { DisplayPhoto, FamilyPhotoStory, GooglePhotoAlbum } from '@/types/family'

export const metadata: Metadata = { title: 'Photos · Family' }
export const dynamic = 'force-dynamic'

const ALBUM_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

async function getAlbums(): Promise<GooglePhotoAlbum[]> {
  const cached = await getCachedGoogleAlbums()
  if (cached && Date.now() - new Date(cached.cachedAt).getTime() < ALBUM_CACHE_TTL_MS) {
    return cached.albums
  }
  const { albums } = await fetchGoogleAlbums()
  await saveGoogleAlbumsCache(albums).catch(() => {/* non-critical */})
  return albums
}

export default async function FamilyPhotosPage() {
  const [googleResult, r2Result, storiesResult, albumsResult, statusResult] = await Promise.allSettled([
    fetchGooglePhotosPage(100),
    getAllPhotos(),
    getFamilyPhotoStories(),
    getAlbums(),
    getGooglePhotosStatus(),
  ])

  const googleData = googleResult.status === 'fulfilled'
    ? googleResult.value
    : { photos: [], nextPageToken: undefined }

  const r2Photos     = r2Result.status === 'fulfilled'      ? r2Result.value        : []
  const stories      = storiesResult.status === 'fulfilled'  ? storiesResult.value   : []
  const albums       = albumsResult.status === 'fulfilled'   ? albumsResult.value    : []
  const googleStatus = statusResult.status === 'fulfilled'   ? statusResult.value    : 'not_configured' as GooglePhotosStatus

  const googleDisplay: DisplayPhoto[] = googleData.photos.map(googlePhotoToDisplay)
  const r2Display:     DisplayPhoto[] = r2Photos.map(familyPhotoToDisplay)

  // Merge — deduplicate by id, sort newest first
  const seen = new Set<string>()
  const merged: DisplayPhoto[] = []
  for (const p of [...googleDisplay, ...r2Display]) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      merged.push(p)
    }
  }
  merged.sort((a, b) => b.takenAt.localeCompare(a.takenAt))

  const statusLabel: Record<GooglePhotosStatus, string> = {
    ok:             `✓ Google Photos · ${googleDisplay.length}`,
    token_expired:  '⚠ Token hết hạn',
    not_configured: '🔧 Chưa kết nối',
  }

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
            family / photos
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
            Photos{' '}
            <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>{merged.length} ảnh</span>
          </h1>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'right', lineHeight: 1.7 }}>
          <div>{statusLabel[googleStatus]}</div>
          <div>Local · {r2Display.length} ảnh</div>
          {albums.length > 0 && <div>Albums · {albums.length}</div>}
        </div>
      </div>

      <PhotosHubClient
        initialPhotos={merged}
        initialStories={stories as FamilyPhotoStory[]}
        initialNextPageToken={googleData.nextPageToken}
        initialAlbums={albums as GooglePhotoAlbum[]}
        googleStatus={googleStatus}
      />
    </div>
  )
}
