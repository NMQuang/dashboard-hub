import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardAction } from '@/components/ui/Card'
import { getRecentCheckIns } from '@/services/family-storage'
import { getUpcomingEvents } from '@/services/family-storage'
import { getAllPhotos } from '@/services/family-storage'
import { getTasks } from '@/services/family-storage'

export const metadata: Metadata = { title: 'Family' }
export const dynamic = 'force-dynamic'

const SECTIONS = [
  { href: '/family/memories', icon: '📸', label: 'Memories', desc: 'Ảnh gia đình · timeline · albums', color: '#FBEAF0' },
  { href: '/family/connect', icon: '💬', label: 'Connect', desc: 'Daily check-in · nhật ký từ Nhật', color: '#E1F5EE' },
  { href: '/family/plan', icon: '📅', label: 'Plan', desc: 'Lịch chung · sự kiện · du lịch', color: '#EEEDFE' },
  { href: '/family/finance', icon: '💴', label: 'Finance', desc: 'Chi tiêu · JPY↔VND · tiết kiệm', color: '#FAEEDA' },
  { href: '/family/tasks', icon: '✅', label: 'Tasks', desc: 'Việc nhà · nhắc nhở · chia sẻ', color: '#E6F1FB' },
] as const

export default async function FamilyHomePage() {
  // Parallel fetch all summaries
  const [checkins, events, photos, tasks] = await Promise.allSettled([
    getRecentCheckIns(3),
    getUpcomingEvents(14),
    getAllPhotos(),
    getTasks(),
  ])

  const recentCheckins = checkins.status === 'fulfilled' ? checkins.value : []
  const upcomingEvents = events.status === 'fulfilled' ? events.value : []
  const allPhotos = photos.status === 'fulfilled' ? photos.value : []
  const allTasks = tasks.status === 'fulfilled' ? tasks.value : []

  const pendingTasks = allTasks.filter(t => !t.done)
  const latestPhoto = allPhotos[0]

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Gia đình <span style={{ fontWeight: 300, color: 'var(--ink2)', fontSize: 18 }}>nhà Ba Cafe 🏠</span>
        </h1>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <StatCard label="Ảnh" value={allPhotos.length} sub="trong kho" />
        <StatCard label="Tasks" value={pendingTasks.length} sub="chưa xong" />
        <StatCard label="Sự kiện" value={upcomingEvents.length} sub="14 ngày tới" />
        <StatCard label="Check-ins" value={recentCheckins.length} sub="gần đây" />
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10, marginBottom: 28 }}>
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} className="nav-card">
            <div className="nav-card-icon" style={{ background: s.color, fontSize: 18 }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
            </div>
            <span style={{ color: 'var(--ink3)', fontSize: 13 }}>→</span>
          </Link>
        ))}
      </div>

      {/* Recent activity grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Latest check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Check-ins gần đây</CardTitle>
            <CardAction href="/family/connect">Xem tất cả →</CardAction>
          </CardHeader>
          {recentCheckins.length === 0 ? (
            <EmptyState text="Chưa có check-in nào. Bắt đầu hôm nay!" />
          ) : (
            recentCheckins.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <MoodDot mood={c.mood} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'monospace', marginBottom: 2 }}>
                    {c.author === 'me' ? '🇯🇵 Ba Cafe' : '🇻🇳 Mẹ Cafe'} · {c.date}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.textViTranslated ?? c.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Upcoming events + latest photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <Card>
            <CardHeader>
              <CardTitle>Sự kiện sắp tới</CardTitle>
              <CardAction href="/family/plan">Lịch →</CardAction>
            </CardHeader>
            {upcomingEvents.length === 0 ? (
              <EmptyState text="Chưa có sự kiện nào sắp tới" />
            ) : (
              upcomingEvents.slice(0, 3).map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <EventIcon category={e.category} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{e.title}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>{e.date}{e.location ? ` · ${e.location}` : ''}</div>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ảnh mới nhất</CardTitle>
              <CardAction href="/family/memories">Xem tất cả →</CardAction>
            </CardHeader>
            {latestPhoto ? (
              <div>
                <div style={{ aspectRatio: '16/9', borderRadius: 8, background: 'var(--surface2)', overflow: 'hidden', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={latestPhoto.thumbnailUrl || latestPhoto.url}
                    alt={latestPhoto.caption ?? 'Family photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                {latestPhoto.caption && (
                  <p style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5 }}>{latestPhoto.caption}</p>
                )}
                <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 4 }}>
                  {new Date(latestPhoto.takenAt).toLocaleDateString('vi-VN')}
                  {latestPhoto.location ? ` · ${latestPhoto.location}` : ''}
                </div>
              </div>
            ) : (
              <EmptyState text="Chưa có ảnh nào. Upload ảnh đầu tiên!" />
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function MoodDot({ mood }: { mood: number }) {
  const colors = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e' }
  return (
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[mood as keyof typeof colors] ?? 'var(--ink3)', marginTop: 5, flexShrink: 0 }} />
  )
}

function EventIcon({ category }: { category: string }) {
  const icons: Record<string, string> = { flight: '✈', visit: '🏠', birthday: '🎂', medical: '🏥', holiday: '🎌', trip: '🗺' }
  return <span style={{ fontSize: 16, flexShrink: 0 }}>{icons[category] ?? '📅'}</span>
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic', padding: '8px 0' }}>{text}</p>
}
