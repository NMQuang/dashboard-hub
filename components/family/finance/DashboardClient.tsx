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
  // ── Totals ──────────────────────────────────────────────────────────────
  const totalIncomeVND = incomeThisMonth.reduce(
    (sum, i) => sum + toVND(i.amount, i.currency, rates), 0,
  )
  const totalExpensesVND = expensesThisMonth.reduce(
    (sum, e) => sum + toVND(e.amount, e.currency, rates), 0,
  )
  const savingsVND = totalIncomeVND - totalExpensesVND

  const vnExpensesVND = expensesThisMonth
    .filter(e => e.country === 'VN')
    .reduce((sum, e) => sum + toVND(e.amount, e.currency, rates), 0)
  const jpExpensesVND = expensesThisMonth
    .filter(e => e.country === 'JP')
    .reduce((sum, e) => sum + toVND(e.amount, e.currency, rates), 0)

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

  // ── Income by source ────────────────────────────────────────────────────
  const sourceMap: Partial<Record<FamilyIncome['source'], number>> = {}
  for (const i of incomeThisMonth) {
    const vnd = toVND(i.amount, i.currency, rates)
    sourceMap[i.source] = (sourceMap[i.source] ?? 0) + vnd
  }

  // ── Investment portfolio ─────────────────────────────────────────────────
  const goldHoldings = investments.filter(i => i.type === 'gold')
  const cryptoHoldings = investments.filter(i => i.type === 'crypto')

  const portfolioValue = investments.reduce((sum, inv) => {
    const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
    const valueVND = toVND(price * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
    return sum + valueVND
  }, 0)

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
        <SummaryCard
          label={`Thu nhập ${monthLabel}`}
          value={formatVND(totalIncomeVND)}
          sub={`${incomeThisMonth.length} nguồn thu`}
          accent="#10b981"
        />
        <SummaryCard
          label={`Chi tiêu ${monthLabel}`}
          value={formatVND(totalExpensesVND)}
          sub={`${expensesThisMonth.length} khoản`}
          accent="#ef4444"
        />
        <SummaryCard
          label="Tiết kiệm tháng này"
          value={formatVND(Math.abs(savingsVND))}
          sub={savingsVND >= 0 ? 'dương ↑' : 'âm ↓'}
          accent={savingsVND >= 0 ? '#10b981' : '#ef4444'}
        />
        <SummaryCard
          label="Danh mục đầu tư"
          value={formatVND(portfolioValue)}
          sub={`${investments.length} tài sản`}
          accent="#6366f1"
        />
      </div>

      {/* VN vs JP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>Chi tiêu theo nơi</div>
          <CountryBar label="🇻🇳 Việt Nam" valueVND={vnExpensesVND} totalVND={totalExpensesVND} />
          <CountryBar label="🇯🇵 Nhật Bản" valueVND={jpExpensesVND} totalVND={totalExpensesVND} />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12 }}>Thu nhập theo nguồn</div>
          {Object.entries(sourceMap).length === 0 ? (
            <EmptyNote text="Chưa có thu nhập tháng này" />
          ) : (
            Object.entries(sourceMap).map(([src, vnd]) => (
              <div key={src} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                  {INCOME_SOURCE_LABELS[src as FamilyIncome['source']] ?? src}
                </span>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                  {formatVND(vnd)}
                </span>
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
              const price = inv.currentPrice ?? inv.averageBuyPrice ?? 0
              const valueVND = toVND(price * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
              const costVND = inv.averageBuyPrice
                ? toVND(inv.averageBuyPrice * inv.quantity, inv.currency as 'VND' | 'JPY' | 'USD', rates)
                : null
              const pnl = costVND != null ? valueVND - costVND : null
              return (
                <div key={inv.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{inv.assetName}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink3)', background: inv.type === 'gold' ? '#FEF9C3' : '#EFF6FF', padding: '2px 7px', borderRadius: 99 }}>
                      {inv.type === 'gold' ? '🥇 Vàng' : '🪙 Crypto'}
                    </span>
                  </div>
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
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gold/Crypto breakdown */}
      {investments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InvestmentGroup title="🥇 Vàng" items={goldHoldings} rates={rates} />
          <InvestmentGroup title="🪙 Crypto" items={cryptoHoldings} rates={rates} />
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

function SummaryCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 8 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: accent }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function CountryBar({ label, valueVND, totalVND }: { label: string; valueVND: number; totalVND: number }) {
  const pct = totalVND > 0 ? Math.round(valueVND / totalVND * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
          {formatVND(valueVND)} · {pct}%
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
