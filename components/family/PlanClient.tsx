'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FamilyEvent, EventCategory } from '@/types/family'

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<EventCategory, { icon: string; label: string; labelVi: string }> = {
  flight:   { icon: '✈️',  label: 'Flight',   labelVi: 'Lịch bay' },
  visit:    { icon: '🏠', label: 'Visit',    labelVi: 'Thăm nhà' },
  birthday: { icon: '🎂', label: 'Birthday', labelVi: 'Sinh nhật' },
  medical:  { icon: '🏥', label: 'Medical',  labelVi: 'Bác sĩ' },
  holiday:  { icon: '🎌', label: 'Holiday',  labelVi: 'Lễ' },
  trip:     { icon: '🗺️',  label: 'Trip',     labelVi: 'Du lịch' },
  vaccine:  { icon: '💉', label: 'Vaccine',  labelVi: 'Tiêm chủng' },
  school:   { icon: '📚', label: 'School',   labelVi: 'Trường học' },
  other:    { icon: '📅', label: 'Other',    labelVi: 'Khác' },
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// ── Helpers ───────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────

interface PlanClientProps {
  initialEvents: FamilyEvent[]
}

export default function PlanClient({ initialEvents }: PlanClientProps) {
  const [events, setEvents] = useState<FamilyEvent[]>(initialEvents)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const today = toDateStr(new Date())

  // ── Derived data ──────────────────────────────────────────────────────

  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date))

  // Reunite tracker — based on flight events
  const pastFlights = events
    .filter(e => e.category === 'flight' && (e.endDate ?? e.date) < today)
    .sort((a, b) => (b.endDate ?? b.date).localeCompare(a.endDate ?? a.date))
  const nextFlight = events
    .filter(e => e.category === 'flight' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const lastFlightEnd = pastFlights[0]?.endDate ?? pastFlights[0]?.date
  const daysApart = lastFlightEnd ? daysBetween(lastFlightEnd, today) : null
  const daysUntil = nextFlight ? daysBetween(today, nextFlight.date) : null
  const reuniteProgress = (daysApart !== null && daysUntil !== null && (daysApart + daysUntil) > 0)
    ? Math.min(100, Math.round((daysApart / (daysApart + daysUntil)) * 100))
    : null

  // Countdown top 3
  const countdownEvents = upcoming.slice(0, 3)

  // Events for selected day in calendar
  const displayEvents = selectedDay
    ? events.filter(e => e.date === selectedDay)
    : tab === 'upcoming' ? upcoming : past

  // Calendar data
  const calDays = getCalendarDays(calMonth.year, calMonth.month)
  const eventDates = new Set(events.map(e => e.date))

  // ── API calls ─────────────────────────────────────────────────────────

  const refreshEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/family/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events ?? [])
      }
    } catch (err) {
      console.error('Failed to refresh events:', err)
    }
  }, [])

  async function handleSaveEvent(data: EventFormData) {
    try {
      const method = editingEvent ? 'PUT' : 'POST'
      const body = editingEvent ? { ...data, id: editingEvent.id } : data

      const res = await fetch('/api/family/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await refreshEvents()
        setShowForm(false)
        setEditingEvent(null)
      }
    } catch (err) {
      console.error('Failed to save event:', err)
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm('Xóa sự kiện này?')) return
    try {
      const res = await fetch(`/api/family/events?id=${id}`, { method: 'DELETE' })
      if (res.ok) await refreshEvents()
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  function handleEdit(event: FamilyEvent) {
    setEditingEvent(event)
    setShowForm(true)
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="plan-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / plan</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Plan <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>lịch gia đình 📅</span>
        </h1>
      </div>

      {/* Top row: Reunite + Dual Clock */}
      <div className="plan-top-row">
        <ReuniteTracker
          daysApart={daysApart}
          daysUntil={daysUntil}
          progress={reuniteProgress}
          nextFlightDate={nextFlight?.date}
          nextFlightTitle={nextFlight?.title}
        />
        <DualClock />
      </div>

      {/* Countdown cards */}
      {countdownEvents.length > 0 && (
        <div className="plan-countdown-row">
          <div className="plan-section-label">⏳ Sắp tới</div>
          <div className="plan-countdown-scroll">
            {countdownEvents.map(e => {
              const days = daysBetween(today, e.date)
              return (
                <div key={e.id} className="countdown-card">
                  <div className="countdown-icon-row">
                    <span className="countdown-icon">{CATEGORY_META[e.category]?.icon ?? '📅'}</span>
                    <span className={`countdown-days ${days <= 7 ? 'soon' : days <= 30 ? 'near' : 'far'}`}>
                      {days === 0 ? 'Hôm nay!' : `${days} ngày`}
                    </span>
                  </div>
                  <div className="countdown-title">{e.title}</div>
                  <div className="countdown-date">{formatDate(e.date)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main grid: Calendar + Events */}
      <div className="plan-main-grid">
        {/* Mini Calendar */}
        <div>
          <MiniCalendar
            year={calMonth.year}
            month={calMonth.month}
            days={calDays}
            today={today}
            selectedDay={selectedDay}
            eventDates={eventDates}
            onSelectDay={(day) => setSelectedDay(day === selectedDay ? null : day)}
            onPrev={() => setCalMonth(prev => {
              const d = new Date(prev.year, prev.month - 1, 1)
              return { year: d.getFullYear(), month: d.getMonth() }
            })}
            onNext={() => setCalMonth(prev => {
              const d = new Date(prev.year, prev.month + 1, 1)
              return { year: d.getFullYear(), month: d.getMonth() }
            })}
          />
        </div>

        {/* Event list */}
        <div className="event-list-card">
          <div className="event-list-header">
            {selectedDay ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>
                  {formatDate(selectedDay)}
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✕ Bỏ lọc
                </button>
              </div>
            ) : (
              <div className="event-list-tabs">
                <button className={`event-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
                  Sắp tới ({upcoming.length})
                </button>
                <button className={`event-tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
                  Đã qua ({past.length})
                </button>
              </div>
            )}
          </div>

          {displayEvents.length === 0 ? (
            <div className="plan-empty">
              {selectedDay ? 'Không có sự kiện ngày này' : 'Chưa có sự kiện nào'}
            </div>
          ) : (
            displayEvents.slice(0, 20).map(e => (
              <div key={e.id} className="event-item">
                <div className="event-item-icon">{CATEGORY_META[e.category]?.icon ?? '📅'}</div>
                <div className="event-item-body">
                  <div className="event-item-title">{e.title}</div>
                  <div className="event-item-meta">
                    {e.date}{e.time ? ` · ${e.time}` : ''}{e.location ? ` · ${e.location}` : ''}
                  </div>
                  {e.description && <div className="event-item-desc">{e.description}</div>}
                </div>
                <span className="event-badge">{CATEGORY_META[e.category]?.labelVi ?? e.category}</span>
                <div className="event-item-actions">
                  <button className="event-action-btn" onClick={() => handleEdit(e)} title="Sửa">✎</button>
                  <button className="event-action-btn delete" onClick={() => handleDeleteEvent(e.id)} title="Xóa">✕</button>
                </div>
              </div>
            ))
          )}

          <button className="add-event-btn" onClick={() => { setEditingEvent(null); setShowForm(true) }}>
            + Thêm sự kiện
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <EventFormModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function ReuniteTracker({
  daysApart, daysUntil, progress, nextFlightDate, nextFlightTitle,
}: {
  daysApart: number | null
  daysUntil: number | null
  progress: number | null
  nextFlightDate?: string
  nextFlightTitle?: string
}) {
  return (
    <div className="reunite-card">
      <div className="reunite-header">🛫 Reunite Tracker</div>

      {daysApart !== null || daysUntil !== null ? (
        <>
          <div className="reunite-stats">
            {daysApart !== null && (
              <div className="reunite-stat-block">
                <div className="reunite-stat-value">{daysApart}</div>
                <div className="reunite-stat-label">ngày xa nhau</div>
              </div>
            )}
            {daysUntil !== null && (
              <div className="reunite-stat-block">
                <div className="reunite-stat-value" style={{ color: '#4ade80' }}>{daysUntil}</div>
                <div className="reunite-stat-label">
                  ngày nữa gặp lại {nextFlightTitle ? `(${nextFlightTitle})` : ''}
                </div>
              </div>
            )}
          </div>

          {progress !== null && (
            <>
              <div className="reunite-progress-track">
                <div className="reunite-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="reunite-progress-label">
                <span>Chia tay</span>
                <span>{progress}%</span>
                <span>{nextFlightDate ? formatDate(nextFlightDate) : 'Gặp lại'}</span>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="reunite-no-flight">
          Thêm sự kiện &quot;flight&quot; để bắt đầu tracking 🛫
        </div>
      )}
    </div>
  )
}

function DualClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const jpTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const vnTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const jpDate = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Tokyo', weekday: 'short', day: 'numeric', month: 'short' })
  const vnDate = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="dual-clock-card">
      <div className="clock-row">
        <div className="clock-flag">🇯🇵</div>
        <div className="clock-info">
          <div className="clock-city">Tokyo · JST</div>
          <div className="clock-time">{jpTime}</div>
          <div className="clock-date">{jpDate}</div>
        </div>
      </div>
      <div className="clock-divider" />
      <div className="clock-diff">+2h so với Việt Nam</div>
      <div className="clock-divider" />
      <div className="clock-row">
        <div className="clock-flag">🇻🇳</div>
        <div className="clock-info">
          <div className="clock-city">Sài Gòn · ICT</div>
          <div className="clock-time">{vnTime}</div>
          <div className="clock-date">{vnDate}</div>
        </div>
      </div>
    </div>
  )
}

// ── Mini Calendar ─────────────────────────────────────────────────────────

interface CalDay {
  date: string
  day: number
  isCurrentMonth: boolean
}

function getCalendarDays(year: number, month: number): CalDay[] {
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalDay[] = []

  // Previous month fill
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = toDateStr(new Date(year, month - 1, d))
    days.push({ date, day: d, isCurrentMonth: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toDateStr(new Date(year, month, d))
    days.push({ date, day: d, isCurrentMonth: true })
  }

  // Next month fill
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const date = toDateStr(new Date(year, month + 1, d))
    days.push({ date, day: d, isCurrentMonth: false })
  }

  return days
}

function MiniCalendar({
  year, month, days, today, selectedDay, eventDates,
  onSelectDay, onPrev, onNext,
}: {
  year: number
  month: number
  days: CalDay[]
  today: string
  selectedDay: string | null
  eventDates: Set<string>
  onSelectDay: (date: string) => void
  onPrev: () => void
  onNext: () => void
}) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">
        <div className="mini-cal-title">{monthLabel}</div>
        <div className="mini-cal-nav">
          <button onClick={onPrev}>‹</button>
          <button onClick={onNext}>›</button>
        </div>
      </div>
      <div className="mini-cal-grid">
        {DAYS.map(d => (
          <div key={d} className="mini-cal-dow">{d}</div>
        ))}
        {days.map((d, i) => {
          const classes = ['mini-cal-day']
          if (!d.isCurrentMonth) classes.push('other-month')
          if (d.date === today) classes.push('today')
          if (d.date === selectedDay) classes.push('selected')
          if (eventDates.has(d.date)) classes.push('has-event')

          return (
            <div
              key={i}
              className={classes.join(' ')}
              onClick={() => d.isCurrentMonth && onSelectDay(d.date)}
            >
              {d.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Event Form Modal ──────────────────────────────────────────────────────

interface EventFormData {
  title: string
  category: EventCategory
  date: string
  endDate?: string
  time?: string
  location?: string
  description?: string
}

function EventFormModal({
  event, onSave, onClose,
}: {
  event: FamilyEvent | null
  onSave: (data: EventFormData) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [category, setCategory] = useState<EventCategory>(event?.category ?? 'other')
  const [date, setDate] = useState(event?.date ?? '')
  const [endDate, setEndDate] = useState(event?.endDate ?? '')
  const [time, setTime] = useState(event?.time ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !date) return
    setSaving(true)
    await onSave({ title, category, date, endDate: endDate || undefined, time: time || undefined, location: location || undefined, description: description || undefined })
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{event ? '✎ Sửa sự kiện' : '+ Thêm sự kiện mới'}</div>

        {/* Quick category pills */}
        <div className="quick-cats">
          {(Object.keys(CATEGORY_META) as EventCategory[]).map(cat => (
            <button
              key={cat}
              type="button"
              className={`quick-cat-btn ${category === cat ? 'selected' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_META[cat].icon} {CATEGORY_META[cat].labelVi}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Bay về thăm nhà"
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu *</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày kết thúc</label>
              <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Giờ</label>
              <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Địa điểm</label>
              <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="VD: Tân Sơn Nhất" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả thêm..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save" disabled={!title || !date || saving}>
              {saving ? 'Đang lưu...' : event ? 'Cập nhật' : 'Thêm sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
