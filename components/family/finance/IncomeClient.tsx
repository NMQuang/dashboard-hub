'use client'

import { useState } from 'react'
import type { FamilyIncome, IncomeSource } from '@/types/family'
import { INCOME_SOURCE_LABELS, INCOME_SOURCE_ICONS } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { toVND, formatVND } from '@/services/familyFinance'

const SOURCES: IncomeSource[] = ['wife_salary_vn', 'husband_vn', 'husband_jp', 'other']

type Currency = 'VND' | 'JPY' | 'USD'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

interface IncomeClientProps {
  initialIncome: FamilyIncome[]
  month: string
  rates: ForexRates
}

export default function IncomeClient({ initialIncome, month, rates }: IncomeClientProps) {
  const [income, setIncome] = useState(initialIncome)

  // Form fields
  const [editingId, setEditingId] = useState<string | null>(null)
  const [source, setSource] = useState<IncomeSource>('wife_salary_vn')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [amount, setAmount] = useState('')
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  // UI state
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterSource, setFilterSource] = useState<IncomeSource | 'all'>('all')
  const [filterCurrency, setFilterCurrency] = useState<Currency | 'all'>('all')
  const [sortKey, setSortKey] = useState<'date' | 'amount' | 'source'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const totalVND = income.filter(i => i.currency === 'VND').reduce((s, i) => s + i.amount, 0)
  const totalJPY = income.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.amount, 0)
  const totalUSD = income.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0)
  const isEditing = editingId !== null

  function toggleSort(key: 'date' | 'amount' | 'source') {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const displayed = income
    .filter(i => {
      if (filterSource !== 'all' && i.source !== filterSource) return false
      if (filterCurrency !== 'all' && i.currency !== filterCurrency) return false
      return true
    })
    .slice()
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.receivedDate.localeCompare(b.receivedDate)
      else if (sortKey === 'amount') cmp = toVND(a.amount, a.currency, rates) - toVND(b.amount, b.currency, rates)
      else if (sortKey === 'source') cmp = a.source.localeCompare(b.source)
      return sortDir === 'asc' ? cmp : -cmp
    })

  function startEdit(item: FamilyIncome) {
    setEditingId(item.id)
    setSource(item.source)
    setCurrency(item.currency)
    setAmount(String(item.amount))
    setReceivedDate(item.receivedDate)
    setNote(item.note ?? '')
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setSource('wife_salary_vn')
    setCurrency('VND')
    setAmount('')
    setReceivedDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(amount.replace(/,/g, ''))
    if (!amountNum || amountNum <= 0) return
    setSaving(true)
    setError(null)

    const country: 'VN' | 'JP' = source === 'husband_jp' ? 'JP' : 'VN'
    const existing = isEditing ? income.find(i => i.id === editingId) : undefined
    const entry: FamilyIncome = {
      id: editingId ?? genId(),
      source,
      country,
      currency,
      amount: amountNum,
      receivedDate,
      note: note.trim() || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/family/finance/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { income: saved } = (await res.json()) as { income: FamilyIncome }

      if (isEditing) {
        setIncome(prev => prev.map(i => i.id === saved.id ? saved : i))
        cancelEdit()
      } else {
        setIncome(prev => [saved, ...prev])
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
      await fetch(`/api/family/finance/income?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setIncome(prev => prev.filter(i => i.id !== id))
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
      <div style={{
        background: isEditing ? '#FFFBEB' : 'var(--surface)',
        border: `1px solid ${isEditing ? '#F59E0B' : 'var(--border)'}`,
        borderRadius: 14, padding: '18px 20px', alignSelf: 'start',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: isEditing ? '#B45309' : 'var(--ink)' }}>
            {isEditing ? '✎ Sửa thu nhập' : '+ Thêm thu nhập'}
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
          {/* Source */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>Nguồn thu</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {SOURCES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSource(s)
                    if (!isEditing) setCurrency(s === 'husband_jp' ? 'JPY' : 'VND')
                  }}
                  style={{
                    padding: '6px 8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: source === s ? 'var(--ink)' : 'var(--border)',
                    background: source === s ? 'var(--ink)' : 'transparent',
                    color: source === s ? '#fff' : 'var(--ink2)',
                    textAlign: 'left',
                  }}
                >
                  {INCOME_SOURCE_ICONS[s]} {INCOME_SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>Đơn vị tiền tệ</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['VND', 'JPY', 'USD'] as Currency[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
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
          </div>

          {/* Amount */}
          <input
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={currency === 'VND' ? '15,000,000' : currency === 'JPY' ? '300,000' : '1,200'}
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
            value={receivedDate}
            onChange={e => setReceivedDate(e.target.value)}
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
            {saving ? 'Đang lưu…' : isEditing ? '✓ Cập nhật' : '+ Thêm thu nhập'}
          </button>
        </form>
      </div>

      {/* Right: summary + list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Monthly total */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 10 }}>Tổng thu nhập tháng {month} · {income.length} khoản</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {totalVND > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
                <span className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>
                  {formatVND(totalVND)}
                </span>
              </div>
            )}
            {totalJPY > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
                <span className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>
                  ¥{totalJPY.toLocaleString('ja-JP')}
                </span>
              </div>
            )}
            {totalUSD > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace' }}>USD</span>
                <span className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>
                  ${totalUSD.toLocaleString()}
                </span>
              </div>
            )}
            {income.length === 0 && (
              <span style={{ fontSize: 13, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có thu nhập</span>
            )}
          </div>
        </div>

      </div>
    </div>

      {/* Filter toolbar + Income table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', ...SOURCES] as (IncomeSource | 'all')[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterSource(s)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
                border: '1px solid',
                borderColor: filterSource === s ? 'var(--ink)' : 'var(--border)',
                background: filterSource === s ? 'var(--ink)' : 'transparent',
                color: filterSource === s ? '#fff' : 'var(--ink2)',
              }}
            >
              {s === 'all' ? 'Tất cả' : `${INCOME_SOURCE_ICONS[s]} ${INCOME_SOURCE_LABELS[s]}`}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
          {(['all', 'VND', 'JPY', 'USD'] as (Currency | 'all')[]).map(c => (
            <button
              key={c}
              onClick={() => setFilterCurrency(c)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer',
                border: '1px solid',
                borderColor: filterCurrency === c ? '#3b82f6' : 'var(--border)',
                background: filterCurrency === c ? '#EFF6FF' : 'transparent',
                color: filterCurrency === c ? '#1d4ed8' : 'var(--ink3)',
                fontFamily: c !== 'all' ? 'monospace' : undefined,
                fontWeight: filterCurrency === c ? 600 : 400,
              }}
            >
              {c === 'all' ? 'Tất cả' : c}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Danh sách thu nhập · {displayed.length}{displayed.length !== income.length ? ` / ${income.length}` : ''} khoản
          </div>
          {displayed.length === 0 ? (
            <p style={{ padding: '16px', fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
              {income.length === 0 ? `Chưa có thu nhập tháng ${month}. Thêm khoản đầu tiên!` : 'Không có kết quả phù hợp.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>#</th>
                    <SortTh label="Nguồn thu" sortKey="source" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortTh label="Ngày" sortKey="date" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Tiền tệ</th>
                    <SortTh label="Số tiền" sortKey="amount" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>≈ VND</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Ghi chú</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((i, idx) => {
                    const vnd = toVND(i.amount, i.currency, rates)
                    const isBeingEdited = editingId === i.id
                    return (
                      <tr key={i.id} style={{ borderTop: '1px solid var(--border)', background: isBeingEdited ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 11 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {INCOME_SOURCE_ICONS[i.source]} {INCOME_SOURCE_LABELS[i.source]}
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 12, whiteSpace: 'nowrap' }}>{i.receivedDate}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                            color: i.currency === 'VND' ? '#16a34a' : i.currency === 'JPY' ? '#0ea5e9' : '#f59e0b',
                            background: i.currency === 'VND' ? '#f0fdf4' : i.currency === 'JPY' ? '#e0f2fe' : '#fffbeb',
                            padding: '2px 7px', borderRadius: 99,
                          }}>
                            {i.currency}
                          </span>
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', fontWeight: 600, color: '#10b981', fontSize: 14, whiteSpace: 'nowrap' }}>
                          {i.currency === 'JPY'
                            ? `¥${i.amount.toLocaleString('ja-JP')}`
                            : i.currency === 'USD'
                              ? `$${i.amount.toLocaleString()}`
                              : formatVND(i.amount)}
                        </td>
                        <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink3)', fontSize: 12 }}>
                          {i.currency !== 'VND' ? `≈ ${formatVND(vnd)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i.note ?? '—'}
                        </td>
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => isBeingEdited ? cancelEdit() : startEdit(i)}
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
                            onClick={() => handleDelete(i.id)}
                            disabled={deletingId === i.id}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--ink3)', fontSize: 16, padding: '0 4px',
                              opacity: deletingId === i.id ? 0.3 : 0.5,
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
