'use client'

import Link from 'next/link'
import { useState } from 'react'

interface NavItem {
  href: string
  icon: string
  label: string
  desc: string
  color: string
}

interface NavShortcutsProps {
  items: NavItem[]
}

export default function NavShortcuts({ items }: NavShortcutsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {items.map(item => (
        <NavCard key={item.href} item={item} />
      ))}
    </div>
  )
}

function NavCard({ item }: { item: NavItem }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={item.href}
      style={{
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: hovered ? 'var(--border2)' : 'var(--border)',
        borderRadius: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: item.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, flexShrink: 0,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 1 }}>{item.label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
      </div>
      <span style={{ color: 'var(--ink3)', fontSize: 14, marginTop: 2 }}>→</span>
    </Link>
  )
}
