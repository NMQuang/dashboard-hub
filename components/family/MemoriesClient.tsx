'use client'

import { useState, useRef } from 'react'
import type { FamilyPhoto, PhotoStory } from '@/types/family'

interface Tag { value: string; label: string; count: number }

interface Props {
  initialPhotos: FamilyPhoto[]
  byMonth: Record<string, FamilyPhoto[]>
  stories: PhotoStory[]
  tags: Tag[]
}

const MONTH_LABELS: Record<string, string> = {
  '01':'Tháng 1','02':'Tháng 2','03':'Tháng 3','04':'Tháng 4',
  '05':'Tháng 5','06':'Tháng 6','07':'Tháng 7','08':'Tháng 8',
  '09':'Tháng 9','10':'Tháng 10','11':'Tháng 11','12':'Tháng 12',
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTH_LABELS[m] ?? m} ${y}`
}

export default function MemoriesClient({ initialPhotos, byMonth, stories, tags }: Props) {
  const [activeTag, setActiveTag]   = useState('all')
  const [view, setView]             = useState<'timeline' | 'stories' | 'upload'>('timeline')
  const [photos, setPhotos]         = useState(initialPhotos)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [uploading, setUploading]   = useState(false)
  const [uploadMsg, setUploadMsg]   = useState('')
  const [lightbox, setLightbox]     = useState<FamilyPhoto | null>(null)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [localStories, setLocalStories]       = useState(stories)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter photos by tag
  const filtered = activeTag === 'all'
    ? photos
    : photos.filter(p => p.tags.includes(activeTag))

  // Group filtered photos by month
  const filteredByMonth: Record<string, FamilyPhoto[]> = {}
  for (const p of [...filtered].sort((a, b) => b.takenAt.localeCompare(a.takenAt))) {
    const m = p.takenAt.slice(0, 7)
    if (!filteredByMonth[m]) filteredByMonth[m] = []
    filteredByMonth[m].push(p)
  }
  const months = Object.keys(filteredByMonth).sort((a, b) => b.localeCompare(a))

  // Upload handler
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    if (!files.length) return
    setUploading(true)
    setUploadMsg(`Đang upload ${files.length} ảnh...`)

    for (const file of files) {
      try {
        // Get image dimensions
        const dims = await getImageDimensions(file)
        const takenAt = await getExifDate(file) ?? new Date().toISOString()

        // Request presigned URL
        const metaRes = await fetch('/api/family/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            takenAt,
            tags: activeTag !== 'all' ? [activeTag] : ['family'],
            uploadedBy: 'me',
            width: dims.width,
            height: dims.height,
            sizeBytes: file.size,
          }),
        })

        const { uploadUrl, photo } = await metaRes.json() as { uploadUrl: string; photo: FamilyPhoto }

        // Direct upload to R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        setPhotos(prev => [photo, ...prev])
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    setUploading(false)
    setUploadMsg(`✓ Upload xong ${files.length} ảnh. AI đang viết caption...`)
    setTimeout(() => setUploadMsg(''), 5000)
    e.target.value = ''
  }

  // Generate story from selected photos
  async function generateStory() {
    if (selected.size < 2) return
    setGeneratingStory(true)
    const res = await fetch('/api/family/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate-story', photoIds: [...selected], tag: activeTag !== 'all' ? activeTag : undefined }),
    })
    const { story } = await res.json() as { story: PhotoStory }
    setLocalStories(prev => [story, ...prev])
    setSelected(new Set())
    setView('stories')
    setGeneratingStory(false)
  }

  return (
    <div>
      {/* Tag bar — primary navigation */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tags.map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTag(t.value)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', border: '1px solid',
              borderColor: activeTag === t.value ? 'var(--ink)' : 'var(--border)',
              background: activeTag === t.value ? 'var(--ink)' : 'var(--surface)',
              color: activeTag === t.value ? '#fff' : 'var(--ink2)',
              fontWeight: activeTag === t.value ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            {t.label} {t.count > 0 && <span style={{ opacity: 0.6, fontSize: 11 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* View switcher + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {(['timeline', 'stories', 'upload'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: view === v ? 'var(--surface2)' : 'transparent',
            color: view === v ? 'var(--ink)' : 'var(--ink3)',
            fontWeight: view === v ? 500 : 400,
          }}>
            {v === 'timeline' ? '📅 Timeline' : v === 'stories' ? `✨ Stories (${localStories.length})` : '+ Upload'}
          </button>
        ))}
        {selected.size > 0 && (
          <button onClick={generateStory} disabled={generatingStory} style={{
            marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            background: '#EEEDFE', color: '#3C3489', border: '1px solid #AFA9EC', fontWeight: 500,
          }}>
            {generatingStory ? 'Đang tạo...' : `✨ Tạo story (${selected.size} ảnh)`}
          </button>
        )}
        {filtered.length > 0 && (
          <span className="font-mono" style={{ marginLeft: selected.size > 0 ? 0 : 'auto', fontSize: 11, color: 'var(--ink3)' }}>
            {filtered.length} ảnh
          </span>
        )}
      </div>

      {/* Upload message */}
      {uploadMsg && (
        <div style={{ padding: '8px 14px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {uploadMsg}
        </div>
      )}

      {/* ── Timeline view ── */}
      {view === 'timeline' && (
        <div>
          {months.length === 0 ? (
            <EmptyPhotos onUpload={() => setView('upload')} />
          ) : (
            months.map(month => (
              <div key={month} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {monthLabel(month)}
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 400 }}>
                    {filteredByMonth[month].length} ảnh
                  </span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                  {filteredByMonth[month].map(photo => (
                    <PhotoCell
                      key={photo.id}
                      photo={photo}
                      selected={selected.has(photo.id)}
                      onSelect={() => {
                        setSelected(prev => {
                          const next = new Set(prev)
                          next.has(photo.id) ? next.delete(photo.id) : next.add(photo.id)
                          return next
                        })
                      }}
                      onClick={() => setLightbox(photo)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Stories view ── */}
      {view === 'stories' && (
        <div>
          {localStories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 14 }}>Chọn ảnh trong Timeline rồi bấm "Tạo story"</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {localStories.map(story => (
                <div key={story.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Thumbnail grid from first 4 photos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: 120 }}>
                    {story.photoIds.slice(0, 4).map(pid => {
                      const p = photos.find(x => x.id === pid)
                      return p ? (
                        <img key={pid} src={p.thumbnailUrl || p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <div key={pid} style={{ background: 'var(--surface2)' }} />
                    })}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{story.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.6 }}>{story.description}</div>
                    <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 8 }}>
                      {story.photoIds.length} ảnh · {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload view ── */}
      {view === 'upload' && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: 'none' }} />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border2)', borderRadius: 14, padding: '48px 24px',
              textAlign: 'center', cursor: 'pointer', marginBottom: 20,
              transition: 'background 0.15s',
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const dt = e.dataTransfer
              if (dt.files.length && fileInputRef.current) {
                const event = { target: { files: dt.files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleUpload(event)
              }
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
              {uploading ? 'Đang upload...' : 'Kéo thả ảnh vào đây'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
              hoặc click để chọn · JPG, PNG, HEIC, MP4 · nhiều file cùng lúc
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>Sau khi upload, AI sẽ tự động:</div>
            {['Viết caption tiếng Việt cho từng ảnh', 'Nhận diện bé / vợ / chồng trong ảnh', 'Gắn tag dựa trên nội dung ảnh'].map(item => (
              <div key={item} style={{ fontSize: 12.5, color: 'var(--ink2)', padding: '3px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%', background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
            <img src={lightbox.url} alt={lightbox.caption ?? ''} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', background: '#000' }} />
            <div style={{ padding: '14px 18px' }}>
              {lightbox.caption && <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>{lightbox.caption}</p>}
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                {new Date(lightbox.takenAt).toLocaleDateString('vi-VN')}
                {lightbox.location ? ` · ${lightbox.location}` : ''}
                {lightbox.tags.length ? ` · ${lightbox.tags.join(', ')}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────

function PhotoCell({ photo, selected, onSelect, onClick }: {
  photo: FamilyPhoto; selected: boolean; onSelect: () => void; onClick: () => void
}) {
  const isJapan = photo.tags.includes('japan')
  return (
    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', outline: selected ? '3px solid var(--blue)' : 'none', outlineOffset: -3 }}>
      {photo.thumbnailUrl || photo.url ? (
        <img src={photo.thumbnailUrl || photo.url} alt={photo.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={onClick} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }} onClick={onClick}>📷</div>
      )}
      {isJapan && <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px' }}>🇯🇵</span>}
      <button
        onClick={e => { e.stopPropagation(); onSelect() }}
        style={{
          position: 'absolute', top: 5, right: 5,
          width: 20, height: 20, borderRadius: '50%',
          background: selected ? 'var(--blue)' : 'rgba(255,255,255,0.8)',
          border: `2px solid ${selected ? 'var(--blue)' : 'rgba(0,0,0,0.2)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff',
        }}
      >
        {selected ? '✓' : ''}
      </button>
    </div>
  )
}

function EmptyPhotos({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--ink3)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
      <div style={{ fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>Chưa có ảnh nào</div>
      <div style={{ fontSize: 13, marginBottom: 20 }}>Upload ảnh gia đình + ảnh từ Nhật để bắt đầu</div>
      <button onClick={onUpload} style={{ padding: '8px 20px', borderRadius: 10, background: 'var(--ink)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
        Upload ảnh đầu tiên →
      </button>
    </div>
  )
}

// ── Utils ──────────────────────────────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }) }
    img.src = url
  })
}

function getExifDate(file: File): Promise<string | null> {
  // Simple EXIF date extraction from JPEG
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const view = new DataView(e.target!.result as ArrayBuffer)
        // Look for DateTimeOriginal tag (0x9003) in EXIF
        let offset = 2
        while (offset < view.byteLength - 4) {
          if (view.getUint16(offset) === 0xFFE1) {
            const len = view.getUint16(offset + 2)
            const exifStr = String.fromCharCode(...new Uint8Array((e.target!.result as ArrayBuffer).slice(offset + 4, offset + 4 + len)))
            const match = exifStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
            if (match) {
              resolve(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`)
              return
            }
          }
          offset += view.getUint16(offset + 2) + 2
        }
      } catch { /* ignore */ }
      resolve(null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsArrayBuffer(file.slice(0, 65535))
  })
}
