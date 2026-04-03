// ─────────────────────────────────────────────────────────────────────────
// app/family/plan/page.tsx
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardAction } from '@/components/ui/Card'
import { getEvents, getUpcomingEvents } from '@/services/family-storage'
export const metadata: Metadata = { title: 'Plan · Family' }
export const dynamic = 'force-dynamic'

const CATEGORY_ICONS: Record<string, string> = {
  flight: '✈', visit: '🏠', birthday: '🎂', medical: '🏥', holiday: '🎌', trip: '🗺', other: '📅',
}
const CATEGORY_LABELS: Record<string, string> = {
  flight: 'Lịch bay', visit: 'Thăm nhà', birthday: 'Sinh nhật', medical: 'Bác sĩ', holiday: 'Lễ', trip: 'Du lịch', other: 'Khác',
}

export default async function PlanPage() {
  const [upcoming, allEvents] = await Promise.all([getUpcomingEvents(60), getEvents()])
  const past = allEvents.filter(e => e.date < new Date().toISOString().slice(0, 10)).reverse().slice(0, 5)

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / plan</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Plan <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>lịch gia đình 📅</span></h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <CardHeader>
              <CardTitle>60 ngày tới</CardTitle>
              <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>{upcoming.length} sự kiện</span>
            </CardHeader>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có sự kiện nào. Thêm lịch bay, thăm nhà...</p>
            ) : (
              upcoming.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{CATEGORY_ICONS[e.category] ?? '📅'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{e.title}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                      {e.date} {e.time ? `· ${e.time}` : ''} {e.location ? `· ${e.location}` : ''}
                    </div>
                    {e.description && <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{e.description}</div>}
                  </div>
                  <span style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20, color: 'var(--ink3)', flexShrink: 0 }}>
                    {CATEGORY_LABELS[e.category] ?? e.category}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 16 }}>
            <CardHeader><CardTitle>Thêm sự kiện</CardTitle></CardHeader>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)', marginBottom: 12 }}>
              Giao diện thêm sự kiện — dùng <code style={{ fontSize: 11, background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>/api/family/events</code> (POST)
            </div>
            {[
              { icon: '✈', label: 'Lịch bay về thăm nhà' },
              { icon: '🎂', label: 'Sinh nhật bé / vợ / chồng' },
              { icon: '🏥', label: 'Lịch bác sĩ cho bé' },
              { icon: '🗺', label: 'Chuyến du lịch cuối tuần' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--ink2)', cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
              </div>
            ))}
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Đã qua</CardTitle></CardHeader>
              {past.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', opacity: 0.6 }}>
                  <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[e.category]}</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{e.title}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>{e.date}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
