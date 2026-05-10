'use client'

import { useState } from 'react'
import type { FamilyExpense, ExpenseCategoryFinance } from '@/types/family'
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { toVND, formatVND } from '@/services/familyFinance'

const CATEGORIES: ExpenseCategoryFinance[] = [
  'food', 'rent', 'transportation', 'utilities', 'family', 'shopping', 'travel', 'misc',
]

type Currency = 'VND' | 'JPY'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

interface ExpenseClientProps {
  initialExpenses: FamilyExpense[]
  month: string
  rates: ForexRates
}

export default function ExpenseClient({ initialExpenses, month, rates }: ExpenseClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [country, setCountry] = useState<'VN' | 'JP'>('VN')
  const [category, setCategory] = useState<ExpenseCategoryFinance>('food')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [amount, setAmount] = useState('')
  const [spentDate, setSpentDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<'all' | 'VN' | 'JP'>('all')
  const [filterCategory, setFilterCategory] = useState<ExpenseCategoryFinance | 'all'>('all')

  const totalVND = expenses.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)
  const vnVND = expenses.filter(e => e.country === 'VN').reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)
  const jpVND = expenses.filter(e => e.country === 'JP').reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)

  // Category breakdown
  const catBreakdown: Partial<Record<ExpenseCategoryFinance, number>> = {}
  for (const e of expenses) {
    catBreakdown[e.category] = (catBreakdown[e.category] ?? 0) + toVND(e.amount, e.currency, rates)
  }

  const filtered = expenses.filter(e => {
    if (filterCountry !== 'all' && e.country !== filterCountry) return false
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    return true
  })

  async function handleAdd(evt: React.FormEvent) {
    evt.preventDefault()
    const amountNum = parseFloat(amount.replace(/,/g, ''))
    if (!amountNum || amountNum <= 0) return
    setSaving(true)
    setError(null)

    const entry: FamilyExpense = {
      id: genId(),
      country,
      category,
      amount: amountNum,
      currency,
      spentDate,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/family/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { expense: saved } = (await res.json()) as { expense: FamilyExpense }
      setExpenses(prev => [saved, ...prev])
      setAmount('')
      setNote('')
    } catch (err) {
      setError('Lưu thất bại, thử lại.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/family/finance/expenses?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>

      {/* Add form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
            + Thêm khoản chi
          </div>

          <form onSubmit={handleAdd}>
            {/* Country + Currency */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {(['VN', 'JP'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCountry(c)
                    setCurrency(c === 'JP' ? 'JPY' : 'VND')
                  }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: country === c ? 'var(--ink)' : 'var(--border)',
                    background: country === c ? 'var(--ink)' : 'transparent',
                    color: country === c ? '#fff' : 'var(--ink2)',
                  }}
                >
                  {c === 'VN' ? '🇻🇳 Việt Nam' : '🇯🇵 Nhật Bản'}
                </button>
              ))}
              {(['VND', 'JPY'] as Currency[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: currency === c ? '#3b82f6' : 'var(--border)',
                    background: currency === c ? '#EFF6FF' : 'transparent',
                    color: currency === c ? '#1d4ed8' : 'var(--ink3)',
                    fontFamily: 'monospace', fontWeight: currency === c ? 600 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Category grid */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>Danh mục</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '6px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: category === cat ? 'var(--ink)' : 'var(--border)',
                      background: category === cat ? 'var(--surface2)' : 'transparent',
                      color: category === cat ? 'var(--ink)' : 'var(--ink3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{EXPENSE_CATEGORY_ICONS[cat]}</div>
                    <div style={{ fontSize: 10 }}>{EXPENSE_CATEGORY_LABELS[cat]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={currency === 'VND' ? '500,000' : '3,000'}
              required
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 15,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', outline: 'none', marginBottom: 8,
                fontFamily: 'monospace', fontWeight: 500, boxSizing: 'border-box',
              }}
            />

            {/* Date */}
            <input
              type="date"
              value={spentDate}
              onChange={e => setSpentDate(e.target.value)}
              required
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', outline: 'none', marginBottom: 8, boxSizing: 'border-box',
              }}
            />

            {/* Note */}
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú (không bắt buộc)"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', outline: 'none', marginBottom: 12, boxSizing: 'border-box',
              }}
            />

            {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{error}</div>}

            <button
              type="submit"
              disabled={saving || !amount}
              style={{
                width: '100%', padding: '9px', borderRadius: 8,
                background: 'var(--ink)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: saving || !amount ? 0.4 : 1,
              }}
            >
              {saving ? 'Đang lưu…' : '+ Thêm khoản chi'}
            </button>
          </form>
        </div>

        {/* Category breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>Phân loại tháng {month}</div>
          {Object.entries(catBreakdown).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có khoản chi</p>
          ) : (
            <>
              {Object.entries(catBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, vnd]) => {
                  const pct = totalVND > 0 ? Math.round(vnd / totalVND * 100) : 0
                  const catKey = cat as ExpenseCategoryFinance
                  return (
                    <div key={cat} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
                          {EXPENSE_CATEGORY_ICONS[catKey]} {EXPENSE_CATEGORY_LABELS[catKey]}
                        </span>
                        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink3)' }}>
                          {formatVND(vnd)} · {pct}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--ink)', borderRadius: 99, width: `${pct}%`, opacity: 0.65 }} />
                      </div>
                    </div>
                  )
                })}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--ink2)' }}>Tổng</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatVND(totalVND)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>🇻🇳 VN</span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>{formatVND(vnVND)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>🇯🇵 JP</span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>{formatVND(jpVND)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: filter + list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'VN', 'JP'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCountry(c)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: '1px solid',
                borderColor: filterCountry === c ? 'var(--ink)' : 'var(--border)',
                background: filterCountry === c ? 'var(--ink)' : 'transparent',
                color: filterCountry === c ? '#fff' : 'var(--ink2)',
              }}
            >
              {c === 'all' ? 'Tất cả' : c === 'VN' ? '🇻🇳 VN' : '🇯🇵 JP'}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {(['all', ...CATEGORIES] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
                border: '1px solid',
                borderColor: filterCategory === c ? 'var(--ink)' : 'var(--border)',
                background: filterCategory === c ? 'var(--surface2)' : 'transparent',
                color: filterCategory === c ? 'var(--ink)' : 'var(--ink3)',
              }}
            >
              {c === 'all' ? 'Tất cả' : `${EXPENSE_CATEGORY_ICONS[c]} ${EXPENSE_CATEGORY_LABELS[c]}`}
            </button>
          ))}
        </div>

        {/* Expense list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>
            {filtered.length} khoản chi
          </div>
          {filtered.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>Không có khoản chi nào.</p>
          ) : (
            filtered.map(e => {
              const vnd = toVND(e.amount, e.currency, rates)
              return (
                <div
                  key={e.id}
                  style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{EXPENSE_CATEGORY_ICONS[e.category]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      {EXPENSE_CATEGORY_LABELS[e.category]}
                      <span style={{ fontWeight: 400, color: 'var(--ink3)', fontSize: 11.5, marginLeft: 6 }}>
                        {e.country === 'JP' ? '🇯🇵' : '🇻🇳'}
                      </span>
                    </div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {e.spentDate}{e.note ? ` · ${e.note}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>
                      {e.currency === 'JPY'
                        ? `¥${e.amount.toLocaleString('ja-JP')}`
                        : formatVND(e.amount)}
                    </div>
                    {e.currency !== 'VND' && (
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                        ≈ {formatVND(vnd)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={deletingId === e.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink3)', fontSize: 16, padding: '0 4px',
                      opacity: deletingId === e.id ? 0.3 : 0.5, flexShrink: 0,
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
