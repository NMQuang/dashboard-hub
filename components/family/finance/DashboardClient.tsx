'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid, ReferenceLine,
} from 'recharts'
import type { FamilyIncome, FamilyExpense, FamilyInvestment, FamilyDebt } from '@/types/family'
import { INCOME_SOURCE_LABELS, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { toVND, formatVND, formatJPY } from '@/services/familyFinance'
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface MonthlySummary {
  month: string
  incomeVND: number
  expensesVND: number
}

interface DashboardClientProps {
  incomeThisMonth: FamilyIncome[]
  expensesThisMonth: FamilyExpense[]
  investments: FamilyInvestment[]
  debts: FamilyDebt[]
  rates: ForexRates
  monthLabel: string
  recentMonths: MonthlySummary[]
}

// ── Projection helpers ──────────────────────────────────────────────────────

interface ProjectionPoint {
  month: number
  label: string
  remaining: number
  paidPct: number
}

function computeProjection(totalVND: number, monthlyVND: number): ProjectionPoint[] {
  if (totalVND <= 0 || monthlyVND <= 0) return []
  const pts: ProjectionPoint[] = []
  let payoffMonth: number | null = null
  for (let m = 0; m <= 60; m++) {
    const remaining = Math.max(0, totalVND - monthlyVND * m)
    const paidPct = Math.round(((totalVND - remaining) / totalVND) * 100)
    if (payoffMonth === null && remaining === 0) payoffMonth = m
    if (m % 6 === 0 || m === payoffMonth) {
      const yr = m / 12
      const label = m === 0 ? 'Nay' : Number.isInteger(yr) ? `${yr} năm` : `${m}th`
      pts.push({ month: m, label, remaining, paidPct })
    }
    if (payoffMonth !== null && m > payoffMonth) break
  }
  if (payoffMonth === null && (pts[pts.length - 1]?.month ?? 0) < 60) {
    const remaining = Math.max(0, totalVND - monthlyVND * 60)
    pts.push({ month: 60, label: '5 năm', remaining, paidPct: Math.round(((totalVND - remaining) / totalVND) * 100) })
  }
  return pts
}

function fmtVNDCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

export default function DashboardClient({
  incomeThisMonth,
  expensesThisMonth,
  investments,
  debts,
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
  const stockHoldings   = investments.filter(i => i.type === 'stock')

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

  // ── Debt projection state ──────────────────────────────────────────────────
  const [savingsInput, setSavingsInput] = useState('')
  const [savingsCurrency, setSavingsCurrency] = useState<'VND' | 'JPY'>('JPY')

  const totalIOweVND = useMemo(
    () => debts
      .filter(d => d.type === 'owe' && d.status !== 'settled')
      .reduce((s, d) => s + toVND(d.amount - d.paidAmount, d.currency, rates), 0),
    [debts, rates],
  )

  const monthlyVND = useMemo(() => {
    const raw = Number(savingsInput)
    if (!raw || raw <= 0) return 0
    return savingsCurrency === 'JPY' ? toVND(raw, 'JPY', rates) : raw
  }, [savingsInput, savingsCurrency, rates])

  const projectionData = useMemo(
    () => computeProjection(totalIOweVND, monthlyVND),
    [totalIOweVND, monthlyVND],
  )

  const snapAt = (months: number) => {
    if (!projectionData.length) return null
    return projectionData.find(p => p.month >= months) ?? projectionData[projectionData.length - 1]
  }

  const searchParams = useSearchParams()
  const currentMonth = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)

  const goldValue   = goldHoldings.reduce((s, i) => s + invValueVND(i), 0)
  const cryptoValue = cryptoHoldings.reduce((s, i) => s + invValueVND(i), 0)
  const stockValue  = stockHoldings.reduce((s, i) => s + invValueVND(i), 0)

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
        <CardLink
          href="/family/finance/income"
          month={currentMonth}
          detail={
            <div>
              {Object.entries(sourceMap).length === 0
                ? <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Chưa có thu nhập</div>
                : Object.entries(sourceMap).map(([src, amounts]) => (
                  <div key={src} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{INCOME_SOURCE_LABELS[src as FamilyIncome['source']] ?? src}</span>
                    <div style={{ textAlign: 'right' }}>
                      {amounts.vnd > 0 && <div className="font-mono" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{formatVND(amounts.vnd)}</div>}
                      {amounts.jpy > 0 && <div className="font-mono" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>¥{amounts.jpy.toLocaleString('ja-JP')}</div>}
                    </div>
                  </div>
                ))
              }
            </div>
          }
        >
          <CurrencyCard
            label={`Thu nhập ${monthLabel}`}
            rawVND={incomeRawVND}
            rawJPY={incomeRawJPY}
            sub={`${incomeThisMonth.length} nguồn thu`}
            accent="#10b981"
          />
        </CardLink>
        <CardLink
          href="/family/finance/expenses"
          month={currentMonth}
          detail={
            <div>
              {pieData.length === 0
                ? <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Chưa có chi tiêu</div>
                : pieData.slice(0, 4).map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{item.name}</span>
                    <span className="font-mono" style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{formatVND(item.value)}</span>
                  </div>
                ))
              }
              {pieData.length > 4 && <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>+{pieData.length - 4} danh mục khác</div>}
            </div>
          }
        >
          <CurrencyCard
            label={`Chi tiêu ${monthLabel}`}
            rawVND={expRawVND}
            rawJPY={expRawJPY}
            sub={`${expensesThisMonth.length} khoản`}
            accent="#ef4444"
          />
        </CardLink>
        <CardLink
          href="/family/finance/reports"
          month={currentMonth}
          detail={
            <div>
              {(() => {
                const rate = totalIncomeVND > 0 ? Math.round(savingsVND / totalIncomeVND * 100) : 0
                const rateColor = rate >= 20 ? '#10b981' : rate >= 10 ? '#f59e0b' : '#ef4444'
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink2)' }}>Tỷ lệ tiết kiệm</span>
                      <span className="font-mono" style={{ fontSize: 12, color: rateColor, fontWeight: 600 }}>{rate}%</span>
                    </div>
                    {(incomeRawVND > 0 || expRawVND > 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>VND</span>
                        <span className="font-mono" style={{ fontSize: 12, color: savingsRawVND >= 0 ? '#10b981' : '#ef4444' }}>
                          {savingsRawVND >= 0 ? '+' : ''}{formatVND(Math.abs(savingsRawVND))}
                        </span>
                      </div>
                    )}
                    {(incomeRawJPY > 0 || expRawJPY > 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>JPY</span>
                        <span className="font-mono" style={{ fontSize: 12, color: savingsRawJPY >= 0 ? '#10b981' : '#ef4444' }}>
                          {savingsRawJPY >= 0 ? '+' : ''}¥{Math.abs(savingsRawJPY).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          }
        >
          <SavingsCard
            label="Tiết kiệm tháng này"
            savingsVND={savingsRawVND}
            savingsJPY={savingsRawJPY}
            hasVND={incomeRawVND > 0 || expRawVND > 0}
            hasJPY={incomeRawJPY > 0 || expRawJPY > 0}
          />
        </CardLink>
        <CardLink
          href="/family/finance/investments"
          month={currentMonth}
          detail={
            <div>
              {goldValue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink2)' }}>🥇 Vàng</span>
                  <span className="font-mono" style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>{formatVND(goldValue)}</span>
                </div>
              )}
              {cryptoValue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink2)' }}>🪙 Crypto</span>
                  <span className="font-mono" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>{formatVND(cryptoValue)}</span>
                </div>
              )}
              {stockValue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink2)' }}>📈 Cổ phiếu</span>
                  <span className="font-mono" style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{formatVND(stockValue)}</span>
                </div>
              )}
              {investments.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Chưa có tài sản</div>}
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>{investments.length} tài sản</div>
            </div>
          }
        >
          <InvestmentSummaryCard
            vnd={portRawVND}
            jpy={portRawJPY}
            usd={portRawUSD}
            count={investments.length}
          />
        </CardLink>
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
          <InvestmentGroup title="📈 Cổ phiếu" items={stockHoldings} rates={rates} />
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

      {/* Debt projection */}
      {debts.some(d => d.type === 'owe' && d.status !== 'settled') && (
        <DebtProjectionSection
          totalIOweVND={totalIOweVND}
          savingsInput={savingsInput}
          savingsCurrency={savingsCurrency}
          monthlyVND={monthlyVND}
          projectionData={projectionData}
          at3yr={snapAt(36)}
          at5yr={snapAt(60)}
          payoffMonths={projectionData.find(p => p.remaining === 0)?.month ?? null}
          onSavingsChange={setSavingsInput}
          onCurrencyChange={setSavingsCurrency}
          rates={rates}
        />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

const BUBBLE_STYLE = `
@keyframes bubbleIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1);    }
}
`

function CardLink({ href, month, detail, children }: {
  href: string
  month: string
  detail: React.ReactNode
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  return (
    <div
      style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`${href}?month=${month}`)}
    >
      <style>{BUBBLE_STYLE}</style>

      {/* Card — lifts slightly on hover */}
      <div style={{
        borderRadius: 14,
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s cubic-bezier(.34,1.4,.64,1), box-shadow 0.2s ease',
      }}>
        {children}
      </div>

      {/* Floating bubble — appears above the card */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 14px)',
          left: '50%',
          zIndex: 100,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '14px 16px',
          minWidth: 230,
          maxWidth: 290,
          pointerEvents: 'none',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          animation: 'bubbleIn 0.18s cubic-bezier(.34,1.3,.64,1) both',
        }}>
          {/* Caret pointing down to the card */}
          <div style={{
            position: 'absolute',
            bottom: -7,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 13,
            height: 13,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }} />

          <div style={{
            fontSize: 10, color: 'var(--ink3)', marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ opacity: 0.5 }}>●</span> Chi tiết · click để xem
          </div>
          {detail}
        </div>
      )}
    </div>
  )
}

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

// ── Debt Projection ─────────────────────────────────────────────────────────

function DebtProjectionSection({
  totalIOweVND, savingsInput, savingsCurrency, monthlyVND,
  projectionData, at3yr, at5yr, payoffMonths,
  onSavingsChange, onCurrencyChange, rates,
}: {
  totalIOweVND: number
  savingsInput: string
  savingsCurrency: 'VND' | 'JPY'
  monthlyVND: number
  projectionData: ProjectionPoint[]
  at3yr: ProjectionPoint | null | undefined
  at5yr: ProjectionPoint | null | undefined
  payoffMonths: number | null
  onSavingsChange: (v: string) => void
  onCurrencyChange: (v: 'VND' | 'JPY') => void
  rates: ForexRates
}) {
  const hasData = projectionData.length > 1

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--ink)', fontSize: 13, boxSizing: 'border-box',
  }

  const SnapCard = ({ label, pt }: { label: string; pt: ProjectionPoint | null | undefined }) => {
    if (!pt) return null
    const pct = pt.paidPct
    const color = pct >= 100 ? '#22c55e' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', flex: '1 1 130px', minWidth: 120,
      }}>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color }}>
          {pct >= 100 ? '🎉 Xong!' : `${pct}% trả xong`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
          Còn: {formatVND(pt.remaining)}
        </div>
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>📊 Dự báo trả nợ</div>
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
          Tổng nợ: <strong>{formatVND(totalIOweVND)}</strong>
        </div>
      </div>

      {/* Savings input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>Tiết kiệm / tháng:</span>
        <input
          type="number"
          placeholder="0"
          value={savingsInput}
          onChange={e => onSavingsChange(e.target.value)}
          style={{ ...inputStyle, width: 130 }}
        />
        <select
          value={savingsCurrency}
          onChange={e => onCurrencyChange(e.target.value as 'VND' | 'JPY')}
          style={{ ...inputStyle, width: 75 }}
        >
          <option value="JPY">JPY</option>
          <option value="VND">VND</option>
        </select>
        {monthlyVND > 0 && (
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>≈ {formatVND(monthlyVND)}/tháng</span>
        )}
      </div>

      {/* Snapshot cards */}
      {hasData && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <SnapCard label="Hiện tại" pt={{ month: 0, label: 'Nay', remaining: totalIOweVND, paidPct: 0 }} />
          <SnapCard label="3 năm sau" pt={at3yr} />
          <SnapCard label="5 năm sau" pt={at5yr} />
          {payoffMonths !== null && (
            <div style={{
              background: '#22c55e18', border: '1px solid #22c55e44',
              borderRadius: 10, padding: '10px 14px', flex: '1 1 130px', minWidth: 120,
            }}>
              <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 4 }}>Trả xong sau</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#22c55e' }}>
                {payoffMonths < 12
                  ? `${payoffMonths} tháng`
                  : `${(payoffMonths / 12).toFixed(1)} năm`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projectionData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="debtGradOv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtVNDCompact} tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              formatter={(v: number) => [formatVND(v), 'Còn nợ']}
              labelFormatter={(l: string) => `Thời điểm: ${l}`}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            {[0.75, 0.5, 0.25].map(ratio => (
              <ReferenceLine key={ratio} y={totalIOweVND * ratio}
                stroke="#6b6860" strokeDasharray="3 3" strokeOpacity={0.4}
                label={{ value: `${Math.round((1 - ratio) * 100)}%`, position: 'right', fontSize: 10, fill: '#6b6860' }}
              />
            ))}
            {projectionData.some(p => p.month === 36) && (
              <ReferenceLine x="3 năm" stroke="#3b82f6" strokeDasharray="4 3" strokeOpacity={0.6}
                label={{ value: '3 năm', position: 'top', fontSize: 10, fill: '#3b82f6' }} />
            )}
            {projectionData.some(p => p.month === 60) && (
              <ReferenceLine x="5 năm" stroke="#8b5cf6" strokeDasharray="4 3" strokeOpacity={0.6}
                label={{ value: '5 năm', position: 'top', fontSize: 10, fill: '#8b5cf6' }} />
            )}
            <Area type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={2}
              fill="url(#debtGradOv)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink3)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 10,
        }}>
          Nhập mức tiết kiệm hàng tháng để xem đồ thị dự báo
        </div>
      )}
    </div>
  )
}

export type { MonthlySummary }
