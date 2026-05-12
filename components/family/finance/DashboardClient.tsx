'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { FamilyIncome, FamilyExpense, FamilyInvestment } from '@/types/family'
import { INCOME_SOURCE_LABELS, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { toVND, formatVND, formatJPY } from '@/services/familyFinance'

interface MonthlySummary {
  month: string
  incomeVND: number
  expensesVND: number
}

interface DashboardClientProps {
  incomeThisMonth: FamilyIncome[]
  expensesThisMonth: FamilyExpense[]
  investments: FamilyInvestment[]
  rates: ForexRates
  monthLabel: string
  recentMonths: MonthlySummary[]
}

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

export default function DashboardClient({
  incomeThisMonth,
  expensesThisMonth,
  investments,
  rates,
  monthLabel,
  recentMonths,
}: DashboardClientProps) {
  // ── Totals (converted for savings / chart) ──────────────────────────────
  const totalIncomeVND = incomeThisMonth.reduce(
    (sum, i) => sum + toVND(i.amount, i.currency, rates), 0,
  )
  const totalExpensesVND = expensesThisMonth.reduce(
    (sum, e) => sum + toVND(e.amount, e.currency, rates), 0,
  )
  const savingsVND = totalIncomeVND - totalExpensesVND

  // ── Raw totals by currency (no conversion) ───────────────────────────────
  const incomeRawVND = incomeThisMonth.filter(i => i.currency === 'VND').reduce((s, i) => s + i.amount, 0)
  const incomeRawJPY = incomeThisMonth.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.amount, 0)
  const expRawVND = expensesThisMonth.filter(e => e.currency === 'VND').reduce((s, e) => s + e.amount, 0)
  const expRawJPY = expensesThisMonth.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0)
  const savingsRawVND = incomeRawVND - expRawVND
  const savingsRawJPY = incomeRawJPY - expRawJPY

  const vnExpensesRawVND = expensesThisMonth.filter(e => e.country === 'VN').reduce((s, e) => s + e.amount, 0)
  const jpExpensesRawJPY = expensesThisMonth.filter(e => e.country === 'JP').reduce((s, e) => s + e.amount, 0)
  const vnExpensesVND = expensesThisMonth.filter(e => e.country === 'VN').reduce((sum, e) => sum + toVND(e.amount, e.currency, rates), 0)
  const jpExpensesVND = expensesThisMonth.filter(e => e.country === 'JP').reduce((sum, e) => sum + toVND(e.amount, e.currency, rates), 0)

  // ── Expense breakdown by category ────────────────────────────────────────
  const categoryMap: Partial<Record<FamilyExpense['category'], number>> = {}
  for (const e of expensesThisMonth) {
    const vnd = toVND(e.amount, e.currency, rates)
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + vnd
  }
  const pieData = Object.entries(categoryMap)
    .map(([cat, value]) => ({
      name: EXPENSE_CATEGORY_LABELS[cat as FamilyExpense['category']] ?? cat,
      value: Math.round(value),
    }))
    .sort((a, b) => b.value - a.value)

  // ── Income by source (native amounts) ───────────────────────────────────
  const sourceMap: Partial<Record<FamilyIncome['source'], { vnd: number; jpy: number }>> = {}
  for (const i of incomeThisMonth) {
    const entry = sourceMap[i.source] ?? { vnd: 0, jpy: 0 }
    if (i.currency === 'JPY') entry.jpy += i.amount
    else entry.vnd += i.amount
    sourceMap[i.source] = entry
  }

  // ── Investment portfolio ─────────────────────────────────────────────────
  const goldHoldings    = investments.filter(i => i.type === 'gold')
  const cryptoHoldings  = investments.filter(i => i.type === 'crypto')
  const savingsHoldings = investments.filter(i => i.type === 'savings')

  function invValueVND(inv: FamilyInvestment): number {
    if (inv.type === 'savings') return toVND(inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
    const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
    return toVND(price * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
  }

  function rawInvAmount(inv: FamilyInvestment): number {
    if (inv.type === 'savings') return inv.quantity
    const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
    return price * inv.quantity
  }

  const portRawVND = investments.filter(i => i.currency === 'VND').reduce((s, i) => s + rawInvAmount(i), 0)
  const portRawJPY = investments.filter(i => i.currency === 'JPY').reduce((s, i) => s + rawInvAmount(i), 0)
  const portRawUSD = investments.filter(i => i.currency === 'USD').reduce((s, i) => s + rawInvAmount(i), 0)

  // ── Monthly trend chart data ─────────────────────────────────────────────
  const chartData = recentMonths.map(m => ({
    name: m.month.slice(5), // MM
    'Thu nhập': Math.round(m.incomeVND / 1_000_000),
    'Chi tiêu': Math.round(m.expensesVND / 1_000_000),
  }))

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Summary cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <CurrencyCard
          label={`Thu nhập ${monthLabel}`}
          rawVND={incomeRawVND}
          rawJPY={incomeRawJPY}
          sub={`${incomeThisMonth.length} nguồn thu`}
          accent="#10b981"
        />
        <CurrencyCard
          label={`Chi tiêu ${monthLabel}`}
          rawVND={expRawVND}
          rawJPY={expRawJPY}
          sub={`${expensesThisMonth.length} khoản`}
          accent="#ef4444"
        />
        <SavingsCard
          label="Tiết kiệm tháng này"
          savingsVND={savingsRawVND}
          savingsJPY={savingsRawJPY}
          hasVND={incomeRawVND > 0 || expRawVND > 0}
          hasJPY={incomeRawJPY > 0 || expRawJPY > 0}
        />
        <InvestmentSummaryCard
          vnd={portRawVND}
          jpy={portRawJPY}
          usd={portRawUSD}
          count={investments.length}
        />
      </div>

      {/* VN vs JP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>Chi tiêu theo nơi</div>
          <CountryBar label="🇻🇳 Việt Nam" displayAmount={formatVND(vnExpensesRawVND)} valueVND={vnExpensesVND} totalVND={totalExpensesVND} />
          <CountryBar label="🇯🇵 Nhật Bản" displayAmount={`¥${jpExpensesRawJPY.toLocaleString('ja-JP')}`} valueVND={jpExpensesVND} totalVND={totalExpensesVND} />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>Thu nhập theo nguồn</div>
          {Object.entries(sourceMap).length === 0 ? (
            <EmptyNote text="Chưa có thu nhập tháng này" />
          ) : (
            Object.entries(sourceMap).map(([src, amounts]) => (
              <div key={src} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                  {INCOME_SOURCE_LABELS[src as FamilyIncome['source']] ?? src}
                </span>
                <div style={{ textAlign: 'right' }}>
                  {amounts.vnd > 0 && (
                    <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      {formatVND(amounts.vnd)}
                    </div>
                  )}
                  {amounts.jpy > 0 && (
                    <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      ¥{amounts.jpy.toLocaleString('ja-JP')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

        {/* Monthly trend bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
            Thu chi 6 tháng gần nhất (triệu ₫)
          </div>
          {chartData.length === 0 ? (
            <EmptyNote text="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${value}M₫`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="Thu nhập" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense category pie */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
            Chi tiêu theo danh mục
          </div>
          {pieData.length === 0 ? (
            <EmptyNote text="Chưa có chi tiêu" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={35}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value: string) => (
                    <span style={{ fontSize: 10, color: 'var(--ink2)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Investments summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>
          Danh mục đầu tư
        </div>
        {investments.length === 0 ? (
          <EmptyNote text="Chưa có tài sản. Thêm vàng hoặc crypto trong mục Investments." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {investments.map(inv => {
              const valueVND = invValueVND(inv)
              const isSavings = inv.type === 'savings'
              const costVND = !isSavings && inv.averageBuyPrice
                ? toVND(inv.averageBuyPrice * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
                : null
              const pnl = costVND != null ? valueVND - costVND : null
              const typeBadge = inv.type === 'gold' ? { bg: '#FEF9C3', text: '🥇 Vàng' }
                : inv.type === 'crypto' ? { bg: '#EFF6FF', text: '🪙 Crypto' }
                : { bg: '#e0f2fe', text: '🏦 Tiết kiệm' }
              return (
                <div key={inv.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{inv.assetName}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink3)', background: typeBadge.bg, padding: '2px 7px', borderRadius: 99 }}>
                      {typeBadge.text}
                    </span>
                  </div>
                  {isSavings ? (
                    <div className="font-mono" style={{ fontSize: 15, fontWeight: 600, color: '#0ea5e9' }}>
                      {inv.currency === 'JPY'
                        ? `¥${inv.quantity.toLocaleString('ja-JP')}`
                        : formatVND(inv.quantity)}
                    </div>
                  ) : (
                    <>
                      <div className="font-mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                        {formatVND(valueVND)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                        {inv.quantity} {inv.currency === 'VND' ? 'lượng' : inv.currency === 'JPY' ? 'JPY' : inv.assetName}
                        {pnl != null && (
                          <span style={{ marginLeft: 8, color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                            {pnl >= 0 ? '+' : ''}{formatVND(pnl)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gold / Crypto / Savings breakdown */}
      {investments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <InvestmentGroup title="🥇 Vàng" items={goldHoldings} rates={rates} />
          <InvestmentGroup title="🪙 Crypto" items={cryptoHoldings} rates={rates} />
          <SavingsGroup items={savingsHoldings} />
        </div>
      )}

      {/* Forex reference */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>Tỷ giá tham chiếu (live)</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <RateItem label="USD/JPY" value={`¥${rates.jpy.toFixed(2)}`} />
          <RateItem label="USD/VND" value={`${(rates.vnd / 1000).toFixed(1)}K₫`} />
          <RateItem
            label="100 JPY/VND"
            value={formatVND(Math.round(100 * rates.vnd / rates.jpy))}
          />
          <RateItem
            label="10,000 JPY/VND"
            value={formatVND(Math.round(10000 * rates.vnd / rates.jpy))}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────


function SavingsCard({ label, savingsVND, savingsJPY, hasVND, hasJPY }: {
  label: string; savingsVND: number; savingsJPY: number; hasVND: boolean; hasJPY: boolean
}) {
  const vndColor = savingsVND >= 0 ? '#10b981' : '#ef4444'
  const jpyColor = savingsJPY >= 0 ? '#10b981' : '#ef4444'
  const vndSign = savingsVND >= 0 ? '+' : ''
  const jpySign = savingsJPY >= 0 ? '+' : ''
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {hasVND && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: vndColor }}>
              {vndSign}{formatVND(Math.abs(savingsVND))}
            </span>
          </div>
        )}
        {hasJPY && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: jpyColor }}>
              {jpySign}¥{Math.abs(savingsJPY).toLocaleString('ja-JP')}
            </span>
          </div>
        )}
        {!hasVND && !hasJPY && (
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink3)' }}>—</span>
        )}
      </div>
    </div>
  )
}

function InvestmentSummaryCard({ vnd, jpy, usd, count }: {
  vnd: number; jpy: number; usd: number; count: number
}) {
  const hasAny = vnd > 0 || jpy > 0 || usd > 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 8 }}>Danh mục đầu tư</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!hasAny && <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink3)' }}>—</span>}
        {vnd > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: '#6366f1' }}>{formatVND(vnd)}</span>
          </div>
        )}
        {jpy > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: '#6366f1' }}>¥{jpy.toLocaleString('ja-JP')}</span>
          </div>
        )}
        {usd > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>USD</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: '#6366f1' }}>${usd.toLocaleString()}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 6 }}>{count} tài sản</div>
    </div>
  )
}

function CurrencyCard({ label, rawVND, rawJPY, sub, accent }: {
  label: string; rawVND: number; rawJPY: number; sub: string; accent: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rawVND > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>{formatVND(rawVND)}</span>
          </div>
        )}
        {rawJPY > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>¥{rawJPY.toLocaleString('ja-JP')}</span>
          </div>
        )}
        {rawVND === 0 && rawJPY === 0 && (
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>—</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 6 }}>{sub}</div>
    </div>
  )
}

function CountryBar({ label, displayAmount, valueVND, totalVND }: {
  label: string; displayAmount: string; valueVND: number; totalVND: number
}) {
  const pct = totalVND > 0 ? Math.round(valueVND / totalVND * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
          {displayAmount} · {pct}%
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--ink)', borderRadius: 99, width: `${pct}%`, opacity: 0.7 }} />
      </div>
    </div>
  )
}

function InvestmentGroup({ title, items, rates }: {
  title: string; items: FamilyInvestment[]; rates: ForexRates
}) {
  if (items.length === 0) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>{title}</div>
      {items.map(inv => {
        const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
        const valueVND = toVND(price * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
        return (
          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink)' }}>{inv.assetName}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                {inv.quantity} × {inv.currency === 'JPY' ? formatJPY(price) : formatVND(price)}
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>
              {formatVND(valueVND)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SavingsGroup({ items }: { items: FamilyInvestment[] }) {
  if (items.length === 0) return null
  const totalVND = items.filter(i => i.currency === 'VND').reduce((s, i) => s + i.quantity, 0)
  const totalJPY = items.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.quantity, 0)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>🏦 Tiết kiệm</div>
      {items.map(inv => (
        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--ink)' }}>{inv.assetName}</div>
          <div className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: '#0ea5e9' }}>
            {inv.currency === 'JPY'
              ? `¥${inv.quantity.toLocaleString('ja-JP')}`
              : formatVND(inv.quantity)}
          </div>
        </div>
      ))}
      <div style={{ paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {totalVND > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>VND</span>
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>{formatVND(totalVND)}</span>
          </div>
        )}
        {totalJPY > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink3)', fontFamily: 'monospace' }}>JPY</span>
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>¥{totalJPY.toLocaleString('ja-JP')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RateItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>{text}</p>
}

export type { MonthlySummary }
