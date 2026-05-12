'use client'

import { useState } from 'react'
import type { FamilyInvestment, InvestmentType } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { toVND, formatVND, formatJPY } from '@/services/familyFinance'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

interface InvestmentClientProps {
  initialInvestments: FamilyInvestment[]
  rates: ForexRates
}

type InvCurrency = 'VND' | 'JPY' | 'USD'

const TYPE_META: Record<InvestmentType, { label: string; icon: string }> = {
  gold:    { label: 'Vàng',      icon: '🥇' },
  crypto:  { label: 'Crypto',    icon: '🪙' },
  savings: { label: 'Tiết kiệm', icon: '🏦' },
}

const ASSET_SUGGESTIONS: Record<InvestmentType, string[]> = {
  gold:    ['SJC', 'PNJ', 'Bảo Tín Minh Châu', 'Nhẫn tròn'],
  crypto:  ['BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'TON'],
  savings: ['VCB', 'MB Bank', 'Techcombank', 'BIDV', 'Tiết kiệm JPY'],
}

function invValue(inv: FamilyInvestment, rates: ForexRates): number {
  if (inv.type === 'savings') return toVND(inv.quantity, inv.currency as InvCurrency, rates)
  const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
  return toVND(price * inv.quantity, inv.currency as InvCurrency, rates)
}

function rawAmount(inv: FamilyInvestment): number {
  if (inv.type === 'savings') return inv.quantity
  const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
  return price * inv.quantity
}

export default function InvestmentClient({ initialInvestments, rates }: InvestmentClientProps) {
  const [investments, setInvestments] = useState(initialInvestments)
  const [type, setType] = useState<InvestmentType>('gold')
  const [assetName, setAssetName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [currency, setCurrency] = useState<InvCurrency>('VND')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const goldInvestments    = investments.filter(i => i.type === 'gold')
  const cryptoInvestments  = investments.filter(i => i.type === 'crypto')
  const savingsInvestments = investments.filter(i => i.type === 'savings')

  const portfolioValue = investments.reduce((s, i) => s + invValue(i, rates), 0)
  const portfolioCost  = investments.filter(i => i.type !== 'savings').reduce((s, inv) => {
    if (!inv.averageBuyPrice) return s
    return s + toVND(inv.averageBuyPrice * inv.quantity, inv.currency as InvCurrency, rates)
  }, 0)
  const portfolioPnL = investments.filter(i => i.type !== 'savings').reduce((s, inv) => {
    const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
    const value = toVND(price * inv.quantity, inv.currency as InvCurrency, rates)
    const cost  = inv.averageBuyPrice
      ? toVND(inv.averageBuyPrice * inv.quantity, inv.currency as InvCurrency, rates)
      : value
    return s + (value - cost)
  }, 0)

  const savingsVND = savingsInvestments.filter(i => i.currency === 'VND').reduce((s, i) => s + i.quantity, 0)
  const savingsJPY = savingsInvestments.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.quantity, 0)

  const portRawVND = investments.filter(i => i.currency === 'VND').reduce((s, i) => s + rawAmount(i), 0)
  const portRawJPY = investments.filter(i => i.currency === 'JPY').reduce((s, i) => s + rawAmount(i), 0)
  const portRawUSD = investments.filter(i => i.currency === 'USD').reduce((s, i) => s + rawAmount(i), 0)

  function handleTypeChange(t: InvestmentType) {
    setType(t)
    setAssetName('')
    setCurrency(t === 'savings' ? 'VND' : t === 'gold' ? 'VND' : 'USD')
  }

  async function handleAdd(evt: React.FormEvent) {
    evt.preventDefault()
    const qty = parseFloat(quantity.replace(/,/g, ''))
    const avg = avgBuyPrice ? parseFloat(avgBuyPrice.replace(/,/g, '')) : undefined
    const cur = currentPrice ? parseFloat(currentPrice.replace(/,/g, '')) : undefined
    if (!qty || !assetName.trim()) return
    setSaving(true)
    setError(null)

    const entry: FamilyInvestment = {
      id: genId(),
      type,
      assetName: assetName.trim(),
      quantity: qty,
      averageBuyPrice: type === 'savings' ? undefined : avg,
      currentPrice:    type === 'savings' ? undefined : cur,
      currency,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/family/finance/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { investment: saved } = (await res.json()) as { investment: FamilyInvestment }
      setInvestments(prev => [saved, ...prev])
      setAssetName('')
      setQuantity('')
      setAvgBuyPrice('')
      setCurrentPrice('')
      setNote('')
      setShowForm(false)
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
      await fetch(`/api/family/finance/investments?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setInvestments(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const isSavings = type === 'savings'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Portfolio summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <PortfolioTotalCard vnd={portRawVND} jpy={portRawJPY} usd={portRawUSD} />
        <PortfolioCard label="Giá vốn (đầu tư)" value={formatVND(portfolioCost)} accent="var(--ink2)" />
        <PortfolioCard
          label="Lãi/Lỗ"
          value={(portfolioPnL >= 0 ? '+' : '') + formatVND(portfolioPnL)}
          accent={portfolioPnL >= 0 ? '#10b981' : '#ef4444'}
        />
        <PortfolioCard label="🥇 Vàng"  value={formatVND(goldInvestments.reduce((s, i)   => s + invValue(i, rates), 0))} accent="#d97706" />
        <PortfolioCard label="🪙 Crypto" value={formatVND(cryptoInvestments.reduce((s, i)  => s + invValue(i, rates), 0))} accent="#3b82f6" />
        <SavingsCard savingsVND={savingsVND} savingsJPY={savingsJPY} />
      </div>

      {/* Add button */}
      <div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: showForm ? 'var(--surface2)' : 'var(--ink)', color: showForm ? 'var(--ink)' : '#fff',
            border: '1px solid var(--border)', fontWeight: 500,
          }}
        >
          {showForm ? '✕ Đóng form' : '+ Thêm tài sản'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', maxWidth: 600 }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Type */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['gold', 'crypto', 'savings'] as InvestmentType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: type === t ? 'var(--ink)' : 'var(--border)',
                    background: type === t ? 'var(--ink)' : 'transparent',
                    color: type === t ? '#fff' : 'var(--ink2)',
                  }}
                >
                  {TYPE_META[t].icon} {TYPE_META[t].label}
                </button>
              ))}
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ASSET_SUGGESTIONS[type].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAssetName(s)}
                  style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11.5, cursor: 'pointer',
                    border: '1px solid var(--border)', background: assetName === s ? 'var(--surface2)' : 'transparent',
                    color: 'var(--ink2)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Name */}
            <input
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              placeholder={
                type === 'gold'    ? 'Tên vàng (SJC, PNJ...)' :
                type === 'crypto'  ? 'Symbol (BTC, ETH...)' :
                'Tên tài khoản / ngân hàng'
              }
              required
              style={inputStyle}
            />

            {/* Currency */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(isSavings ? ['VND', 'JPY'] as InvCurrency[] : ['VND', 'JPY', 'USD'] as InvCurrency[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: currency === c ? '#3b82f6' : 'var(--border)',
                    background: currency === c ? '#EFF6FF' : 'transparent',
                    color: currency === c ? '#1d4ed8' : 'var(--ink3)',
                    fontFamily: 'monospace',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {isSavings ? (
              /* Savings: only balance */
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Số dư *</div>
                <input
                  type="text"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder={currency === 'VND' ? '50,000,000' : '500,000'}
                  required
                  style={inputStyle}
                />
              </div>
            ) : (
              /* Gold / Crypto: qty + buy price + current price */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Số lượng *</div>
                  <input
                    type="text"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="1.5"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Giá vốn</div>
                  <input
                    type="text"
                    value={avgBuyPrice}
                    onChange={e => setAvgBuyPrice(e.target.value)}
                    placeholder={currency === 'VND' ? '88,000,000' : currency === 'JPY' ? '150,000' : '60,000'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Giá hiện tại</div>
                  <input
                    type="text"
                    value={currentPrice}
                    onChange={e => setCurrentPrice(e.target.value)}
                    placeholder={currency === 'VND' ? '95,000,000' : '...'}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú"
              style={inputStyle}
            />

            {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}

            <button
              type="submit"
              disabled={saving || !assetName || !quantity}
              style={{
                padding: '9px', borderRadius: 8, background: 'var(--ink)', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: saving || !assetName || !quantity ? 0.4 : 1,
              }}
            >
              {saving ? 'Đang lưu…' : '+ Thêm'}
            </button>
          </form>
        </div>
      )}

      {/* Savings section */}
      <SavingsSection items={savingsInvestments} onDelete={handleDelete} deletingId={deletingId} />

      {/* Gold portfolio */}
      <InvestmentSection
        title="🥇 Vàng"
        items={goldInvestments}
        rates={rates}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {/* Crypto portfolio */}
      <InvestmentSection
        title="🪙 Crypto"
        items={cryptoInvestments}
        rates={rates}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {investments.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, color: 'var(--ink2)', marginBottom: 4 }}>Chưa có tài sản nào</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>Thêm vàng, crypto hoặc tiết kiệm để theo dõi danh mục</div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
}

function PortfolioTotalCard({ vnd, jpy, usd }: { vnd: number; jpy: number; usd: number }) {
  const hasAny = vnd > 0 || jpy > 0 || usd > 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>Tổng danh mục</div>
      {!hasAny && <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink3)' }}>—</div>}
      {vnd > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: '#6366f1' }}>{formatVND(vnd)}</span>
        </div>
      )}
      {jpy > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: '#6366f1' }}>¥{jpy.toLocaleString('ja-JP')}</span>
        </div>
      )}
      {usd > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>USD</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: '#6366f1' }}>${usd.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

function PortfolioCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>{value}</div>
    </div>
  )
}

function SavingsCard({ savingsVND, savingsJPY }: { savingsVND: number; savingsJPY: number }) {
  const hasAny = savingsVND > 0 || savingsJPY > 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>🏦 Tiết kiệm</div>
      {!hasAny && <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink3)' }}>—</div>}
      {savingsVND > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: '#0ea5e9' }}>{formatVND(savingsVND)}</span>
        </div>
      )}
      {savingsJPY > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: '#0ea5e9' }}>¥{savingsJPY.toLocaleString('ja-JP')}</span>
        </div>
      )}
    </div>
  )
}

function SavingsSection({ items, onDelete, deletingId }: {
  items: FamilyInvestment[]
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  if (items.length === 0) return null

  const totalVND = items.filter(i => i.currency === 'VND').reduce((s, i) => s + i.quantity, 0)
  const totalJPY = items.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.quantity, 0)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>🏦 Tiết kiệm</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {totalVND > 0 && (
            <span className="font-mono" style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>{formatVND(totalVND)}</span>
          )}
          {totalJPY > 0 && (
            <span className="font-mono" style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>¥{totalJPY.toLocaleString('ja-JP')}</span>
          )}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Tên tài khoản', 'Tiền tệ', 'Số dư', 'Ghi chú', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(inv => (
              <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)' }}>{inv.assetName}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11.5, fontWeight: 600,
                    color: inv.currency === 'VND' ? '#16a34a' : '#0ea5e9',
                    background: inv.currency === 'VND' ? '#f0fdf4' : '#e0f2fe',
                    padding: '2px 7px', borderRadius: 99,
                  }}>
                    {inv.currency}
                  </span>
                </td>
                <td className="font-mono" style={{ padding: '10px 12px', fontWeight: 600, color: '#0ea5e9', fontSize: 14 }}>
                  {inv.currency === 'JPY'
                    ? `¥${inv.quantity.toLocaleString('ja-JP')}`
                    : formatVND(inv.quantity)}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink3)' }}>{inv.note ?? '—'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <button
                    onClick={() => onDelete(inv.id)}
                    disabled={deletingId === inv.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink3)', fontSize: 16, opacity: deletingId === inv.id ? 0.3 : 0.5,
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InvestmentSection({ title, items, rates, onDelete, deletingId }: {
  title: string
  items: FamilyInvestment[]
  rates: ForexRates
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  if (items.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
        {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Tài sản', 'Số lượng', 'Giá vốn', 'Giá hiện tại', 'Giá trị VND', 'Lãi/Lỗ', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(inv => {
              const cur = inv.currency as InvCurrency
              const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
              const valueVND = toVND(price * inv.quantity, cur, rates)
              const costVND = inv.averageBuyPrice
                ? toVND(inv.averageBuyPrice * inv.quantity, cur, rates)
                : null
              const pnl = costVND != null ? valueVND - costVND : null
              const pnlPct = costVND && costVND > 0 ? ((valueVND - costVND) / costVND * 100) : null

              function priceLabel(p: number): string {
                if (inv.currency === 'JPY') return formatJPY(p)
                if (inv.currency === 'USD') return `$${p.toLocaleString()}`
                return formatVND(p)
              }

              return (
                <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)' }}>
                    {inv.assetName}
                    {inv.note && <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 400 }}>{inv.note}</div>}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink2)' }}>{inv.quantity}</td>
                  <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink3)' }}>
                    {inv.averageBuyPrice ? priceLabel(inv.averageBuyPrice) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink2)' }}>
                    {inv.currentPrice ? priceLabel(inv.currentPrice) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {formatVND(valueVND)}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 12px', color: pnl != null && pnl >= 0 ? '#10b981' : '#ef4444' }}>
                    {pnl != null ? (
                      <>
                        {pnl >= 0 ? '+' : ''}{formatVND(pnl)}
                        {pnlPct != null && (
                          <span style={{ fontSize: 11, marginLeft: 4 }}>
                            ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                          </span>
                        )}
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <button
                      onClick={() => onDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink3)', fontSize: 16, opacity: deletingId === inv.id ? 0.3 : 0.5,
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
    </div>
  )
}
