import type { Metadata } from 'next'
import FinanceSubNav from '@/components/family/finance/FinanceSubNav'

export const metadata: Metadata = { title: 'Family Finance' }

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          family / finance
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Finance{' '}
          <span style={{ fontWeight: 300, color: 'var(--ink2)', fontSize: 18 }}>💴</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 6, marginBottom: 0 }}>
          Thu chi · tiết kiệm · đầu tư gia đình
        </p>
      </div>

      <FinanceSubNav />

      <div style={{ marginTop: 24 }}>{children}</div>
    </div>
  )
}
