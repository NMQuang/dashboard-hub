'use client'

import { useState } from 'react'
import type { BudgetEntry, ExpenseCategory, Currency } from '@/types/family'

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food',       label: 'Ăn uống',    icon: '🍜' },
  { value: 'rent',       label: 'Nhà',         icon: '🏠' },
  { value: 'baby',       label: 'Đồ bé',       icon: '🍼' },
  { value: 'transport',  label: 'Đi lại',      icon: '🚌' },
  { value: 'medical',    label: 'Y tế',        icon: '🏥' },
  { value: 'education',  label: 'Học phí',     icon: '📚' },
  { value: 'saving',     label: 'Tiết kiệm',   icon: '💰' },
  { value: 'other',      label: 'Khác',        icon: '📦' },
]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export default function FinanceClient({
  initialEntries, currentMonth, jpyRate,
}: {
  initialEntries: BudgetEntry[]
  currentMonth: string
  jpyRate: number
}) {
  const [entries, setEntries]   = useState(initialEntries)
  const [amount, setAmount]     = useState('')
  const [currency, setCurrency] = useState<Currency>('VND')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [desc, setDesc]         = useState('')
  const [location, setLocation] = useState<'vietnam'|'japan'>('vietnam')
  const [adding, setAdding]     = useState(false)

  // Category breakdown
  const breakdown: Record<string, number> = {}
  for (const e of entries) {
    const amtVnd = e.currency === 'VND' ? e.amount : e.amount / jpyRate * 170
    breakdown[e.category] = (breakdown[e.category] ?? 0) + amtVnd
  }
  const totalVnd = Object.values(breakdown).reduce((s, v) => s + v, 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(amount.replace(/,/g, ''))
    if (!amountNum || !desc.trim()) return
    setAdding(true)

    const entry: BudgetEntry = {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      amount: amountNum,
      currency,
      amountVnd: currency === 'VND' ? amountNum : Math.round(amountNum / jpyRate * 170),
      category,
      description: desc.trim(),
      location,
      createdBy: 'me',
      createdAt: new Date().toISOString(),
    }

    const res = await fetch('/api/family/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    const { entry: saved } = await res.json() as { entry: BudgetEntry }
    setEntries(prev => [saved, ...prev])
    setAmount('')
    setDesc('')
    setAdding(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Add form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>Thêm khoản chi</div>
        <form onSubmit={handleAdd}>
          {/* Location + Currency */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['vietnam','japan'] as const).map(l => (
              <button key={l} type="button" onClick={() => { setLocation(l); setCurrency(l === 'japan' ? 'JPY' : 'VND') }} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                borderColor: location === l ? 'var(--ink)' : 'var(--border)',
                background: location === l ? 'var(--ink)' : 'transparent',
                color: location === l ? '#fff' : 'var(--ink2)',
              }}>
                {l === 'vietnam' ? '🇻🇳 VN' : '🇯🇵 Nhật'}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
              {(['VND','JPY','USD'] as Currency[]).map(c => (
                <button key={c} type="button" onClick={() => setCurrency(c)} style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: '1px solid',
                  borderColor: currency === c ? 'var(--blue)' : 'var(--border)',
                  background: currency === c ? '#E6F1FB' : 'transparent',
                  color: currency === c ? 'var(--blue)' : 'var(--ink3)',
                  fontFamily: 'monospace', fontWeight: currency === c ? 500 : 400,
                }}>
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
            placeholder={currency === 'VND' ? '150,000' : currency === 'JPY' ? '1,200' : '50'}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 15,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--ink)', outline: 'none', marginBottom: 8,
              fontFamily: 'monospace', fontWeight: 500,
            }}
          />

          {/* Description */}
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Mô tả (cơm trưa, tiền điện...)"
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--ink)', outline: 'none', marginBottom: 10, fontFamily: 'inherit',
            }}
          />

          {/* Category grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
                padding: '6px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: '1px solid',
                borderColor: category === c.value ? 'var(--ink)' : 'var(--border)',
                background: category === c.value ? 'var(--surface2)' : 'transparent',
                color: category === c.value ? 'var(--ink)' : 'var(--ink3)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 16 }}>{c.icon}</div>
                <div>{c.label}</div>
              </button>
            ))}
          </div>

          <button type="submit" disabled={adding || !amount || !desc.trim()} style={{
            width: '100%', padding: '9px', borderRadius: 8, background: 'var(--ink)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            opacity: adding || !amount || !desc.trim() ? 0.4 : 1,
          }}>
            {adding ? '...' : '+ Thêm khoản chi'}
          </button>
        </form>
      </div>

      {/* Right: breakdown + list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Category breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>Phân loại tháng này</div>
          {Object.entries(breakdown).length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có khoản chi nào</div>
          ) : (
            Object.entries(breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = totalVnd > 0 ? Math.round(amt / totalVnd * 100) : 0
                const info = CATEGORIES.find(c => c.value === cat)
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{info?.icon} {info?.label ?? cat}</span>
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {(amt / 1_000_000).toFixed(1)}M₫ · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--ink)', borderRadius: 99, width: `${pct}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                )
              })
          )}
          {totalVnd > 0 && (
            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Tổng</span>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                {(totalVnd / 1_000_000).toFixed(1)}M₫
              </span>
            </div>
          )}
        </div>

        {/* Recent entries */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>Gần đây</div>
          {entries.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>Chưa có khoản chi nào</div>
          ) : (
            entries.slice(0, 8).map(e => {
              const info = CATEGORIES.find(c => c.value === e.category)
              return (
                <div key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{info?.icon ?? '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                      {e.date} · {e.location === 'japan' ? '🇯🇵' : '🇻🇳'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                      {e.currency === 'JPY' ? `¥${e.amount.toLocaleString()}` : `${(e.amount/1000).toFixed(0)}K₫`}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
