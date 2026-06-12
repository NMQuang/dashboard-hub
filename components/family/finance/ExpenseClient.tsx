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

  // Form fields
  const [editingId, setEditingId] = useState<string | null>(null)
  const [country, setCountry] = useState<'VN' | 'JP'>('VN')
  const [category, setCategory] = useState<ExpenseCategoryFinance>('food')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [amount, setAmount] = useState('')
  const [spentDate, setSpentDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  // UI state
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<'all' | 'VN' | 'JP'>('all')
  const [filterCategory, setFilterCategory] = useState<ExpenseCategoryFinance | 'all'>('all')
  const [sortKey, setSortKey] = useState<'date' | 'amount' | 'category' | 'country'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const isEditing = editingId !== null
  const isFiltered = filterCountry !== 'all' || filterCategory !== 'all'

  const totalConvertedVND = expenses.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)
  const totalExpVND = expenses.filter(e => e.currency === 'VND').reduce((s, e) => s + e.amount, 0)
  const totalExpJPY = expenses.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0)

  const catBreakdown: Partial<Record<ExpenseCategoryFinance, number>> = {}
  for (const e of expenses) {
    catBreakdown[e.category] = (catBreakdown[e.category] ?? 0) + toVND(e.amount, e.currency, rates)
  }

  const filtered = expenses.filter(e => {
    if (filterCountry !== 'all' && e.country !== filterCountry) return false
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    return true
  })

  function toggleSort(key: 'date' | 'amount' | 'category' | 'country') {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0
    if (sortKey === 'date') cmp = a.spentDate.localeCompare(b.spentDate)
    else if (sortKey === 'amount') cmp = toVND(a.amount, a.currency, rates) - toVND(b.amount, b.currency, rates)
    else if (sortKey === 'category') cmp = a.category.localeCompare(b.category)
    else if (sortKey === 'country') cmp = a.country.localeCompare(b.country)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const sortedVND = sorted.filter(e => e.currency === 'VND').reduce((s, e) => s + e.amount, 0)
  const sortedJPY = sorted.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0)
  const sortedTotalVND = sorted.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)

  function startEdit(item: FamilyExpense) {
    setEditingId(item.id)
    setCountry(item.country)
    setCategory(item.category)
    setCurrency(item.currency)
    setAmount(String(item.amount))
    setSpentDate(item.spentDate)
    setNote(item.note ?? '')
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setCountry('VN')
    setCategory('food')
    setCurrency('VND')
    setAmount('')
    setSpentDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setError(null)
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    const amountNum = parseFloat(amount.replace(/,/g, ''))
    if (!amountNum || amountNum <= 0) return
    setSaving(true)
    setError(null)

    const existing = isEditing ? expenses.find(e => e.id === editingId) : undefined
    const entry: FamilyExpense = {
      id: editingId ?? genId(),
      country,
      category,
      amount: amountNum,
      currency,
      spentDate,
      note: note.trim() || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/family/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { expense: saved } = (await res.json()) as { expense: FamilyExpense }

      if (isEditing) {
        setExpenses(prev => prev.map(e => e.id === saved.id ? saved : e))
        cancelEdit()
      } else {
        setExpenses(prev => [saved, ...prev])
        setAmount('')
        setNote('')
      }
    } catch (err) {
      setError('Lưu thất bại, thử lại.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (editingId === id) cancelEdit()
    setDeletingId(id)
    try {
      const item = expenses.find(e => e.id === id)
      const amt = item
        ? item.currency === 'JPY' ? `¥${new Intl.NumberFormat('ja-JP').format(item.amount)}` : `${new Intl.NumberFormat('vi-VN').format(item.amount)}₫`
        : ''
      const desc = item ? `chi tiêu ${amt} — ${EXPENSE_CATEGORY_LABELS[item.category] ?? item.category}` : 'chi tiêu'
      const monthParam = item?.spentDate.slice(0, 7) ?? ''
      await fetch(`/api/family/finance/expenses?id=${encodeURIComponent(id)}&month=${monthParam}&desc=${encodeURIComponent(desc)}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>

      {/* Form */}
      <div style={{ alignSelf: 'start' }}>
        <div style={{
          background: isEditing ? '#FFFBEB' : 'var(--surface)',
          border: `1px solid ${isEditing ? '#F59E0B' : 'var(--border)'}`,
          borderRadius: 14, padding: '18px 20px',
          transition: 'background 0.15s, border-color 0.15s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: isEditing ? '#B45309' : 'var(--ink)' }}>
              {isEditing ? '✎ Sửa khoản chi' : '+ Thêm khoản chi'}
            </div>
            {isEditing && (
              <button
                onClick={cancelEdit}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', padding: '2px 6px' }}
              >
                Hủy
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
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
                background: isEditing ? '#D97706' : 'var(--ink)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: saving || !amount ? 0.4 : 1,
              }}
            >
              {saving ? 'Đang lưu…' : isEditing ? '✓ Cập nhật' : '+ Thêm khoản chi'}
            </button>
          </form>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', alignSelf: 'start' }}>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>Phân loại tháng {month}</div>
        {Object.entries(catBreakdown).length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có khoản chi</p>
        ) : (
          <>
            {Object.entries(catBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, vnd]) => {
                const pct = totalConvertedVND > 0 ? Math.round(vnd / totalConvertedVND * 100) : 0
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
            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {totalExpVND > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatVND(totalExpVND)}</span>
                </div>
              )}
              {totalExpJPY > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>¥{totalExpJPY.toLocaleString('ja-JP')}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>

      {/* Filters + Expense table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        <div style={{ background: 'var(--surface)', border: `1px solid ${isFiltered ? '#3b82f6' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              {isFiltered
                ? <><strong style={{ color: '#3b82f6' }}>{sorted.length}</strong>/{expenses.length} khoản chi (đang lọc)</>
                : <>{sorted.length} khoản chi</>}
            </span>
            {isFiltered && (
              <button
                onClick={() => { setFilterCountry('all'); setFilterCategory('all') }}
                style={{ fontSize: 10, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 99, padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Bỏ lọc
              </button>
            )}
          </div>
          {sorted.length === 0 ? (
            <p style={{ padding: '16px', fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
              {expenses.length === 0 ? 'Chưa có khoản chi nào.' : 'Không có kết quả phù hợp.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>#</th>
                    <SortTh label="Danh mục" sortKey="category" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortTh label="Nơi" sortKey="country" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortTh label="Ngày" sortKey="date" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Tiền tệ</th>
                    <SortTh label="Số tiền" sortKey="amount" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>≈ VND</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Ghi chú</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}></th>
                  </tr>
                  {/* Totals rows — aligned with Số tiền column */}
                  {sorted.length > 0 && (() => {
                    const rows: { label: string; amount: string; vndEquiv: string; color: string }[] = []
                    if (sortedVND > 0) rows.push({ label: isFiltered ? `Tổng lọc · ${sorted.length}/${expenses.length} khoản` : `Tổng · ${sorted.length} khoản`, amount: formatVND(sortedVND), vndEquiv: '', color: '#ef4444' })
                    if (sortedJPY > 0) rows.push({ label: rows.length === 0 ? (isFiltered ? `Tổng lọc · ${sorted.length}/${expenses.length} khoản` : `Tổng · ${sorted.length} khoản`) : '', amount: `¥${sortedJPY.toLocaleString('ja-JP')}`, vndEquiv: `≈ ${formatVND(toVND(sortedJPY, 'JPY', rates))}`, color: '#ef4444' })
                    return rows.map((r, i) => (
                      <tr key={i} style={{ background: '#fef2f2', borderTop: i === 0 ? '1px solid #fecaca' : 'none', borderBottom: i === rows.length - 1 ? '2px solid #fecaca' : 'none' }}>
                        <td colSpan={5} style={{ padding: i === 0 ? '7px 12px 4px' : '4px 12px 7px', fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic' }}>{r.label}</td>
                        <td className="font-mono" style={{ padding: i === 0 ? '7px 12px 4px' : '4px 12px 7px', fontWeight: 700, color: r.color, fontSize: 14, whiteSpace: 'nowrap' }}>{r.amount}</td>
                        <td className="font-mono" style={{ padding: i === 0 ? '7px 12px 4px' : '4px 12px 7px', fontWeight: 500, color: 'var(--ink3)', fontSize: 12, whiteSpace: 'nowrap' }}>{r.vndEquiv}</td>
                        <td colSpan={2} />
                      </tr>
                    ))
                  })()}
                </thead>
                <tbody>
                  {sorted.map((e, idx) => {
                    const vnd = toVND(e.amount, e.currency, rates)
                    const isBeingEdited = editingId === e.id
                    return (
                      <tr key={e.id} style={{ borderTop: '1px solid var(--border)', background: isBeingEdited ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 11 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {EXPENSE_CATEGORY_ICONS[e.category]} {EXPENSE_CATEGORY_LABELS[e.category]}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 16 }}>
                          {e.country === 'JP' ? '🇯🇵' : '🇻🇳'}
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 12, whiteSpace: 'nowrap' }}>{e.spentDate}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                            color: e.currency === 'VND' ? '#16a34a' : '#0ea5e9',
                            background: e.currency === 'VND' ? '#f0fdf4' : '#e0f2fe',
                            padding: '2px 7px', borderRadius: 99,
                          }}>
                            {e.currency}
                          </span>
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', fontWeight: 600, color: '#ef4444', fontSize: 14, whiteSpace: 'nowrap' }}>
                          {e.currency === 'JPY'
                            ? `¥${e.amount.toLocaleString('ja-JP')}`
                            : formatVND(e.amount)}
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 12 }}>
                          {e.currency !== 'VND' ? `≈ ${formatVND(vnd)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.note ?? '—'}
                        </td>
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => isBeingEdited ? cancelEdit() : startEdit(e)}
                            style={{
                              background: isBeingEdited ? '#FEF3C7' : 'none',
                              border: isBeingEdited ? '1px solid #F59E0B' : 'none',
                              cursor: 'pointer', color: '#D97706',
                              fontSize: 13, padding: '2px 6px', borderRadius: 6, marginRight: 4,
                            }}
                            title={isBeingEdited ? 'Hủy sửa' : 'Sửa'}
                          >
                            {isBeingEdited ? '✕' : '✎'}
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            disabled={deletingId === e.id}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--ink3)', fontSize: 16, padding: '0 4px',
                              opacity: deletingId === e.id ? 0.3 : 0.5,
                            }}
                            title="Xóa"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SortTh({ label, sortKey: key, current, dir, onSort }: {
  label: string
  sortKey: string
  current: string
  dir: 'asc' | 'desc'
  onSort: (key: any) => void
}) {
  const active = current === key
  return (
    <th
      onClick={() => onSort(key)}
      style={{
        padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500,
        whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
        color: active ? 'var(--ink)' : 'var(--ink3)',
      }}
    >
      {label}{' '}
      <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  )
}
