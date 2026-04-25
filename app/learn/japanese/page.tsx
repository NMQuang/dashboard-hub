// app/learn/japanese/page.tsx
import type { Metadata } from 'next'
import BJTTracker from './BJTTracker'

export const metadata: Metadata = { title: 'BJT Study Tracker' }

export default function JapanesePage() {
  return (
    <div className="page-content">
      <div style={{ marginBottom: 16 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / japanese</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          BJT <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Study Tracker 2026</span>
        </h1>
      </div>
      <BJTTracker />
    </div>
  )
}
