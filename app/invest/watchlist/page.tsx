// app/invest/watchlist/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
export const metadata: Metadata = { title: 'Watchlist' }

export default function WatchlistPage() {
  const symbols = ['XAU', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP']
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>invest / watchlist</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Watchlist <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Saved symbols</span></h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Your symbols</CardTitle></CardHeader>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {symbols.map(s => (
            <div key={s} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{s}</span>
              <button style={{ fontSize: 12, color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          ))}
          <div style={{ padding: '8px 16px', borderRadius: 10, border: '1px dashed var(--border2)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--ink3)', fontSize: 13 }}>
            + Add symbol
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink3)' }}>
          Watchlist is saved to <span className="font-mono" style={{ fontSize: 11 }}>settings</span> and used across Market + Alerts pages.
        </div>
      </Card>
    </div>
  )
}
