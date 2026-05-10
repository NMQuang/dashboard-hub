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

const ASSET_SUGGESTIONS: Record<InvestmentType, string[]> = {
  gold: ['SJC', 'PNJ', 'Bảo Tín Minh Châu', 'Nhẫn tròn'],
  crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'TON'],
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

  const goldInvestments = investments.filter(i => i.type === 'gold')
  const cryptoInvestments = investments.filter(i => i.type === 'crypto')

  function totalValue(items: FamilyInvestment[]): number {
    return items.reduce((s, inv) => {
      const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
      return s + toVND(price * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
    }, 0)
  }

  function totalCost(items: FamilyInvestment[]): number {
    return items.reduce((s, inv) => {
      if (!inv.averageBuyPrice) return s
      return s + toVND(inv.averageBuyPrice * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
    }, 0)
  }

  const portfolioValue = totalValue(investments)
  const portfolioCost = totalCost(investments)
  const portfolioPnL = portfolioValue - portfolioCost

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
      averageBuyPrice: avg,
      currentPrice: cur,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Portfolio summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <PortfolioCard label="Tổng danh mục" value={formatVND(portfolioValue)} accent="#6366f1" />
        <PortfolioCard label="Giá vốn" value={formatVND(portfolioCost)} accent="var(--ink2)" />
        <PortfolioCard
          label="Lãi/Lỗ"
          value={(portfolioPnL >= 0 ? '+' : '') + formatVND(portfolioPnL)}
          accent={portfolioPnL >= 0 ? '#10b981' : '#ef4444'}
        />
        <PortfolioCard label="Vàng" value={formatVND(totalValue(goldInvestments))} accent="#d97706" />
        <PortfolioCard label="Crypto" value={formatVND(totalValue(cryptoInvestments))} accent="#3b82f6" />
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
              {(['gold', 'crypto'] as InvestmentType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: type === t ? 'var(--ink)' : 'var(--border)',
                    background: type === t ? 'var(--ink)' : 'transparent',
                    color: type === t ? '#fff' : 'var(--ink2)',
                  }}
                >
                  {t === 'gold' ? '🥇 Vàng' : '🪙 Crypto'}
                </button>
              ))}
            </div>

            {/* Asset suggestions */}
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

            {/* Asset name */}
            <input
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              placeholder={type === 'gold' ? 'Tên vàng (SJC, PNJ...)' : 'Symbol (BTC, ETH...)'}
              required
              style={inputStyle}
            />

            {/* Currency */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['VND', 'JPY', 'USD'] as InvCurrency[]).map(c => (
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
              {saving ? 'Đang lưu…' : '+ Thêm tài sản'}
            </button>
          </form>
        </div>
      )}

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
          <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>Thêm vàng hoặc crypto để theo dõi danh mục đầu tư</div>
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

function PortfolioCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>{value}</div>
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
              const cur = inv.currency as 'VND' | 'JPY' | 'USD'
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
                  <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--ink2)' }}>
                    {inv.quantity}
                  </td>
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
