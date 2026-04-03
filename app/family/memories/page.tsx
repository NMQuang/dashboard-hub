import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAllPhotos, getStories } from '@/services/family-storage'
import MemoriesClient from '@/components/family/MemoriesClient'

export const metadata: Metadata = { title: 'Memories · Family' }

const TAGS = [
  { value: 'all',       label: 'Tất cả', icon: '◉' },
  { value: 'japan',     label: 'Từ Nhật 🇯🇵', icon: '◉' },
  { value: 'family',    label: 'Gia đình', icon: '◉' },
  { value: 'baby',      label: 'Bé', icon: '◉' },
  { value: 'couple',    label: 'Vợ chồng', icon: '◉' },
  { value: 'travel',    label: 'Du lịch', icon: '◉' },
  { value: 'milestone', label: 'Cột mốc', icon: '◉' },
] as const

export default async function MemoriesPage() {
  const [photos, stories] = await Promise.all([
    getAllPhotos(),
    getStories(),
  ])

  // Group by month for timeline
  const byMonth: Record<string, typeof photos> = {}
  for (const p of photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt))) {
    const m = p.takenAt.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(p)
  }

  // Tag counts
  const tagCounts: Record<string, number> = { all: photos.length }
  for (const p of photos) {
    for (const t of p.tags) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1
    }
  }

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / memories</div>
          <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
            Memories <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>{photos.length} ảnh</span>
          </h1>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'right' }}>
          <div>{stories.length} stories tạo bởi AI</div>
          <div>Upload thêm để tạo story mới</div>
        </div>
      </div>

      {/* Client component handles: tag filter, timeline view, upload, story generation */}
      <MemoriesClient
        initialPhotos={photos}
        byMonth={byMonth}
        stories={stories}
        tags={TAGS.map(t => ({ ...t, count: tagCounts[t.value] ?? 0 }))}
      />
    </div>
  )
}
