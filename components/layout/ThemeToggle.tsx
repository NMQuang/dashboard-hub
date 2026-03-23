'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        borderRadius: 7,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 13.5,
        color: 'var(--ink2)',
        transition: 'background 0.12s',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0, opacity: 0.7 }}>
        {isDark ? '☀' : '◑'}
      </span>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
