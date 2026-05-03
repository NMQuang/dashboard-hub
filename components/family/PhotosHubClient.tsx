'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DisplayPhoto, FamilyPhoto, FamilyPhotoStory, StorySyncStatus, GooglePhotoAlbum } from '@/types/family'
import type { GooglePhotosStatus } from '@/services/googlePhotos'
import type { GoogleFamilyPhoto } from '@/types'
import { familyPhotoToDisplay, googlePhotoToDisplay } from '@/lib/familyPhotoUtils'

// ── Date helpers ──────────────────────────────────────────────────────────────

const VI_MONTHS: Record<string, string> = {
  '01': 'Tháng 1',  '02': 'Tháng 2',  '03': 'Tháng 3',
  '04': 'Tháng 4',  '05': 'Tháng 5',  '06': 'Tháng 6',
  '07': 'Tháng 7',  '08': 'Tháng 8',  '09': 'Tháng 9',
  '10': 'Tháng 10', '11': 'Tháng 11', '12': 'Tháng 12',
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return `${VI_MONTHS[m] ?? m} ${y}`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}


// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialPhotos:        DisplayPhoto[]
  initialStories:       FamilyPhotoStory[]
  initialNextPageToken?: string
  initialAlbums:        GooglePhotoAlbum[]
  googleStatus:         GooglePhotosStatus
}

// ── Main component ────────────────────────────────────────────────────────────

type View = 'timeline' | 'upload' | 'stories' | 'albums'
type SourceFilter = 'all' | 'google_photos' | 'local'

export default function PhotosHubClient({
  initialPhotos,
  initialStories,
  initialNextPageToken,
  initialAlbums,
  googleStatus,
}: Props) {
  const router = useRouter()

  // ── Core state ─────────────────────────────────────────────────────────────
  const [view,          setView]          = useState<View>('timeline')
  const [photos,        setPhotos]        = useState<DisplayPhoto[]>(initialPhotos)
  const [stories,       setStories]       = useState<FamilyPhotoStory[]>(initialStories)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken)

  // ── Albums state ───────────────────────────────────────────────────────────
  const [albums,          setAlbums]          = useState<GooglePhotoAlbum[]>(initialAlbums)
  const [albumsLoading,   setAlbumsLoading]   = useState(false)
  const [albumsErr,       setAlbumsErr]       = useState('')
  const [activeAlbum,     setActiveAlbum]     = useState<GooglePhotoAlbum | null>(null)
  const [albumPhotos,     setAlbumPhotos]     = useState<DisplayPhoto[]>([])
  const [albumLoading,    setAlbumLoading]    = useState(false)
  const [albumErr,        setAlbumErr]        = useState('')
  const [importingAlbum,  setImportingAlbum]  = useState<string | null>(null)
  const [importMsg,       setImportMsg]       = useState('')

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQ,      setSearchQ]      = useState('')
  const [yearFilter,   setYearFilter]   = useState('all')
  const [monthFilter,  setMonthFilter]  = useState('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  // ── Selection + lightbox ───────────────────────────────────────────────────
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [lightbox,    setLightbox]    = useState<DisplayPhoto | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  // ── Google Photos Picker sync ──────────────────────────────────────────────
  type SyncStep = 'idle' | 'creating' | 'picking' | 'saving' | 'done' | 'error'
  const [syncStep,      setSyncStep]      = useState<SyncStep>('idle')
  const [syncSessionId, setSyncSessionId] = useState<string | null>(null)
  const [syncMsg,       setSyncMsg]       = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function startPickerSync() {
    setSyncStep('creating')
    setSyncMsg('')
    try {
      const res = await fetch('/api/family/photos/picker', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { sessionId, pickerUri } = await res.json() as { sessionId: string; pickerUri: string }
      setSyncSessionId(sessionId)
      setSyncStep('picking')
      window.open(pickerUri, '_blank', 'noopener,noreferrer')

      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch(`/api/family/photos/picker?sessionId=${encodeURIComponent(sessionId)}`)
          if (!pr.ok) return
          const { done } = await pr.json() as { done: boolean }
          if (!done) return
          clearInterval(pollRef.current!)
          pollRef.current = null
          setSyncStep('saving')
          const sr = await fetch('/api/family/photos/picker', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          if (!sr.ok) throw new Error(`Save HTTP ${sr.status}`)
          const { count, photos: newPhotos } = await sr.json() as { count: number; photos: GoogleFamilyPhoto[] }
          if (newPhotos?.length) {
            const newDisplayPhotos = newPhotos.map(googlePhotoToDisplay)
            setPhotos(prev => {
              const existingIds = new Set(prev.map(p => p.id))
              const fresh = newDisplayPhotos.filter(p => !existingIds.has(p.id))
              return [...prev, ...fresh].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
            })
          }
          setSyncMsg(`✓ Đã sync ${count} ảnh`)
          setSyncStep('done')
          setTimeout(() => { setSyncStep('idle') }, 2500)
        } catch (e) {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setSyncMsg(e instanceof Error ? e.message : String(e))
          setSyncStep('error')
        }
      }, 5000)

      // Timeout after 10 minutes
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setSyncStep('idle')
          setSyncMsg('Hết thời gian chờ. Vui lòng thử lại.')
        }
      }, 10 * 60 * 1000)
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : String(e))
      setSyncStep('error')
    }
  }

  function cancelSync() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setSyncSessionId(null)
    setSyncStep('idle')
    setSyncMsg('')
  }

  // ── Load-more ─────────────────────────────────────────────────────────────
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [loadMoreErr,  setLoadMoreErr]  = useState('')

  // ── Upload ─────────────────────────────────────────────────────────────────
  const [uploading,  setUploading]  = useState(false)
  const [uploadMsg,  setUploadMsg]  = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Story form ─────────────────────────────────────────────────────────────
  const [showStoryForm,  setShowStoryForm]  = useState(false)
  const [storyTitle,     setStoryTitle]     = useState('')
  const [storyDesc,      setStoryDesc]      = useState('')
  const [storyLocation,  setStoryLocation]  = useState('')
  const [storyNotes,     setStoryNotes]     = useState('')
  const [savingStory,    setSavingStory]    = useState(false)
  const [storyErr,       setStoryErr]       = useState('')

  // ── Derived: available years + months ─────────────────────────────────────

  const years = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const p of photos) set.add(p.takenAt.slice(0, 4))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [photos])

  const months = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const p of photos) {
      if (yearFilter === 'all' || p.takenAt.startsWith(yearFilter)) {
        set.add(p.takenAt.slice(0, 7))
      }
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [photos, yearFilter])

  // Reset month filter when year changes
  const handleYearChange = useCallback((y: string) => {
    setYearFilter(y)
    setMonthFilter('all')
  }, [])

  // ── Derived: filtered + grouped photos ────────────────────────────────────

  const filtered = useMemo<DisplayPhoto[]>(() => {
    let list = photos
    if (yearFilter   !== 'all') list = list.filter(p => p.takenAt.startsWith(yearFilter))
    if (monthFilter  !== 'all') list = list.filter(p => p.takenAt.startsWith(monthFilter))
    if (sourceFilter !== 'all') list = list.filter(p => p.source === sourceFilter)
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase()
      list = list.filter(p =>
        p.filename.toLowerCase().includes(q) ||
        (p.caption       ?? '').toLowerCase().includes(q) ||
        (p.description   ?? '').toLowerCase().includes(q) ||
        (p.location      ?? '').toLowerCase().includes(q) ||
        (p.albumTitle    ?? '').toLowerCase().includes(q)
      )
    }
    return list.slice().sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  }, [photos, yearFilter, monthFilter, sourceFilter, searchQ])

  const monthGroups = useMemo<Array<{ key: string; items: DisplayPhoto[] }>>(() => {
    const map = new Map<string, DisplayPhoto[]>()
    for (const p of filtered) {
      const k = p.takenAt.slice(0, 7)
      const bucket = map.get(k) ?? []
      bucket.push(p)
      map.set(k, bucket)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({ key, items }))
  }, [filtered])

  // ── Lightbox ───────────────────────────────────────────────────────────────
  // lightboxPool is filtered when in timeline, albumPhotos when in album detail

  const lightboxPool = activeAlbum ? albumPhotos : filtered

  const openLightbox = useCallback((photo: DisplayPhoto) => {
    const pool = activeAlbum ? albumPhotos : filtered
    const idx = pool.findIndex(p => p.id === photo.id)
    setLightboxIdx(idx >= 0 ? idx : 0)
    setLightbox(photo)
  }, [filtered, albumPhotos, activeAlbum])

  const navigateLightbox = useCallback((dir: -1 | 1) => {
    const next = lightboxIdx + dir
    if (next < 0 || next >= lightboxPool.length) return
    setLightboxIdx(next)
    setLightbox(lightboxPool[next] ?? null)
  }, [lightboxIdx, lightboxPool])

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // ── Load more (Google Photos pagination) ───────────────────────────────────

  async function loadMore() {
    if (!nextPageToken || loadingMore) return
    setLoadingMore(true)
    setLoadMoreErr('')
    try {
      const res = await fetch(
        `/api/family/photos/google-photos?pageToken=${encodeURIComponent(nextPageToken)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { photos: DisplayPhoto[]; nextPageToken?: string }

      setPhotos(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newItems = data.photos.filter(p => !existingIds.has(p.id))
        return [...prev, ...newItems].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      })
      setNextPageToken(data.nextPageToken)
    } catch (e) {
      setLoadMoreErr(`Không tải thêm được: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingMore(false)
    }
  }

  // ── Album actions ──────────────────────────────────────────────────────────

  async function refreshAlbums() {
    setAlbumsLoading(true)
    setAlbumsErr('')
    try {
      const res = await fetch('/api/family/photos/google-albums', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { albums: GooglePhotoAlbum[] }
      setAlbums(data.albums)
    } catch (e) {
      setAlbumsErr(`Không tải được albums: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setAlbumsLoading(false)
    }
  }

  async function openAlbum(album: GooglePhotoAlbum) {
    setActiveAlbum(album)
    setAlbumPhotos([])
    setAlbumErr('')
    setAlbumLoading(true)
    try {
      const res = await fetch(`/api/family/photos/google-photos?albumId=${encodeURIComponent(album.id)}&pageSize=100`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { photos: DisplayPhoto[] }
      setAlbumPhotos(data.photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt)))
    } catch (e) {
      setAlbumErr(`Không tải được ảnh: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setAlbumLoading(false)
    }
  }

  async function importAlbumAsStory(album: GooglePhotoAlbum) {
    setImportingAlbum(album.id)
    setImportMsg('')
    try {
      // Fetch album photos if not already loaded for this album
      let photosToImport = activeAlbum?.id === album.id ? albumPhotos : []
      if (photosToImport.length === 0) {
        const res = await fetch(`/api/family/photos/google-photos?albumId=${encodeURIComponent(album.id)}&pageSize=100`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as { photos: DisplayPhoto[] }
        photosToImport = data.photos
      }

      if (photosToImport.length === 0) {
        setImportMsg('Album trống, không có ảnh để import.')
        return
      }

      const photoIds = photosToImport.map(p => p.id)
      const dates = photosToImport.map(p => p.takenAt).sort()

      const storyRes = await fetch('/api/family/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    album.title,
          photoIds,
          dateFrom: dates[0]?.slice(0, 10),
          dateTo:   dates[dates.length - 1]?.slice(0, 10),
        }),
      })
      if (!storyRes.ok) throw new Error(`HTTP ${storyRes.status}`)
      const { story } = await storyRes.json() as { story: FamilyPhotoStory }

      // Merge album photos into main photo state (dedup)
      setPhotos(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newItems = photosToImport.filter(p => !existingIds.has(p.id))
        return [...prev, ...newItems].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      })
      setStories(prev => [story, ...prev])
      setImportMsg(`✓ Đã import "${album.title}" thành story (${photoIds.length} ảnh)`)
      setTimeout(() => { setImportMsg(''); setView('stories') }, 1800)
    } catch (e) {
      setImportMsg(`Lỗi: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setImportingAlbum(null)
    }
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setUploadMsg(`Đang upload ${files.length} ảnh...`)

    let uploaded = 0
    for (const file of files) {
      try {
        const dims    = await getImageDimensions(file)
        const takenAt = await getExifDate(file) ?? new Date().toISOString()

        const metaRes = await fetch('/api/family/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename:    file.name,
            contentType: file.type || 'application/octet-stream',
            takenAt,
            uploadedBy:  'me',
            width:       dims.width,
            height:      dims.height,
            sizeBytes:   file.size,
          }),
        })
        if (!metaRes.ok) throw new Error(`Upload API error: ${metaRes.status}`)

        const { uploadUrl, photo, kvPersisted } = await metaRes.json() as { uploadUrl: string; photo: FamilyPhoto; kvPersisted?: boolean }
        if (!photo?.id) throw new Error('Invalid response from upload API')
        if (kvPersisted === false) {
          console.warn('[upload] KV not configured — photo will not persist after page reload')
          setUploadMsg('⚠ KV chưa cấu hình — ảnh sẽ mất sau khi reload. Cần thêm FAMILY_KV_REST_API_URL / FAMILY_KV_REST_API_TOKEN vào Vercel.')
        }

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        })
        if (!putRes.ok) throw new Error(`R2 upload failed: ${putRes.status}`)

        // Add to local state immediately
        setPhotos(prev => [familyPhotoToDisplay(photo), ...prev])
        uploaded++
      } catch (err) {
        console.error('[upload] error for file', file.name, err)
      }
    }

    setUploading(false)
    if (uploaded > 0) {
      setUploadMsg(`✓ Upload xong ${uploaded} ảnh. AI đang viết caption...`)
      setView('timeline')
    } else {
      setUploadMsg('Upload thất bại. Vui lòng thử lại.')
    }
    e.target.value = ''
    router.refresh()
  }

  // ── Create story ───────────────────────────────────────────────────────────

  async function handleCreateStory(e: React.FormEvent) {
    e.preventDefault()
    if (!storyTitle.trim() || selected.size === 0) return
    setSavingStory(true)
    setStoryErr('')
    try {
      const res = await fetch('/api/family/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       storyTitle.trim(),
          description: storyDesc.trim()    || undefined,
          photoIds:    Array.from(selected),
          location:    storyLocation.trim() || undefined,
          notes:       storyNotes.trim()    || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const { story } = await res.json() as { story: FamilyPhotoStory }
      setStories(prev => [story, ...prev])
      setSelected(new Set())
      setShowStoryForm(false)
      setStoryTitle(''); setStoryDesc(''); setStoryLocation(''); setStoryNotes('')
      setView('stories')
    } catch (err) {
      setStoryErr(`Lỗi: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingStory(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Google Photos status banners */}
      {googleStatus === 'not_configured' && (
        <div style={{
          padding: '10px 16px', marginBottom: 20, borderRadius: 10,
          background: '#fffbeb', border: '1px solid #f59e0b',
          fontSize: 12.5, color: 'var(--ink2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ flexShrink: 0 }}>🔧</span>
          <span>
            <strong>Chưa kết nối Google Photos</strong> — đang hiển thị ảnh mẫu.{' '}
            <a href="/family/setup" style={{ color: '#b45309', fontWeight: 500, textDecoration: 'underline' }}>
              Kết nối ngay →
            </a>
          </span>
        </div>
      )}

      {googleStatus === 'token_expired' && (
        <div style={{
          padding: '10px 16px', marginBottom: 20, borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fca5a5',
          fontSize: 12.5, color: 'var(--ink2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span>
            <strong>Token Google Photos đã hết hạn</strong>.{' '}
            <a href="/family/setup" style={{ color: '#b91c1c', fontWeight: 500, textDecoration: 'underline' }}>
              Kết nối lại →
            </a>
          </span>
        </div>
      )}

      {/* Picker sync bar — visible when connected */}
      {googleStatus === 'ok' && (
        <div style={{
          padding: '10px 16px', marginBottom: 20, borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ color: 'var(--ink3)', flexShrink: 0 }}>Google Photos</span>

          {syncStep === 'idle' && (
            <button
              onClick={() => { void startPickerSync() }}
              style={{
                padding: '5px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                background: '#4285F4', color: '#fff', border: 'none',
              }}
            >
              🔄 Sync ảnh
            </button>
          )}

          {syncStep === 'creating' && (
            <span style={{ color: 'var(--ink2)' }}>Đang tạo phiên...</span>
          )}

          {syncStep === 'picking' && (
            <>
              <span style={{ color: 'var(--ink2)' }}>
                Tab Google Photos Picker đã mở — chọn ảnh rồi đóng tab lại, trang này tự cập nhật...
              </span>
              <button onClick={cancelSync} style={{
                marginLeft: 'auto', padding: '4px 12px', borderRadius: 7, fontSize: 12,
                cursor: 'pointer', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--ink3)',
              }}>
                Hủy
              </button>
            </>
          )}

          {syncStep === 'saving' && (
            <span style={{ color: 'var(--ink2)' }}>Đang lưu ảnh đã chọn...</span>
          )}

          {syncStep === 'done' && (
            <span style={{ color: '#16a34a', fontWeight: 500 }}>{syncMsg}</span>
          )}

          {syncStep === 'error' && (
            <>
              <span style={{ color: '#dc2626' }}>✗ {syncMsg}</span>
              <button onClick={() => { setSyncStep('idle'); setSyncMsg('') }} style={{
                padding: '4px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink3)',
              }}>
                Thử lại
              </button>
            </>
          )}
        </div>
      )}

      {/* View tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['timeline', 'albums', 'upload', 'stories'] as const).map(v => (
          <button key={v} onClick={() => { setView(v); if (v !== 'albums') setActiveAlbum(null) }} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: view === v ? 'var(--surface2)' : 'transparent',
            color:      view === v ? 'var(--ink)' : 'var(--ink3)',
            fontWeight: view === v ? 500 : 400,
          }}>
            {v === 'timeline' ? `📅 Timeline (${filtered.length})`
              : v === 'albums'   ? `🗂 Albums (${albums.length})`
              : v === 'upload'   ? '+ Upload'
              : `✨ Stories (${stories.length})`}
          </button>
        ))}

        {/* Create story from selection */}
        {selected.size > 0 && (
          <button
            onClick={() => setShowStoryForm(true)}
            style={{
              marginLeft: 'auto', padding: '6px 14px', borderRadius: 8,
              fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
              background: '#EEEDFE', color: '#3C3489',
              border: '1px solid #AFA9EC',
            }}
          >
            ✨ Tạo story ({selected.size} ảnh)
          </button>
        )}
      </div>

      {/* ── Timeline view ── */}
      {view === 'timeline' && (
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tìm ảnh..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{
                flex: '1 1 160px', padding: '7px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', fontSize: 12.5, outline: 'none',
              }}
            />

            {/* Year chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <FilterChip label="Tất cả" active={yearFilter === 'all'} onClick={() => handleYearChange('all')} />
              {years.map(y => (
                <FilterChip key={y} label={y} active={yearFilter === y} onClick={() => handleYearChange(y)} />
              ))}
            </div>

            {/* Source filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as SourceFilter)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 12,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả nguồn</option>
              <option value="google_photos">Google Photos</option>
              <option value="local">Local (R2)</option>
            </select>

            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', flexShrink: 0 }}>
              {filtered.length} ảnh
            </span>
          </div>

          {/* Month chips (only when year selected) */}
          {yearFilter !== 'all' && months.length > 1 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
              <FilterChip label="Tất cả tháng" active={monthFilter === 'all'} onClick={() => setMonthFilter('all')} />
              {months.map(ym => (
                <FilterChip key={ym} label={monthLabel(ym)} active={monthFilter === ym} onClick={() => setMonthFilter(ym)} />
              ))}
            </div>
          )}

          {/* Selection hint */}
          {selected.size === 0 && filtered.length >= 2 && (
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ opacity: 0.6 }}>💡</span>
              Bấm ○ trên ảnh để chọn, rồi tạo story từ các ảnh đã chọn
            </div>
          )}

          {/* Photo grid */}
          {filtered.length === 0 ? (
            <EmptyState searchQ={searchQ} hasPhotos={photos.length > 0} />
          ) : (
            <>
              {monthGroups.map(({ key, items }) => (
                <div key={key} style={{ marginBottom: 32 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 10, fontSize: 13, fontWeight: 500, color: 'var(--ink2)',
                  }}>
                    {monthLabel(key)}
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 400 }}>
                      {items.length} ảnh
                    </span>
                    <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                    gap: 5,
                  }}>
                    {items.map(photo => (
                      <PhotoCell
                        key={photo.id}
                        photo={photo}
                        selected={selected.has(photo.id)}
                        onSelect={() => toggleSelect(photo.id)}
                        onClick={() => openLightbox(photo)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Load more Google Photos */}
              {nextPageToken && (
                <div style={{ textAlign: 'center', marginTop: 8, paddingBottom: 24 }}>
                  {loadMoreErr && (
                    <div style={{ fontSize: 12, color: 'var(--red, #dc2626)', marginBottom: 8 }}>{loadMoreErr}</div>
                  )}
                  <button
                    onClick={() => { void loadMore() }}
                    disabled={loadingMore}
                    style={{
                      padding: '8px 24px', borderRadius: 10, fontSize: 13, cursor: loadingMore ? 'not-allowed' : 'pointer',
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      color: 'var(--ink)', fontWeight: 400, opacity: loadingMore ? 0.6 : 1,
                    }}
                  >
                    {loadingMore ? 'Đang tải...' : '↓ Tải thêm từ Google Photos'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Albums view ── */}
      {view === 'albums' && (
        <div>
          {/* Album detail view */}
          {activeAlbum ? (
            <div>
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => { setActiveAlbum(null); setAlbumPhotos([]) }}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink2)',
                  }}
                >
                  ← Albums
                </button>
                <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{activeAlbum.title}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                  {activeAlbum.mediaItemsCount} ảnh
                </span>
              </div>

              {albumErr && (
                <div style={{ fontSize: 12.5, color: 'var(--red, #dc2626)', marginBottom: 12 }}>{albumErr}</div>
              )}

              {albumLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink3)', fontSize: 13 }}>
                  Đang tải ảnh từ album...
                </div>
              ) : albumPhotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink3)', fontSize: 13 }}>
                  Album trống
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 5 }}>
                  {albumPhotos.map(photo => (
                    <PhotoCell
                      key={photo.id}
                      photo={photo}
                      selected={selected.has(photo.id)}
                      onSelect={() => toggleSelect(photo.id)}
                      onClick={() => openLightbox(photo)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Album list */
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                  Albums từ Google Photos
                </span>
                <button
                  onClick={() => { void refreshAlbums() }}
                  disabled={albumsLoading}
                  style={{
                    marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: albumsLoading ? 'not-allowed' : 'pointer',
                    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink2)',
                    opacity: albumsLoading ? 0.6 : 1,
                  }}
                >
                  {albumsLoading ? 'Đang tải...' : '↺ Làm mới'}
                </button>
              </div>

              {importMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14,
                  background: importMsg.startsWith('✓') ? 'var(--green-bg, #f0fdf4)' : 'var(--red-bg, #fef2f2)',
                  color:      importMsg.startsWith('✓') ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)',
                }}>
                  {importMsg}
                </div>
              )}

              {albumsErr && (
                <div style={{ fontSize: 12.5, color: 'var(--red, #dc2626)', marginBottom: 12 }}>{albumsErr}</div>
              )}

              {albums.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--ink3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🗂</div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>Chưa có album nào</div>
                  <div style={{ fontSize: 12.5 }}>Bấm Làm mới để đồng bộ từ Google Photos</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {albums.map(album => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      importing={importingAlbum === album.id}
                      onView={() => { void openAlbum(album) }}
                      onImport={() => { void importAlbumAsStory(album) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Upload view ── */}
      {view === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={e => { void handleUpload(e) }}
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files.length && fileInputRef.current) {
                const syntheticEvt = {
                  target: { files: e.dataTransfer.files, value: '' },
                } as unknown as React.ChangeEvent<HTMLInputElement>
                void handleUpload(syntheticEvt)
              }
            }}
            style={{
              border: '2px dashed var(--border)', borderRadius: 14,
              padding: '56px 24px', textAlign: 'center', cursor: 'pointer',
              marginBottom: 20, background: uploading ? 'var(--surface2)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
              {uploading ? 'Đang upload...' : 'Kéo thả ảnh vào đây'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
              hoặc click để chọn · JPG · PNG · HEIC · MP4 · nhiều file cùng lúc
            </div>
          </div>

          {uploadMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
              background: uploadMsg.startsWith('✓') ? 'var(--green-bg, #f0fdf4)' : 'var(--red-bg, #fef2f2)',
              color:      uploadMsg.startsWith('✓') ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)',
            }}>
              {uploadMsg}
            </div>
          )}

          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
              Sau khi upload, AI tự động:
            </div>
            {[
              'Viết caption tiếng Việt cho từng ảnh',
              'Nhận diện bé / vợ / chồng trong ảnh',
              'Gắn tag tự động (japan · baby · couple · travel · milestone...)',
            ].map(item => (
              <div key={item} style={{ fontSize: 12.5, color: 'var(--ink2)', padding: '3px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--green, #16a34a)' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stories view ── */}
      {view === 'stories' && (
        <div>
          {stories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>Chưa có story nào</div>
              <div style={{ fontSize: 12.5 }}>
                Chọn ảnh trong Timeline rồi bấm &quot;Tạo story&quot;
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {stories.map(story => (
                <StoryCard key={story.id} story={story} photos={photos} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Floating selection bar ── */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink)', color: '#fff', borderRadius: 14,
          padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center',
          boxShadow: '0 6px 24px rgba(0,0,0,0.25)', zIndex: 50, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>{selected.size} ảnh đã chọn</span>
          <button
            onClick={() => setShowStoryForm(true)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
              background: '#EEEDFE', color: '#3C3489', border: 'none', fontWeight: 500,
            }}
          >
            ✨ Tạo story
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Story creation form (modal) ── */}
      {showStoryForm && (
        <div
          onClick={() => setShowStoryForm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 16, padding: '24px 28px',
              width: '100%', maxWidth: 480, boxShadow: '0 16px 60px rgba(0,0,0,0.35)',
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>✨ Tạo story mới</h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink3)', marginBottom: 20 }}>
              {selected.size} ảnh đã chọn
            </p>

            <form onSubmit={e => { void handleCreateStory(e) }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>
                  Tiêu đề *
                </label>
                <input
                  required
                  value={storyTitle}
                  onChange={e => setStoryTitle(e.target.value)}
                  placeholder="VD: Mùa xuân tại Nhật 2026"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--ink)', fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>
                  Mô tả
                </label>
                <textarea
                  value={storyDesc}
                  onChange={e => setStoryDesc(e.target.value)}
                  placeholder="Vài câu kể về kỷ niệm này..."
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--ink)', fontSize: 13, resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>Địa điểm</label>
                  <input
                    value={storyLocation}
                    onChange={e => setStoryLocation(e.target.value)}
                    placeholder="Tokyo, Nhật Bản"
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      color: 'var(--ink)', fontSize: 12.5, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>Ghi chú</label>
                  <input
                    value={storyNotes}
                    onChange={e => setStoryNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      color: 'var(--ink)', fontSize: 12.5, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {storyErr && (
                <div style={{ fontSize: 12.5, color: 'var(--red, #dc2626)', marginBottom: 12 }}>
                  {storyErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowStoryForm(false)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)',
                  }}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={savingStory || !storyTitle.trim()}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13,
                    cursor: savingStory ? 'not-allowed' : 'pointer',
                    background: '#3C3489', color: '#fff', border: 'none',
                    fontWeight: 500, opacity: savingStory ? 0.7 : 1,
                  }}
                >
                  {savingStory ? 'Đang lưu...' : 'Tạo story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <Lightbox
          photo={lightbox}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < lightboxPool.length - 1}
          onPrev={() => navigateLightbox(-1)}
          onNext={() => navigateLightbox(1)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
        borderColor: active ? 'var(--ink)' : 'var(--border)',
        background:  active ? 'var(--ink)' : 'var(--surface)',
        color:       active ? '#fff' : 'var(--ink2)',
        fontWeight:  active ? 500 : 400, transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )
}

function PhotoCell({ photo, selected, onSelect, onClick }: {
  photo: DisplayPhoto; selected: boolean; onSelect: () => void; onClick: () => void
}) {
  const [errored, setErrored] = useState(false)

  return (
    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface2)' }}>
      {!errored ? (
        <img
          src={photo.thumbnailUrl}
          alt={photo.caption ?? photo.description ?? photo.filename}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onClick={onClick}
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          onClick={onClick}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 }}
        >
          <span style={{ fontSize: 20 }}>🖼</span>
          <span style={{ fontSize: 9.5, color: 'var(--ink3)', textAlign: 'center', wordBreak: 'break-all' }}>
            {photo.filename}
          </span>
        </div>
      )}

      {/* Source badge */}
      {photo.source === 'local' && (
        <span style={{
          position: 'absolute', top: 5, left: 5,
          fontSize: 9, background: 'rgba(0,0,0,0.45)', color: '#fff',
          borderRadius: 4, padding: '1px 4px', fontFamily: 'monospace',
        }}>
          R2
        </span>
      )}

      {/* Select button */}
      <button
        onClick={e => { e.stopPropagation(); onSelect() }}
        style={{
          position: 'absolute', top: 5, right: 5,
          width: 20, height: 20, borderRadius: '50%',
          background: selected ? 'var(--blue, #3b82f6)' : 'rgba(255,255,255,0.8)',
          border: `2px solid ${selected ? 'var(--blue, #3b82f6)' : 'rgba(0,0,0,0.2)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', flexShrink: 0,
        }}
      >
        {selected ? '✓' : ''}
      </button>
    </div>
  )
}

const SYNC_LABELS: Record<StorySyncStatus, string> = {
  local:   '💾 Local',
  pending: '⏳ Đang sync',
  synced:  '✓ Google Photos',
  failed:  '✗ Sync thất bại',
}

function StoryCard({ story, photos }: { story: FamilyPhotoStory; photos: DisplayPhoto[] }) {
  const coverPhotos = story.photoIds.slice(0, 4).map(id => photos.find(p => p.id === id))

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Cover grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: 120 }}>
        {coverPhotos.map((p, i) =>
          p ? (
            <img
              key={p.id}
              src={p.thumbnailUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div key={i} style={{ background: 'var(--surface2)' }} />
          )
        )}
        {Array.from({ length: Math.max(0, 4 - coverPhotos.length) }, (_, i) => (
          <div key={`empty-${i}`} style={{ background: 'var(--surface2)' }} />
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
          {story.title}
        </div>
        {story.description && (
          <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.6, marginBottom: 6 }}>
            {story.description}
          </div>
        )}
        <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <span>{story.photoIds.length} ảnh</span>
          {story.location && <span>📍 {story.location}</span>}
          <span style={{ marginLeft: 'auto' }}>{SYNC_LABELS[story.syncStatus]}</span>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ photo, hasPrev, hasNext, onPrev, onNext, onClose }: {
  photo: DisplayPhoto; hasPrev: boolean; hasNext: boolean
  onPrev: () => void; onNext: () => void; onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      {hasPrev && (
        <button onClick={e => { e.stopPropagation(); onPrev() }} style={navBtnStyle('left')} aria-label="Ảnh trước">‹</button>
      )}

      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 900, width: '100%', background: 'var(--surface)',
          borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ background: '#000', lineHeight: 0 }}>
          <img
            src={photo.url}
            alt={photo.caption ?? photo.description ?? photo.filename}
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div style={{ padding: '14px 18px' }}>
          {(photo.caption ?? photo.description) && (
            <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>
              {photo.caption ?? photo.description}
            </p>
          )}
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span>{fmtDate(photo.takenAt)}</span>
            <span>{photo.filename}</span>
            {photo.location    && <span>📍 {photo.location}</span>}
            {photo.albumTitle  && <span>📁 {photo.albumTitle}</span>}
            {photo.width > 0   && <span>{photo.width} × {photo.height}</span>}
            <span style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--ink3)' }}>
                {photo.source === 'google_photos' ? 'Google Photos' : 'Local'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {hasNext && (
        <button onClick={e => { e.stopPropagation(); onNext() }} style={navBtnStyle('right')} aria-label="Ảnh sau">›</button>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 40, height: 40,
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  )
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'fixed', [side]: 16, top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
    width: 48, height: 48, color: '#fff', fontSize: 30,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 201,
  }
}

function AlbumCard({ album, importing, onView, onImport }: {
  album: GooglePhotoAlbum
  importing: boolean
  onView: () => void
  onImport: () => void
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* Cover */}
      <div
        onClick={onView}
        style={{ height: 140, background: 'var(--surface2)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
      >
        {album.coverPhotoBaseUrl ? (
          <img
            src={`${album.coverPhotoBaseUrl}=w440-h280-c`}
            alt={album.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            🗂
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
          padding: '24px 10px 8px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{album.title}</div>
          <div className="font-mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.75)' }}>
            {album.mediaItemsCount} ảnh
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 10px' }}>
        <button
          onClick={onView}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink2)',
          }}
        >
          👁 Xem
        </button>
        <button
          onClick={onImport}
          disabled={importing}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12,
            cursor: importing ? 'not-allowed' : 'pointer', fontWeight: 500,
            background: importing ? 'var(--surface2)' : '#EEEDFE',
            color: importing ? 'var(--ink3)' : '#3C3489',
            border: '1px solid ' + (importing ? 'var(--border)' : '#AFA9EC'),
          }}
        >
          {importing ? '...' : '✨ Import'}
        </button>
      </div>
    </div>
  )
}

function EmptyState({ searchQ, hasPhotos }: { searchQ: string; hasPhotos: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--ink3)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
      {searchQ ? (
        <>
          <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>
            Không tìm thấy ảnh nào khớp với &quot;{searchQ}&quot;
          </div>
          <div style={{ fontSize: 12.5 }}>Thử từ khoá khác hoặc xóa bộ lọc</div>
        </>
      ) : hasPhotos ? (
        <>
          <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>Không có ảnh trong bộ lọc này</div>
          <div style={{ fontSize: 12.5 }}>Chọn &quot;Tất cả&quot; để xem toàn bộ ảnh</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>Chưa có ảnh nào</div>
          <div style={{ fontSize: 12.5 }}>Upload ảnh hoặc kết nối Google Photos để bắt đầu</div>
        </>
      )}
    </div>
  )
}

// ── Browser utilities (client-only) ───────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload  = () => { URL.revokeObjectURL(url); resolve({ width: img.width,  height: img.height }) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }) }
    img.src = url
  })
}

function getExifDate(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const view = new DataView(e.target!.result as ArrayBuffer)
        let offset = 2
        while (offset < view.byteLength - 4) {
          if (view.getUint16(offset) === 0xFFE1) {
            const len   = view.getUint16(offset + 2)
            const chunk = (e.target!.result as ArrayBuffer).slice(offset + 4, offset + 4 + len)
            const str   = new TextDecoder().decode(new Uint8Array(chunk))
            const m     = str.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
            if (m) { resolve(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`); return }
          }
          const segLen = view.getUint16(offset + 2)
          if (segLen < 2) break
          offset += segLen + 2
        }
      } catch { /* ignore */ }
      resolve(null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsArrayBuffer(file.slice(0, 65535))
  })
}

