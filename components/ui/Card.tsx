'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[14px] border border-[#e8e6e1] p-4',
        hover && 'transition-[border-color,box-shadow] hover:border-[#d4d0c8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3.5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{children}</span>
}

export function CardAction({ children, href }: { children: React.ReactNode; href?: string }) {
  const style: React.CSSProperties = { fontSize: 11.5, color: 'var(--ink3)', cursor: 'pointer', textDecoration: 'none', fontFamily: 'monospace' }
  if (href) {
    if (href.startsWith('/')) return <Link href={href} style={style}>{children}</Link>
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>
  }
  return <span style={style}>{children}</span>
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--ink3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}
