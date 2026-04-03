'use client'

import { useState } from 'react'
import type { DailyCheckIn } from '@/types/family'

const MOODS = [
  { value: 1, label: 'Mệt', emoji: '😔' },
  { value: 2, label: 'Bình', emoji: '😐' },
  { value: 3, label: 'Ổn', emoji: '🙂' },
  { value: 4, label: 'Vui', emoji: '😊' },
  { value: 5, label: 'Tuyệt', emoji: '😄' },
] as const

export default function ConnectClient({ initialCheckins }: { initialCheckins: DailyCheckIn[] }) {
  const [checkins, setCheckins] = useState(initialCheckins)
  const [text, setText] = useState('')
  const [textJa, setTextJa] = useState('')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [author, setAuthor] = useState<'me' | 'partner'>('me')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showJa, setShowJa] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)

    const res = await fetch('/api/family/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, mood, text: text.trim(), textJa: textJa.trim() || undefined, location: location.trim() || undefined }),
    })
    const { checkIn } = await res.json() as { checkIn: DailyCheckIn }
    setCheckins(prev => [checkIn, ...prev])
    setText('')
    setTextJa('')
    setLocation('')
    setSubmitting(false)
  }

  return (
    <div>
      {/* Write check-in */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>

        {/* Author toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['me', 'partner'] as const).map(a => (
            <button key={a} onClick={() => setAuthor(a)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
              border: '1px solid', fontWeight: author === a ? 500 : 400,
              borderColor: author === a ? 'var(--ink)' : 'var(--border)',
              background: author === a ? 'var(--ink)' : 'transparent',
              color: author === a ? '#fff' : 'var(--ink2)',
            }}>
              {a === 'me' ? '🇯🇵 Ba Cafe (Nhật)' : '🇻🇳 Mẹ Cafe (nhà)'}
            </button>
          ))}
        </div>

        {/* Mood picker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setMood(m.value as 1 | 2 | 3 | 4 | 5)} style={{
              padding: '6px 10px', borderRadius: 10, fontSize: 20, cursor: 'pointer', border: '2px solid',
              borderColor: mood === m.value ? 'var(--ink)' : 'var(--border)',
              background: mood === m.value ? 'var(--surface2)' : 'transparent',
              lineHeight: 1,
            }} title={m.label}>
              {m.emoji}
            </button>
          ))}
          <span style={{ fontSize: 12.5, color: 'var(--ink3)', alignSelf: 'center', marginLeft: 4 }}>
            {MOODS.find(m => m.value === mood)?.label}
          </span>
        </div>

        {/* Text input */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={author === 'me'
              ? 'Hôm nay ở Nhật thế nào? Công việc, đồ ăn, trải nghiệm...'
              : 'Hôm nay ở nhà thế nào? Bé có gì mới không?'
            }
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--ink)', resize: 'vertical', outline: 'none', lineHeight: 1.6,
              fontFamily: 'inherit', marginBottom: 10,
            }}
          />

          {/* Japanese input toggle */}
          {author === 'me' && (
            <div style={{ marginBottom: 10 }}>
              <button type="button" onClick={() => setShowJa(!showJa)} style={{
                fontSize: 11.5, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                {showJa ? '− Ẩn' : '+ Thêm'} bản tiếng Nhật (luyện tập)
              </button>
              {showJa && (
                <textarea
                  value={textJa}
                  onChange={e => setTextJa(e.target.value)}
                  placeholder="日本語で書いてみましょう... (AI sẽ dịch sang tiếng Việt)"
                  rows={2}
                  style={{
                    width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14,
                    border: '1px solid var(--border)', background: 'var(--surface2)',
                    color: 'var(--ink)', resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
                  }}
                />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Địa điểm (Tokyo, Q1...)"
              style={{
                flex: 1, padding: '7px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={submitting || !text.trim()} style={{
              padding: '8px 18px', borderRadius: 8, background: 'var(--ink)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              opacity: submitting || !text.trim() ? 0.4 : 1,
            }}>
              {submitting ? '...' : 'Gửi'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {checkins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink3)', fontSize: 14 }}>
            Chưa có check-in nào. Ghi ngay hôm nay!
          </div>
        ) : (
          checkins.map(c => <CheckInCard key={c.id} checkIn={c} />)
        )}
      </div>
    </div>
  )
}

function CheckInCard({ checkIn }: { checkIn: DailyCheckIn }) {
  const moodEmoji = MOODS.find(m => m.value === checkIn.mood)?.emoji ?? '🙂'
  const isMe = checkIn.author === 'me'
  const moodColors = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px',
      borderLeft: `3px solid ${isMe ? '#3B82F6' : '#EC4899'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{moodEmoji}</span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: isMe ? 'var(--blue)' : '#BE185D' }}>
          {isMe ? '🇯🇵 Ba Cafe' : '🇻🇳 Mẹ Cafe'}
        </span>
        {checkIn.location && (
          <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>· {checkIn.location}</span>
        )}
        <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)' }}>
          {new Date(checkIn.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
        </span>
      </div>

      <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, marginBottom: checkIn.textJa ? 8 : 0 }}>
        {checkIn.textViTranslated ?? checkIn.text}
      </p>

      {checkIn.textJa && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
          <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.7 }}>{checkIn.textJa}</p>
          {checkIn.textViTranslated && checkIn.textJa !== checkIn.text && (
            <p style={{ fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic', marginTop: 2 }}>↳ {checkIn.textViTranslated}</p>
          )}
        </div>
      )}
    </div>
  )
}
