'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import type { FamilyExpense } from '@/types/family'
import { EXPENSE_CATEGORY_LABELS } from '@/types/family'
import type { ForexRates } from '@/services/familyFinance'
import { formatVND } from '@/services/familyFinance'

export interface MonthlyReport {
  month: string        // YYYY-MM
  label: string        // e.g. "T01"
  incomeVND: number
  expensesVND: number
  savingsVND: number
  vnExpensesVND: number
  jpExpensesVND: number
}

interface ReportsClientProps {
  year: number
  months: MonthlyReport[]
  categoryBreakdown: Array<{ category: FamilyExpense['category']; totalVND: number }>
  rates: ForexRates
}

const MONTH_COLORS = { income: '#10b981', expenses: '#ef4444', savings: '#6366f1' }

export default function ReportsClient({ year, months, categoryBreakdown, rates }: ReportsClientProps) {
  const totalIncome = months.reduce((s, m) => s + m.incomeVND, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expensesVND, 0)
  const totalSavings = totalIncome - totalExpenses
  const totalVNExpenses = months.reduce((s, m) => s + m.vnExpensesVND, 0)
  const totalJPExpenses = months.reduce((s, m) => s + m.jpExpensesVND, 0)

  const chartData = months.map(m => ({
    name: m.label,
    'Thu nhập': Math.round(m.incomeVND / 1_000_000),
    'Chi tiêu': Math.round(m.expensesVND / 1_000_000),
    'Tiết kiệm': Math.round(m.savingsVND / 1_000_000),
  }))

  const locationData = months.map(m => ({
    name: m.label,
    'Việt Nam': Math.round(m.vnExpensesVND / 1_000_000),
    'Nhật Bản': Math.round(m.jpExpensesVND / 1_000_000),
  }))

  const savingsRate = totalIncome > 0 ? Math.round(totalSavings / totalIncome * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Year summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <YearCard label={`Tổng thu nhập ${year}`} value={formatVND(totalIncome)} accent="#10b981" />
        <YearCard label={`Tổng chi tiêu ${year}`} value={formatVND(totalExpenses)} accent="#ef4444" />
        <YearCard label="Tiết kiệm cả năm" value={formatVND(Math.abs(totalSavings))} accent={totalSavings >= 0 ? '#6366f1' : '#ef4444'} />
        <YearCard label="Tỷ lệ tiết kiệm" value={`${savingsRate}%`} accent={savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#ef4444'} />
        <YearCard label="Chi VN năm nay" value={formatVND(totalVNExpenses)} accent="#d97706" />
        <YearCard label="Chi JP năm nay" value={formatVND(totalJPExpenses)} accent="#3b82f6" />
      </div>

      {/* Monthly income vs expenses bar chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
          Thu chi theo tháng {year} (triệu ₫)
        </div>
        {chartData.some(d => d['Thu nhập'] > 0 || d['Chi tiêu'] > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}M₫`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Thu nhập" fill={MONTH_COLORS.income} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Chi tiêu" fill={MONTH_COLORS.expenses} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* Savings trend line chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
          Xu hướng tiết kiệm {year} (triệu ₫)
        </div>
        {chartData.some(d => d['Tiết kiệm'] !== 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}M₫`, 'Tiết kiệm']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Line
                type="monotone"
                dataKey="Tiết kiệm"
                stroke={MONTH_COLORS.savings}
                strokeWidth={2}
                dot={{ r: 4, fill: MONTH_COLORS.savings }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* VN vs JP spending */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
          Chi tiêu VN vs JP theo tháng (triệu ₫)
        </div>
        {locationData.some(d => d['Việt Nam'] > 0 || d['Nhật Bản'] > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={locationData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}M₫`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Việt Nam" fill="#d97706" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Nhật Bản" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* Category breakdown table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}>
          Chi tiêu theo danh mục cả năm {year}
        </div>
        {categoryBreakdown.length === 0 ? (
          <div style={{ padding: 16 }}><EmptyChart /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {categoryBreakdown.map((row, idx) => {
                const pct = totalExpenses > 0 ? Math.round(row.totalVND / totalExpenses * 100) : 0
                return (
                  <tr key={row.category} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : undefined }}>
                    <td style={{ padding: '10px 16px', color: 'var(--ink2)', width: 160 }}>
                      {EXPENSE_CATEGORY_LABELS[row.category]}
                    </td>
                    <td style={{ padding: '10px 16px', flex: 1 }}>
                      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#6366f1', borderRadius: 99, width: `${pct}%`, opacity: 0.75 }} />
                      </div>
                    </td>
                    <td className="font-mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ink)', fontWeight: 500 }}>
                      {formatVND(row.totalVND)}
                    </td>
                    <td className="font-mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--ink3)', fontSize: 12, width: 50 }}>
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly detail table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}>
          Chi tiết từng tháng {year}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Tháng', 'Thu nhập', 'Chi tiêu', 'Tiết kiệm', 'Chi VN', 'Chi JP'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, color: 'var(--ink3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m, idx) => (
                <tr key={m.month} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : undefined }}>
                  <td className="font-mono" style={{ padding: '9px 14px', color: 'var(--ink)', fontWeight: 500 }}>{m.label}</td>
                  <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', color: '#10b981' }}>
                    {m.incomeVND > 0 ? formatVND(m.incomeVND) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', color: '#ef4444' }}>
                    {m.expensesVND > 0 ? formatVND(m.expensesVND) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', color: m.savingsVND >= 0 ? '#6366f1' : '#ef4444' }}>
                    {m.incomeVND > 0 || m.expensesVND > 0 ? (m.savingsVND >= 0 ? '+' : '') + formatVND(m.savingsVND) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', color: 'var(--ink3)' }}>
                    {m.vnExpensesVND > 0 ? formatVND(m.vnExpensesVND) : '—'}
                  </td>
                  <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', color: 'var(--ink3)' }}>
                    {m.jpExpensesVND > 0 ? formatVND(m.jpExpensesVND) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function YearCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: accent }}>{value}</div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
        Chưa có dữ liệu cho năm này
      </span>
    </div>
  )
}
