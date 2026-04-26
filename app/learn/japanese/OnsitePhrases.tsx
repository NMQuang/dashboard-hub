'use client'

import { useState } from 'react'
import { ONSITE_CATEGORIES } from '@/types'
import type { JapanesePhrase, OnsiteCategory, PhraseType } from '@/types'
import './onsite-phrases.css'

/* ── Static starter hints per category ──────────────────────────────────── */

const HINTS: Record<OnsiteCategory, string> = {
  '会議':  '例: 会議を始めましょう',
  'メール': '例: お世話になっております',
  '電話':  '例: 〜の件でお電話しました',
  '報告':  '例: 進捗をご報告いたします',
  '相談':  '例: ご相談したいことがあるのですが',
  '依頼':  '例: ご確認いただけますでしょうか',
  '謝罪':  '例: 大変申し訳ございません',
  '確認':  '例: ご確認のほどよろしくお願いいたします',
}

const CATEGORY_ICONS: Record<OnsiteCategory, string> = {
  '会議':  '👥',
  'メール': '📧',
  '電話':  '📞',
  '報告':  '📊',
  '相談':  '💬',
  '依頼':  '🤝',
  '謝罪':  '🙇',
  '確認':  '✅',
}

const TYPE_LABELS: Record<PhraseType, string> = {
  sample_phrase:    'Câu mẫu',
  template:         'Template',
  scenario_example: 'Tình huống',
}

const DIFFICULTY_LABELS = { basic: 'Cơ bản', practical: 'Thực tế' } as const

type TypeFilter = 'all' | PhraseType

/* ── Props ───────────────────────────────────────────────────────────────── */

interface OnsitePhrasesProps {
  initialPhrases: JapanesePhrase[]
  dbAvailable: boolean
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function OnsitePhrases({ initialPhrases, dbAvailable }: OnsitePhrasesProps) {
  const [phrases, setPhrases]       = useState<JapanesePhrase[]>(initialPhrases)
  const [activeCategory, setActive] = useState<OnsiteCategory>('会議')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [showForm, setShowForm]     = useState(false)

  /* add form state */
  const [jpInput, setJp]         = useState('')
  const [vnInput, setVn]         = useState('')
  const [noteInput, setNote]     = useState('')
  const [titleInput, setTitle]   = useState('')
  const [typeInput, setTypeInput] = useState<PhraseType | ''>('')
  const [saving, setSaving]      = useState(false)
  const [err, setErr]            = useState<string | null>(null)
  const [ok, setOk]              = useState(false)

  /* deleting state (tracks which ids are being deleted) */
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

  /* ── helpers ── */

  function countForCategory(cat: OnsiteCategory): number {
    return phrases.filter(p => p.category === cat).length
  }

  function visiblePhrases(): JapanesePhrase[] {
    return phrases.filter(p =>
      p.category === activeCategory &&
      (typeFilter === 'all' || p.phraseType === typeFilter),
    )
  }

  function hasTypedPhrases(): boolean {
    return phrases.some(p => p.category === activeCategory && p.phraseType)
  }

  function resetForm() {
    setJp(''); setVn(''); setNote(''); setTitle(''); setTypeInput(''); setErr(null); setOk(false)
  }

  /* ── add phrase ── */

  async function handleAdd() {
    setErr(null); setOk(false)
    const jp = jpInput.trim()
    if (!jp) { setErr('Bắt buộc nhập tiếng Nhật'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/japanese/phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          japanese: jp,
          vietnamese: vnInput.trim() || undefined,
          note: noteInput.trim() || undefined,
          title: titleInput.trim() || undefined,
          phraseType: typeInput || undefined,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json()
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>)['error'])
            : 'Lỗi server'
        setErr(msg)
        return
      }

      const data: unknown = await res.json()
      if (
        typeof data === 'object' && data !== null &&
        'phrase' in data &&
        typeof (data as Record<string, unknown>)['phrase'] === 'object'
      ) {
        const saved = (data as Record<string, unknown>)['phrase'] as JapanesePhrase
        setPhrases(prev => {
          const next: JapanesePhrase[] = []
          next.push(saved)
          for (const p of prev) next.push(p)
          return next
        })
        setOk(true)
        resetForm()
        setTimeout(() => setOk(false), 3000)
      }
    } catch {
      setErr('Không thể kết nối server')
    } finally {
      setSaving(false)
    }
  }

  /* ── delete phrase ── */

  async function handleDelete(id: string) {
    setDeleting(prev => {
      const next = new Set<string>(prev)
      next.add(id)
      return next
    })
    try {
      const res = await fetch(`/api/japanese/phrases?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPhrases(prev => prev.filter(p => p.id !== id))
      }
    } catch {
      /* silently keep the item in the list */
    } finally {
      setDeleting(prev => {
        const next = new Set<string>(prev)
        next.delete(id)
        return next
      })
    }
  }

  /* ── render ── */

  return (
    <div>
      {/* DB unavailable warning */}
      {!dbAvailable && (
        <div className="op-db-warn">
          ⚠ Supabase chưa được cấu hình — các phrase sẽ không được lưu lâu dài. Thêm{' '}
          <code>SUPABASE_URL</code> và <code>SUPABASE_SERVICE_ROLE_KEY</code> vào{' '}
          <code>.env.local</code> để bật tính năng này.
        </div>
      )}

      {/* Category tabs */}
      <div className="op-cat-tabs">
        {ONSITE_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`op-cat-tab${cat === activeCategory ? ' active' : ''}`}
            onClick={() => { setActive(cat); setTypeFilter('all'); setShowForm(false); resetForm() }}
          >
            {CATEGORY_ICONS[cat]} {cat}
            {countForCategory(cat) > 0 && (
              <span className="op-cat-count">{countForCategory(cat)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Type filter tabs — only shown when category has typed phrases */}
      {hasTypedPhrases() && (
        <div className="op-type-tabs">
          {(['all', 'sample_phrase', 'template', 'scenario_example'] as TypeFilter[]).map(tf => (
            <button
              key={tf}
              className={`op-type-tab${typeFilter === tf ? ' active' : ''}`}
              onClick={() => setTypeFilter(tf)}
            >
              {tf === 'all' ? 'Tất cả' : TYPE_LABELS[tf]}
            </button>
          ))}
        </div>
      )}

      {/* Phrase list */}
      <div className="op-list">
        {visiblePhrases().length === 0 ? (
          <div className="op-empty">
            Chưa có phrase nào{typeFilter !== 'all' ? ` (${TYPE_LABELS[typeFilter]})` : ''} trong mục <strong>{activeCategory}</strong>.
            {typeFilter === 'all' && <> Bấm &ldquo;+ Thêm&rdquo; để lưu phrase đầu tiên.</>}
          </div>
        ) : (
          visiblePhrases().map(phrase => (
            <div key={phrase.id} className="op-phrase-card">
              <div className="op-phrase-body">
                {phrase.title && (
                  <div className="op-phrase-title">{phrase.title}</div>
                )}
                <div className="op-phrase-badges">
                  {phrase.phraseType && (
                    <span className={`op-badge op-badge-type op-badge-${phrase.phraseType}`}>
                      {TYPE_LABELS[phrase.phraseType]}
                    </span>
                  )}
                  {phrase.difficulty && (
                    <span className={`op-badge op-badge-diff op-badge-${phrase.difficulty}`}>
                      {DIFFICULTY_LABELS[phrase.difficulty]}
                    </span>
                  )}
                </div>
                <div className="op-phrase-jp">{phrase.japanese}</div>
                {phrase.vietnamese && (
                  <div className="op-phrase-vn">{phrase.vietnamese}</div>
                )}
                {phrase.note && (
                  <div className="op-phrase-note">{phrase.note}</div>
                )}
                {phrase.tags && phrase.tags.length > 0 && (
                  <div className="op-phrase-tags">
                    {phrase.tags.map(t => (
                      <span key={t} className="op-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="op-phrase-delete"
                disabled={deleting.has(phrase.id)}
                onClick={() => handleDelete(phrase.id)}
                aria-label="Xóa"
              >
                {deleting.has(phrase.id) ? '…' : '✕'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form toggle */}
      {!showForm ? (
        <button
          className="op-add-btn-secondary"
          onClick={() => { setShowForm(true); resetForm() }}
        >
          + Thêm phrase
        </button>
      ) : (
        <div className="op-add-form">
          <div className="op-add-title">
            {CATEGORY_ICONS[activeCategory]} Thêm phrase — {activeCategory}
          </div>
          <div className="op-add-row">
            <div className="op-add-row-inline">
              <div className="op-add-field op-add-field-grow">
                <label className="op-add-label">Tiêu đề (tùy chọn)</label>
                <input
                  className="op-add-input"
                  placeholder="Ví dụ: Mở đầu cuộc họp"
                  value={titleInput}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="op-add-field op-add-field-type">
                <label className="op-add-label">Loại</label>
                <select
                  className="op-add-select"
                  value={typeInput}
                  onChange={e => setTypeInput(e.target.value as PhraseType | '')}
                >
                  <option value="">—</option>
                  <option value="sample_phrase">Câu mẫu</option>
                  <option value="template">Template</option>
                  <option value="scenario_example">Tình huống</option>
                </select>
              </div>
            </div>
            <div className="op-add-field">
              <label className="op-add-label">Tiếng Nhật *</label>
              <input
                className="op-add-input"
                placeholder={HINTS[activeCategory]}
                value={jpInput}
                onChange={e => setJp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              />
            </div>
            <div className="op-add-field">
              <label className="op-add-label">Tiếng Việt (tùy chọn)</label>
              <input
                className="op-add-input"
                placeholder="Nghĩa / diễn giải"
                value={vnInput}
                onChange={e => setVn(e.target.value)}
              />
            </div>
            <div className="op-add-field">
              <label className="op-add-label">Ghi chú (tùy chọn)</label>
              <textarea
                className="op-add-textarea"
                rows={2}
                placeholder="Ngữ cảnh, cách dùng..."
                value={noteInput}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <div className="op-add-actions">
              <button
                className="op-add-btn"
                disabled={saving || !jpInput.trim()}
                onClick={handleAdd}
              >
                {saving ? '…' : 'Lưu'}
              </button>
              <button
                className="op-add-btn-secondary"
                onClick={() => { setShowForm(false); resetForm() }}
              >
                Hủy
              </button>
              {err && <span className="op-err">{err}</span>}
              {ok  && <span className="op-ok">✓ Đã lưu</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
