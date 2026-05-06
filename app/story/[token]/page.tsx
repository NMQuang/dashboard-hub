import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoryByToken, getAllPhotos, getPickedGooglePhotos } from '@/services/family-storage'

export const dynamic = 'force-dynamic'

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

interface Props {
  params: { token: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await getStoryByToken(params.token)
  if (!story) return { title: 'Story not found' }
  return { title: story.title, description: story.description }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}

export default async function PublicStoryPage({ params }: Props) {
  const { token } = params
  const story = await getStoryByToken(token)
  if (!story) notFound()

  const [localPhotos, googlePhotos] = await Promise.all([getAllPhotos(), getPickedGooglePhotos()])
  const localById  = new Map(localPhotos.map(p => [p.id, p]))
  const googleById = new Map(googlePhotos.map(p => [p.id, p]))

  const resolveThumb = (id: string): string => {
    const local = localById.get(id)
    if (local) {
      const ext = local.filename.split('.').pop() ?? 'jpg'
      return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/photos/${id}.${ext}` : ''
    }
    if (googleById.has(id)) {
      return `/api/story/${encodeURIComponent(token)}/photo?photoId=${encodeURIComponent(id)}&size=thumb`
    }
    return ''
  }

  const coverIds   = story.photoIds.slice(0, 4)
  const totalCount = story.photoIds.length

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Cover */}
        <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: '#e5e5e5' }}>
            {Array.from({ length: 4 }, (_, i) => {
              const id   = coverIds[i]
              const src  = id ? resolveThumb(id) : ''
              return src ? (
                <img
                  key={id}
                  src={src}
                  alt=""
                  style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div key={i} style={{ height: 200, background: '#e5e5e5' }} />
              )
            })}
          </div>
        </div>

        {/* Story info */}
        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {story.title}
        </h1>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#888', marginBottom: 20 }}>
          <span>{totalCount} ảnh</span>
          {story.location && <span>📍 {story.location}</span>}
          {story.dateFrom && (
            <span>
              {fmtDate(story.dateFrom)}
              {story.dateTo && story.dateTo !== story.dateFrom ? ` – ${fmtDate(story.dateTo)}` : ''}
            </span>
          )}
        </div>

        {story.description && (
          <p style={{ fontSize: 16, color: '#444', lineHeight: 1.75, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {story.description}
          </p>
        )}

        {story.notes && (
          <div style={{
            background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12,
            padding: '16px 20px', fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {story.notes}
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e5e5', fontSize: 12, color: '#bbb', textAlign: 'center' }}>
          Shared via Family Hub · {fmtDate(story.createdAt)}
        </div>
      </div>
    </div>
  )
}
