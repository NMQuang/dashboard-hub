import { NextRequest, NextResponse } from 'next/server'
import { getStoryByToken, getAllPhotos, getPickedGooglePhotos } from '@/services/family-storage'

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

// GET /api/story/[token] — public, no auth required
// Returns story metadata + resolved photo thumbnail URLs
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const story = await getStoryByToken(token)
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  // Resolve thumbnail URLs for each photoId so the public page can render covers
  const [localPhotos, googlePhotos] = await Promise.all([getAllPhotos(), getPickedGooglePhotos()])

  const localById  = new Map(localPhotos.map(p => [p.id, p]))
  const googleById = new Map(googlePhotos.map(p => [p.id, p]))

  const photoThumbs: Record<string, string> = {}
  for (const id of story.photoIds) {
    const local = localById.get(id)
    if (local) {
      const ext = local.filename.split('.').pop() ?? 'jpg'
      photoThumbs[id] = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/photos/${id}.${ext}` : ''
      continue
    }
    const google = googleById.get(id)
    if (google) {
      // Use the /api/story/[token]/photo proxy for Google CDN images
      photoThumbs[id] = `/api/story/${encodeURIComponent(token)}/photo?photoId=${encodeURIComponent(id)}&size=thumb`
    }
  }

  return NextResponse.json({ story, photoThumbs })
}
