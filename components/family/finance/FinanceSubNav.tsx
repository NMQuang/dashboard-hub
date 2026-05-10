'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/family/finance',             label: 'Overview',     icon: '◎' },
  { href: '/family/finance/income',      label: 'Income',       icon: '↑' },
  { href: '/family/finance/expenses',    label: 'Expenses',     icon: '↓' },
  { href: '/family/finance/investments', label: 'Investments',  icon: '◈' },
  { href: '/family/finance/reports',     label: 'Reports',      icon: '≡' },
] as const

export default function FinanceSubNav() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {TABS.map(tab => {
        const active = tab.href === '/family/finance'
          ? pathname === '/family/finance'
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
  )
}
