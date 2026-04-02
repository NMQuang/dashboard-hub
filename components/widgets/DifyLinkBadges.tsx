'use client'

interface DifyLink { label: string; icon: string; href: string }

export default function DifyLinkBadges({ links }: { links: DifyLink[] }) {
  return (
    <div
      style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}
      onClick={e => e.stopPropagation()}
    >
      {links.map(dl => (
        <span
          key={dl.label}
          role="button"
          tabIndex={0}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            window.open(dl.href, '_blank', 'noopener,noreferrer');
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 6,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--ink2)', textDecoration: 'none',
            fontFamily: 'monospace', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--border)'
            el.style.color = 'var(--ink)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--surface2)'
            el.style.color = 'var(--ink2)'
          }}
        >
          <span>{dl.icon}</span>
          <span>{dl.label}</span>
          <span style={{ opacity: 0.5, fontSize: 9 }}>↗</span>
        </span>
      ))}
    </div>
  )
}
