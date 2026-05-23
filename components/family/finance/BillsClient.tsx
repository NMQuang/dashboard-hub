'use client'

import { useState } from 'react'
import type { FamilyBill, FamilyBillTemplate } from '@/types/family'
import { BILL_PRESETS, BILL_PRESETS_JP, BILL_PRESETS_VN, type BillPreset } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { formatJPY, formatVND, toVND } from '@/services/familyFinance'

interface Props {
  initialBills: FamilyBill[]
  month: string
  rates: ForexRates
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#22c55e',
}

const empty = (month: string, preset?: BillPreset): Partial<FamilyBill> => ({
  month,
  country: preset?.country ?? 'JP',
  name: preset?.name ?? '電気',
  category: preset?.category ?? 'utilities',
  currency: preset?.currency ?? 'JPY',
  status: 'pending',
})

// Tính tháng sau từ YYYY-MM
function nextMonthOf(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, '0')}`
}

export default function BillsClient({ initialBills, month, rates }: Props) {
  const [bills, setBills] = useState<FamilyBill[]>(initialBills)
  const [form, setForm] = useState<Partial<FamilyBill>>(empty(month))
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payModal, setPayModal] = useState<FamilyBill | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [error, setError] = useState('')

  // Auto-generate
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<{ created: number; skipped: number; month: string } | null>(null)

  // Template config modal
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<FamilyBillTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const jpBills = bills.filter(b => b.country === 'JP')
  const vnBills = bills.filter(b => b.country === 'VN')

  const totalJpPending = jpBills.filter(b => b.status === 'pending')
    .reduce((s, b) => s + toVND(b.estimatedAmount ?? 0, b.currency, rates), 0)
  const totalVnPending = vnBills.filter(b => b.status === 'pending')
    .reduce((s, b) => s + toVND(b.estimatedAmount ?? 0, b.currency, rates), 0)
  const totalPaid = bills.filter(b => b.status === 'paid')
    .reduce((s, b) => s + toVND(b.actualAmount ?? b.estimatedAmount ?? 0, b.currency, rates), 0)

  function openForm(preset?: BillPreset) {
    setForm(empty(month, preset))
    setShowForm(true)
    setError('')
  }

  async function handleSave() {
    if (!form.name) { setError('Nhập tên hóa đơn'); return }
    setLoading(true); setError('')
    const bill: FamilyBill = {
      id: `bill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      month,
      country: form.country ?? 'JP',
      name: form.name!,
      category: form.category ?? 'utilities',
      estimatedAmount: form.estimatedAmount,
      currency: form.currency ?? 'JPY',
      dueDate: form.dueDate,
      status: 'pending',
      note: form.note,
      createdAt: new Date().toISOString(),
    }
    const res = await fetch('/api/family/finance/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bill),
    })
    if (res.ok) {
      setBills(prev => [...prev, bill])
      setForm(empty(month))
      setShowForm(false)
    } else {
      setError('Lưu thất bại')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/family/finance/bills?id=${id}`, { method: 'DELETE' })
    setBills(prev => prev.filter(b => b.id !== id))
  }

  async function handleMarkPaid() {
    if (!payModal) return
    const amount = Number(payAmount)
    if (!amount || isNaN(amount)) { setError('Nhập số tiền thực tế'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/family/finance/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'mark-paid', bill: payModal, actualAmount: amount }),
    })
    if (res.ok) {
      const { bill } = await res.json()
      setBills(prev => prev.map(b => b.id === bill.id ? bill : b))
      setPayModal(null)
      setPayAmount('')
    } else {
      setError('Cập nhật thất bại')
    }
    setLoading(false)
  }

  // Auto-generate bills cho tháng sau
  async function handleGenerate() {
    const target = nextMonthOf(month)
    setGenerating(true); setGenResult(null)
    try {
      const secret = process.env.NEXT_PUBLIC_CRON_SECRET ?? ''
      const res = await fetch(
        `/api/cron/generate-bills?month=${target}${secret ? `&secret=${secret}` : ''}`,
      )
      const data = await res.json()
      setGenResult(data)
      // Nếu đang xem tháng đó thì refresh (ít xảy ra vì target = tháng sau)
    } catch {
      setGenResult({ created: 0, skipped: 0, month: target })
    }
    setGenerating(false)
  }

  // Load templates
  async function openTemplates() {
    setShowTemplates(true)
    if (templates.length > 0) return
    setTemplatesLoading(true)
    const res = await fetch('/api/family/finance/bill-templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setTemplatesLoading(false)
  }

  async function toggleTemplate(id: string, enabled: boolean) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled } : t))
    await fetch('/api/family/finance/bill-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    })
  }

  async function updateTemplateAmount(id: string, estimatedAmount: number | null) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, estimatedAmount: estimatedAmount ?? undefined } : t))
    await fetch('/api/family/finance/bill-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estimatedAmount }),
    })
  }

  // When country changes in form → update currency accordingly
  function handleCountryChange(country: 'JP' | 'VN') {
    setForm(f => ({
      ...f,
      country,
      currency: country === 'JP' ? 'JPY' : 'VND',
      name: country === 'JP' ? '電気' : 'Tiền trả VISA',
      category: country === 'JP' ? 'utilities' : 'misc',
    }))
  }

  const currentPresets = form.country === 'VN' ? BILL_PRESETS_VN : BILL_PRESETS_JP

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryCard label="🇯🇵 Nhật chờ trả" value={formatVND(totalJpPending)}
          sub={`${jpBills.filter(b => b.status === 'pending').length} hóa đơn`} color="#f59e0b" />
        <SummaryCard label="🇻🇳 VN chờ trả" value={formatVND(totalVnPending)}
          sub={`${vnBills.filter(b => b.status === 'pending').length} hóa đơn`} color="#ef4444" />
        <SummaryCard label="Đã thanh toán" value={formatVND(totalPaid)}
          sub={`${bills.filter(b => b.status === 'paid').length} hóa đơn`} color="#22c55e" />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => showForm ? setShowForm(false) : openForm()}
          style={{
            padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border)',
            background: showForm ? 'var(--ink)' : 'var(--surface2)',
            color: showForm ? '#fff' : 'var(--ink)', fontSize: 13, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Đóng' : '+ Thêm hóa đơn'}
        </button>

        {/* Generate next month */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          title={`Tạo tự động bills cho tháng ${nextMonthOf(month)}`}
          style={{
            padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--ink2)', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          {generating ? '...' : '⟳'} Tạo tháng {nextMonthOf(month)}
        </button>

        {/* Config templates */}
        <button
          onClick={openTemplates}
          style={{
            padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--ink2)', fontSize: 13, cursor: 'pointer',
          }}
        >
          ⚙ Cấu hình tự động
        </button>
      </div>

      {/* Generate result toast */}
      {genResult && (
        <div style={{
          background: genResult.created > 0 ? '#22c55e18' : 'var(--surface2)',
          border: `1px solid ${genResult.created > 0 ? '#22c55e' : 'var(--border)'}`,
          borderRadius: 10, padding: '8px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <span>
            Tháng <strong>{genResult.month}</strong>: tạo mới <strong>{genResult.created}</strong> bill
            {genResult.skipped > 0 && `, bỏ qua ${genResult.skipped} (đã tồn tại)`}
          </span>
          <button onClick={() => setGenResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 14 }}>
            ✕
          </button>
        </div>
      )}

      {/* Quick presets row */}
      {!showForm && (
        <div style={{ marginBottom: 20 }}>
          <PresetRow label="🇯🇵 Nhật" presets={BILL_PRESETS_JP} onPick={openForm} />
          <PresetRow label="🇻🇳 Việt Nam" presets={BILL_PRESETS_VN} onPick={openForm} />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, marginBottom: 20,
        }}>
          {/* Country toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['JP', 'VN'] as const).map(c => (
              <button key={c} onClick={() => handleCountryChange(c)} style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)',
                background: form.country === c ? 'var(--ink)' : 'var(--surface2)',
                color: form.country === c ? '#fff' : 'var(--ink2)',
                fontSize: 13, cursor: 'pointer', fontWeight: form.country === c ? 500 : 400,
              }}>
                {c === 'JP' ? '🇯🇵 Nhật' : '🇻🇳 Việt Nam'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            <div>
              <Label>Loại hóa đơn</Label>
              <select
                value={form.name ?? ''}
                onChange={e => {
                  const p = BILL_PRESETS.find(x => x.name === e.target.value)
                  setForm(f => ({
                    ...f,
                    name: e.target.value,
                    category: p?.category ?? 'misc',
                    currency: p?.currency ?? f.currency,
                  }))
                }}
                style={selectStyle}
              >
                {currentPresets.map(p => (
                  <option key={p.name} value={p.name}>{p.icon} {p.name}</option>
                ))}
                <option value="__custom__">Tùy chỉnh...</option>
              </select>
              {form.name === '__custom__' && (
                <input
                  placeholder="Tên hóa đơn"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              )}
            </div>

            <div>
              <Label>Dự kiến ({form.currency})</Label>
              <input
                type="number" placeholder="0"
                value={form.estimatedAmount ?? ''}
                onChange={e => setForm(f => ({ ...f, estimatedAmount: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>

            <div>
              <Label>Ngày đến hạn</Label>
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <Label>Ghi chú</Label>
              <input
                placeholder="(tuỳ chọn)"
                value={form.note ?? ''}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                {loading ? '...' : 'Lưu'}
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {/* JP bills */}
      <BillGroup
        flag="🇯🇵" label="Nhật Bản" bills={jpBills} rates={rates}
        onPay={b => { setPayModal(b); setPayAmount(String(b.estimatedAmount ?? '')) }}
        onDelete={handleDelete}
      />

      {/* VN bills */}
      <BillGroup
        flag="🇻🇳" label="Việt Nam" bills={vnBills} rates={rates}
        onPay={b => { setPayModal(b); setPayAmount(String(b.estimatedAmount ?? '')) }}
        onDelete={handleDelete}
      />

      {bills.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink3)', padding: '40px 0', fontSize: 14 }}>
          Chưa có hóa đơn nào tháng này.<br />
          <span style={{ fontSize: 12, opacity: 0.7 }}>Click nhanh vào preset bên trên để thêm.</span>
        </div>
      )}

      {/* Templates config modal */}
      {showTemplates && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 998,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            width: 480, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>⚙ Cấu hình bill tự động</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink3)' }}>
                  Ngày 25 hàng tháng → tự động tạo bills tháng sau từ danh sách bên dưới.
                  <br />Để trống "Dự kiến" → dùng số thực tế tháng trước.
                </p>
              </div>
              <button onClick={() => setShowTemplates(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink3)' }}>
                ✕
              </button>
            </div>

            {templatesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink3)', fontSize: 13 }}>
                Đang tải...
              </div>
            ) : (
              <>
                {(['JP', 'VN'] as const).map(country => {
                  const group = templates.filter(t => t.country === country)
                  if (!group.length) return null
                  return (
                    <div key={country} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 8,
                        textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {country === 'JP' ? '🇯🇵 Nhật Bản' : '🇻🇳 Việt Nam'}
                      </div>
                      {group.map(tpl => {
                        const preset = BILL_PRESETS.find(p => p.name === tpl.name)
                        return (
                          <div key={tpl.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                            background: tpl.enabled ? 'var(--surface2)' : 'transparent',
                            border: '1px solid var(--border)',
                            opacity: tpl.enabled ? 1 : 0.45,
                          }}>
                            <span style={{ fontSize: 17, width: 24, textAlign: 'center' }}>
                              {preset?.icon ?? '📋'}
                            </span>
                            <span style={{ flex: 1, fontSize: 13 }}>{tpl.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                placeholder={`Dự kiến (${tpl.currency})`}
                                value={tpl.estimatedAmount ?? ''}
                                onChange={e => updateTemplateAmount(tpl.id, e.target.value ? Number(e.target.value) : null)}
                                style={{
                                  width: 110, padding: '4px 8px', borderRadius: 6, fontSize: 12,
                                  border: '1px solid var(--border)', background: 'var(--surface)',
                                  color: 'var(--ink)',
                                }}
                              />
                              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{tpl.currency}</span>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={tpl.enabled}
                                onChange={e => toggleTemplate(tpl.id, e.target.checked)}
                                style={{ width: 15, height: 15, cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                                {tpl.enabled ? 'Bật' : 'Tắt'}
                              </span>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            width: 320, border: '1px solid var(--border)',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>
              {payModal.country === 'JP' ? '🇯🇵' : '🇻🇳'} Đánh dấu đã trả — {payModal.name}
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink3)' }}>
              Hóa đơn sẽ tự động được thêm vào tab Expenses.
            </p>
            <Label>Số tiền thực tế ({payModal.currency})</Label>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              autoFocus
              style={{ ...inputStyle, marginBottom: 14 }}
              placeholder={String(payModal.estimatedAmount ?? 0)}
            />
            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setPayModal(null); setError('') }} style={btnSecondary}>Hủy</button>
              <button onClick={handleMarkPaid} disabled={loading} style={btnPrimary}>
                {loading ? '...' : 'Xác nhận đã trả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function PresetRow({ label, presets, onPick }: {
  label: string
  presets: BillPreset[]
  onPick: (p: BillPreset) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: 'var(--ink3)', minWidth: 70, fontWeight: 500 }}>{label}</span>
      {presets.map(p => (
        <button
          key={p.name}
          onClick={() => onPick(p)}
          title={`Thêm nhanh: ${p.name}`}
          style={{
            padding: '5px 10px', borderRadius: 20, border: '1px solid var(--border)',
            background: 'var(--surface2)', fontSize: 12, cursor: 'pointer', color: 'var(--ink2)',
          }}
        >
          {p.icon} {p.name}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string
}) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', minWidth: 150,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 3 }}>{label} · {sub}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

function BillGroup({ flag, label, bills, rates, onPay, onDelete }: {
  flag: string
  label: string
  bills: FamilyBill[]
  rates: ForexRates
  onPay: (b: FamilyBill) => void
  onDelete: (id: string) => void
}) {
  if (bills.length === 0) return null
  const pending = bills.filter(b => b.status === 'pending')
  const paid = bills.filter(b => b.status === 'paid')
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {flag} {label}
      </div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 5 }}>
            Chờ thanh toán ({pending.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map(b => (
              <BillCard key={b.id} bill={b} rates={rates}
                onPay={() => onPay(b)} onDelete={() => onDelete(b.id)} />
            ))}
          </div>
        </div>
      )}
      {paid.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 5 }}>
            Đã thanh toán ({paid.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paid.map(b => (
              <BillCard key={b.id} bill={b} rates={rates}
                onDelete={() => onDelete(b.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BillCard({ bill, rates, onPay, onDelete }: {
  bill: FamilyBill
  rates: ForexRates
  onPay?: () => void
  onDelete: () => void
}) {
  const preset = BILL_PRESETS.find(p => p.name === bill.name)
  const icon = preset?.icon ?? '📋'
  const amount = bill.status === 'paid'
    ? (bill.actualAmount ?? bill.estimatedAmount ?? 0)
    : (bill.estimatedAmount ?? 0)

  const fmtAmt = bill.currency === 'JPY' ? formatJPY(amount) : formatVND(amount)
  const fmtVnd = formatVND(toVND(amount, bill.currency, rates))

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '9px 12px',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{bill.name}</span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 500,
            background: STATUS_COLOR[bill.status] + '22',
            color: STATUS_COLOR[bill.status],
          }}>
            {bill.status === 'paid' ? 'Đã trả' : 'Chờ trả'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>
          {fmtAmt}
          {bill.currency === 'JPY' && <span style={{ opacity: 0.7 }}> · {fmtVnd}</span>}
          {bill.dueDate && ` · Hạn: ${bill.dueDate}`}
          {bill.note && ` · ${bill.note}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {bill.status === 'pending' && onPay && (
          <button onClick={onPay} style={{
            padding: '4px 11px', borderRadius: 20, border: 'none',
            background: '#22c55e', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500,
          }}>
            Đã trả
          </button>
        )}
        <button onClick={onDelete} style={{
          padding: '4px 8px', borderRadius: 20, border: '1px solid var(--border)',
          background: 'none', color: 'var(--ink3)', fontSize: 12, cursor: 'pointer',
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────

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
