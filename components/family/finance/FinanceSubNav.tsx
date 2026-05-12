'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

const TABS = [
  { href: '/family/finance',             label: 'Overview',     icon: '◎' },
  { href: '/family/finance/income',      label: 'Income',       icon: '↑' },
  { href: '/family/finance/expenses',    label: 'Expenses',     icon: '↓' },
  { href: '/family/finance/investments', label: 'Investments',  icon: '◈' },
  { href: '/family/finance/reports',     label: 'Reports',      icon: '≡' },
] as const

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FinanceSubNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const isCurrentMonth = month === new Date().toISOString().slice(0, 7)

  const [y, m] = month.split('-')
  const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  function go(delta: number) {
    router.push(`${pathname}?month=${shiftMonth(month, delta)}`)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const active = tab.href === '/family/finance'
            ? pathname === '/family/finance'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={`${tab.href}?month=${month}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, fontSize: 13,
                textDecoration: 'none', fontWeight: active ? 500 : 400,
                background: active ? 'var(--ink)' : 'var(--surface2)',
                color: active ? '#fff' : 'var(--ink2)',
                border: '1px solid',
                borderColor: active ? 'var(--ink)' : 'var(--border)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <span style={{ fontSize: 11, opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Month navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginLeft: 8, padding: '4px 4px 4px 10px',
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 20,
      }}>
        <button
          onClick={() => go(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: 'var(--ink2)', padding: '0 4px', lineHeight: 1,
          }}
          title="Tháng trước"
        >
          ‹
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <button
          onClick={() => go(1)}
          disabled={isCurrentMonth}
          style={{
            background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer',
            fontSize: 16, color: isCurrentMonth ? 'var(--border)' : 'var(--ink2)',
            padding: '0 4px', lineHeight: 1,
          }}
          title="Tháng sau"
        >
          ›
        </button>
      </div>
    </div>
  )
}
