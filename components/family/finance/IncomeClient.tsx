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

  const totalVND = income.filter(i => i.currency === 'VND').reduce((s, i) => s + i.amount, 0)
  const totalJPY = income.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.amount, 0)
  const totalUSD = income.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0)
  const isEditing = editingId !== null

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

        {/* Income list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>
            Danh sách thu nhập
          </div>
          {income.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
              Chưa có thu nhập tháng {month}. Thêm khoản đầu tiên!
            </p>
          ) : (
            income.map(i => {
              const vnd = toVND(i.amount, i.currency, rates)
              const isBeingEdited = editingId === i.id
              return (
                <div
                  key={i.id}
                  style={{
                    display: 'flex', gap: 10, padding: '9px 0',
                    borderBottom: '1px solid var(--border)', alignItems: 'center',
                    background: isBeingEdited ? '#FFFBEB' : 'transparent',
                    marginInline: isBeingEdited ? -16 : 0,
                    paddingInline: isBeingEdited ? 16 : 0,
                    borderRadius: isBeingEdited ? 8 : 0,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{INCOME_SOURCE_ICONS[i.source]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      {INCOME_SOURCE_LABELS[i.source]}
                    </div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {i.receivedDate} · {i.currency}
                      {i.note ? ` · ${i.note}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                      {i.currency === 'JPY'
                        ? `¥${i.amount.toLocaleString('ja-JP')}`
                        : i.currency === 'USD'
                          ? `$${i.amount.toLocaleString()}`
                          : formatVND(i.amount)}
                    </div>
                    {i.currency !== 'VND' && (
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                        ≈ {formatVND(vnd)}
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => isBeingEdited ? cancelEdit() : startEdit(i)}
                    style={{
                      background: isBeingEdited ? '#FEF3C7' : 'none',
                      border: isBeingEdited ? '1px solid #F59E0B' : 'none',
                      cursor: 'pointer', color: '#D97706',
                      fontSize: 13, padding: '2px 6px', borderRadius: 6, flexShrink: 0,
                    }}
                    title={isBeingEdited ? 'Hủy sửa' : 'Sửa'}
                  >
                    {isBeingEdited ? '✕' : '✎'}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(i.id)}
                    disabled={deletingId === i.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink3)', fontSize: 16, padding: '0 4px',
                      opacity: deletingId === i.id ? 0.3 : 0.5, flexShrink: 0,
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
