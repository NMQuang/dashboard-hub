'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

export default function Sidebar() {
  const pathname = usePathname()
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [open, setOpen] = useState(false)

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB'))
      setDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Hamburger button — only visible on mobile via CSS */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Backdrop — mobile only */}
      <div
        className={`sidebar-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Sidebar panel */}
      <aside
        className={`sidebar-desktop ${open ? 'open' : ''}`}
        style={{
          width: 212,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 16px 18px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="font-mono" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--ink)' }}>
              QuangNM HUB
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
              personal command center
            </div>
          </Link>
        </div>

        {/* Home link */}
        <div style={{ padding: '0 8px', marginBottom: 4 }}>
          <NavLink href="/" label="Home" icon="⌂" active={pathname === '/'} />
        </div>

        {/* Nav groups */}
        {NAV_ITEMS.map(group => (
          <div key={group.group} style={{ padding: '0 8px', marginBottom: 4 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 500, color: 'var(--ink3)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 8px 4px', fontFamily: 'inherit',
            }}>
              {group.group}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={'badge' in item ? (item as { badge: string }).badge : undefined}
                active={'exact' in item && item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')}
              />
            ))}
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          padding: '12px 8px 0',
          borderTop: '1px solid var(--border)',
        }}>
          <ThemeToggle />
          <div style={{ padding: '8px 8px 0' }}>
            <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink3)' }}>
              <span className="dot-live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', flexShrink: 0 }} />
              {time}
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>{date}</div>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavLink({
  href, label, icon, badge, active,
}: {
  href: string; label: string; icon?: string; badge?: string; active: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 7,
        fontSize: 13.5, textDecoration: 'none',
        fontWeight: 400, transition: 'background 0.12s, color 0.12s',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? '#fff' : 'var(--ink2)',
      }}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center', opacity: active ? 1 : 0.6, flexShrink: 0 }}>
        {icon}
      </span>
      {label}
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--mono)',
          background: active ? 'rgba(255,255,255,0.2)' : 'var(--green-bg)',
          color: active ? '#fff' : 'var(--green)',
          padding: '1px 6px', borderRadius: 20, fontWeight: 500,
        }}>
          {badge}
        </span>
      )}
    </Link>
  )
}
