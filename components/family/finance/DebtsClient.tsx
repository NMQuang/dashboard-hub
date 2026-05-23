'use client'

import { useState } from 'react'
import type { FamilyDebt, DebtType, DebtStatus } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { formatJPY, formatVND, toVND, toJPY } from '@/services/familyFinance'

interface Props {
  initialDebts: FamilyDebt[]
  rates: ForexRates
}

const emptyDebt = (): Partial<FamilyDebt> => ({
  type: 'owe',
  currency: 'JPY',
  status: 'active',
  paidAmount: 0,
})

const STATUS_LABEL: Record<DebtStatus, string> = {
  active: 'Còn nợ',
  partial: 'Trả một phần',
  settled: 'Đã xong',
}
const STATUS_COLOR: Record<DebtStatus, string> = {
  active: '#ef4444',
  partial: '#f59e0b',
  settled: '#22c55e',
}

export default function DebtsClient({ initialDebts, rates }: Props) {
  const [debts, setDebts] = useState<FamilyDebt[]>(initialDebts)
  const [form, setForm] = useState<Partial<FamilyDebt>>(emptyDebt())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [settleModal, setSettleModal] = useState<FamilyDebt | null>(null)
  const [settleAmount, setSettleAmount] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all')

  const iOwe = debts.filter(d => d.type === 'owe')
  const theyOwe = debts.filter(d => d.type === 'lend')

  const totalIOwe = iOwe
    .filter(d => d.status !== 'settled')
    .reduce((s, d) => s + toVND(d.amount - d.paidAmount, d.currency, rates), 0)

  const totalTheyOwe = theyOwe
    .filter(d => d.status !== 'settled')
    .reduce((s, d) => s + toVND(d.amount - d.paidAmount, d.currency, rates), 0)

  const filtered = (list: FamilyDebt[]) =>
    filter === 'all' ? list :
    filter === 'settled' ? list.filter(d => d.status === 'settled') :
    list.filter(d => d.status !== 'settled')

  async function handleSave() {
    if (!form.person?.trim()) { setError('Nhập tên người'); return }
    if (!form.amount || form.amount <= 0) { setError('Nhập số tiền'); return }
    setLoading(true); setError('')
    const debt: FamilyDebt = {
      id: `debt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: form.type ?? 'owe',
      person: form.person!.trim(),
      amount: Number(form.amount),
      currency: form.currency ?? 'JPY',
      description: form.description?.trim() || undefined,
      dueDate: form.dueDate || undefined,
      status: 'active',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    }
    const res = await fetch('/api/family/finance/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debt),
    })
    if (res.ok) {
      setDebts(prev => [debt, ...prev])
      setForm(emptyDebt())
      setShowForm(false)
    } else {
      setError('Lưu thất bại')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/family/finance/debts?id=${id}`, { method: 'DELETE' })
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  async function handleSettle() {
    if (!settleModal) return
    const paid = Number(settleAmount)
    if (isNaN(paid) || paid < 0) { setError('Số tiền không hợp lệ'); return }
    setLoading(true); setError('')

    const newPaid = settleModal.paidAmount + paid
    const remaining = settleModal.amount - newPaid
    const status: DebtStatus = remaining <= 0 ? 'settled' : 'partial'

    const updated: FamilyDebt = {
      ...settleModal,
      paidAmount: newPaid,
      status,
      settledAt: status === 'settled' ? new Date().toISOString() : undefined,
    }
    const res = await fetch('/api/family/finance/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (res.ok) {
      setDebts(prev => prev.map(d => d.id === updated.id ? updated : d))
      setSettleModal(null)
      setSettleAmount('')
    } else {
      setError('Cập nhật thất bại')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryCard
          label="Tôi đang nợ"
          value={formatVND(totalIOwe)}
          color="#ef4444"
          count={iOwe.filter(d => d.status !== 'settled').length}
        />
        <SummaryCard
          label="Người ta nợ tôi"
          value={formatVND(totalTheyOwe)}
          color="#3b82f6"
          count={theyOwe.filter(d => d.status !== 'settled').length}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          style={{
            padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border)',
            background: showForm ? 'var(--ink)' : 'var(--surface2)',
            color: showForm ? '#fff' : 'var(--ink)', fontSize: 13, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Đóng' : '+ Thêm công nợ'}
        </button>

        {(['all', 'active', 'settled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: filter === f ? 'var(--ink)' : 'var(--surface2)',
            color: filter === f ? '#fff' : 'var(--ink2)',
          }}>
            {f === 'all' ? 'Tất cả' : f === 'active' ? 'Còn nợ' : 'Đã xong'}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, marginBottom: 20,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10,
        }}>
          <div>
            <Label>Loại</Label>
            <select
              value={form.type ?? 'owe'}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as DebtType }))}
              style={selectStyle}
            >
              <option value="owe">Tôi nợ người khác</option>
              <option value="lend">Người khác nợ tôi</option>
            </select>
          </div>

          <div>
            <Label>Người {form.type === 'owe' ? 'cho mình nợ' : 'đang nợ mình'}</Label>
            <input
              placeholder="Tên người"
              value={form.person ?? ''}
              onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <Label>Số tiền</Label>
            <input
              type="number"
              placeholder="0"
              value={form.amount ?? ''}
              onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              style={inputStyle}
            />
          </div>

          <div>
            <Label>Tiền tệ</Label>
            <select
              value={form.currency ?? 'JPY'}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value as FamilyDebt['currency'] }))}
              style={selectStyle}
            >
              <option value="JPY">JPY</option>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div>
            <Label>Ngày hẹn</Label>
            <input
              type="date"
              value={form.dueDate ?? ''}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <Label>Mô tả</Label>
            <input
              placeholder="(tuỳ chọn)"
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button onClick={handleSave} disabled={loading} style={btnPrimary}>
              {loading ? '...' : 'Lưu'}
            </button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12, gridColumn: '1/-1' }}>{error}</p>}
        </div>
      )}

      {/* Tôi nợ */}
      <DebtSection
        title="Tôi đang nợ"
        color="#ef4444"
        icon="↑"
        debts={filtered(iOwe)}
        rates={rates}
        onSettle={d => { setSettleModal(d); setSettleAmount('') }}
        onDelete={handleDelete}
      />

      {/* Người ta nợ */}
      <DebtSection
        title="Người ta nợ tôi"
        color="#3b82f6"
        icon="↓"
        debts={filtered(theyOwe)}
        rates={rates}
        onSettle={d => { setSettleModal(d); setSettleAmount('') }}
        onDelete={handleDelete}
      />

      {debts.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink3)', padding: '40px 0', fontSize: 14 }}>
          Chưa có công nợ nào. Tốt lắm!
        </div>
      )}

      {/* Settle modal */}
      {settleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            width: 320, border: '1px solid var(--border)',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>
              {settleModal.type === 'owe' ? 'Ghi nhận đã trả' : 'Ghi nhận đã nhận'}
            </h3>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}>
              {settleModal.type === 'owe' ? 'Nợ' : 'Cho'} <strong>{settleModal.person}</strong>:&nbsp;
              {settleModal.currency === 'JPY' ? formatJPY(settleModal.amount) : formatVND(settleModal.amount)}
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink3)' }}>
              Đã {settleModal.type === 'owe' ? 'trả' : 'nhận'}: {settleModal.currency === 'JPY' ? formatJPY(settleModal.paidAmount) : formatVND(settleModal.paidAmount)}
              &nbsp;· Còn lại: {settleModal.currency === 'JPY'
                ? formatJPY(settleModal.amount - settleModal.paidAmount)
                : formatVND(settleModal.amount - settleModal.paidAmount)}
            </p>
            <Label>Số tiền lần này ({settleModal.currency})</Label>
            <input
              type="number"
              value={settleAmount}
              onChange={e => setSettleAmount(e.target.value)}
              autoFocus
              style={{ ...inputStyle, marginBottom: 14 }}
              placeholder={String(settleModal.amount - settleModal.paidAmount)}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setSettleModal(null); setError('') }} style={btnSecondary}>Hủy</button>
              <button onClick={handleSettle} disabled={loading} style={btnPrimary}>
                {loading ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, count }: { label: string; value: string; color: string; count: number }) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 16px', minWidth: 160,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 4 }}>{label} · {count} khoản</div>
      <div style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

function DebtSection({
  title, color, icon, debts, rates, onSettle, onDelete,
}: {
  title: string
  color: string
  icon: string
  debts: FamilyDebt[]
  rates: ForexRates
  onSettle: (d: FamilyDebt) => void
  onDelete: (id: string) => void
}) {
  if (debts.length === 0) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {icon} {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {debts.map(d => (
          <DebtCard key={d.id} debt={d} rates={rates} onSettle={onSettle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function DebtCard({
  debt, rates, onSettle, onDelete,
}: {
  debt: FamilyDebt
  rates: ForexRates
  onSettle: (d: FamilyDebt) => void
  onDelete: (id: string) => void
}) {
  const remaining = debt.amount - debt.paidAmount
  const pct = debt.amount > 0 ? Math.min(100, (debt.paidAmount / debt.amount) * 100) : 0

  const fmtAmt = (n: number) =>
    debt.currency === 'JPY' ? formatJPY(n) :
    debt.currency === 'VND' ? formatVND(n) :
    `$${n.toLocaleString()}`

  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 14px',
      opacity: debt.status === 'settled' ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{debt.person}</span>
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: STATUS_COLOR[debt.status] + '22',
              color: STATUS_COLOR[debt.status], fontWeight: 500,
            }}>
              {STATUS_LABEL[debt.status]}
            </span>
            {debt.dueDate && (
              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Hạn: {debt.dueDate}</span>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {fmtAmt(debt.amount)}
            <span style={{ fontWeight: 400, color: 'var(--ink3)', fontSize: 12 }}>
              {' '}· {formatVND(toVND(debt.amount, debt.currency, rates))}
            </span>
          </div>

          {debt.description && (
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{debt.description}</div>
          )}

          {debt.paidAmount > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)', marginBottom: 3 }}>
                <span>Đã {debt.type === 'owe' ? 'trả' : 'nhận'}: {fmtAmt(debt.paidAmount)}</span>
                <span>Còn: {fmtAmt(remaining)}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#22c55e', borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {debt.status !== 'settled' && (
            <button onClick={() => onSettle(debt)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none',
              background: '#3b82f6', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}>
              {debt.type === 'owe' ? 'Trả' : 'Nhận'}
            </button>
          )}
          <button onClick={() => onDelete(debt.id)} style={{
            padding: '5px 8px', borderRadius: 20, border: '1px solid var(--border)',
            background: 'none', color: 'var(--ink3)', fontSize: 12, cursor: 'pointer',
          }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Style helpers ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 13, boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = { ...inputStyle }

const btnPrimary: React.CSSProperties = {
  padding: '7px 16px', borderRadius: 20, border: 'none',
  background: 'var(--ink)', color: '#fff', fontSize: 13,
  cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
}

const btnSecondary: React.CSSProperties = {
  padding: '7px 16px', borderRadius: 20,
  border: '1px solid var(--border)', background: 'var(--surface2)',
  color: 'var(--ink)', fontSize: 13, cursor: 'pointer',
}
