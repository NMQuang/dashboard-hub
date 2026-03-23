import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
}

/** Small inline chip — language tags, stat labels, provider names */
export function Badge({ children, color = 'var(--ink2)', bg = 'var(--surface2)' }: BadgeProps) {
  return (
    <span style={{
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: bg,
      color,
      fontFamily: 'monospace',
      display: 'inline-block',
    }}>
      {children}
    </span>
  )
}
