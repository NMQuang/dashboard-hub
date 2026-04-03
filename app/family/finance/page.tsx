import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { getBudgetEntries } from '@/services/family-storage'
import { fetchForexJPY } from '@/services/market'
import FinanceClient from '@/components/family/FinanceClient'

export const metadata: Metadata = { title: 'Finance · Family' }

export default async function FinancePage() {
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const [entries, lastEntries, forex] = await Promise.allSettled([
    getBudgetEntries(thisMonth),
    getBudgetEntries(lastMonth),
    fetchForexJPY(),
  ])

  const thisMonthEntries = entries.status === 'fulfilled' ? entries.value : []
  const lastMonthEntries = lastEntries.status === 'fulfilled' ? lastEntries.value : []
  const jpyRate          = forex.status === 'fulfilled' ? forex.value.price : 149.5

  // Summary this month
  const vnTotal  = thisMonthEntries.filter(e => e.location === 'vietnam').reduce((s, e) => s + e.amount, 0)
  const jpTotal  = thisMonthEntries.filter(e => e.location === 'japan').reduce((s, e) => s + e.amount, 0)
  const lastTotal = lastMonthEntries.reduce((s, e) => s + (e.currency === 'VND' ? e.amount : e.amount * jpyRate * 170), 0)

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / finance</div>
          <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Finance <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>chi tiêu gia đình 💴</span></h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>Tỷ giá hôm nay</div>
          <div className="font-mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
            ¥1 = {(170 / jpyRate * 1000).toFixed(0)}₫
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>¥{jpyRate.toFixed(2)}/USD · live</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>VN tháng này</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>
            {(vnTotal / 1_000_000).toFixed(1)}M₫
          </div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nhật tháng này</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>
            ¥{jpTotal.toLocaleString('ja-JP')}
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
            ≈ {(jpTotal / jpyRate * 170 / 1_000_000).toFixed(1)}M₫
          </div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tháng trước</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>
            {(lastTotal / 1_000_000).toFixed(1)}M₫
          </div>
          <div style={{ fontSize: 11, color: lastTotal > 0 ? 'var(--ink3)' : 'var(--ink3)' }}>{lastMonthEntries.length} khoản</div>
        </div>
      </div>

      <FinanceClient
        initialEntries={thisMonthEntries}
        currentMonth={thisMonth}
        jpyRate={jpyRate}
      />
    </div>
  )
}
