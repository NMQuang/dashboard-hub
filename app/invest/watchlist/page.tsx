// app/invest/watchlist/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { fetchMarketSnapshot } from '@/services/market'
import { formatPrice, formatChange } from '@/lib/utils'
import type { AssetPrice } from '@/types'

export const metadata: Metadata = { title: 'Watchlist' }
export const revalidate = 60

const WATCHLIST_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'FET', 'ADA', 'DOT']

async function getWatchlist(): Promise<AssetPrice[]> {
  try {
    const snapshot = await fetchMarketSnapshot(WATCHLIST_SYMBOLS)
    return snapshot.coins
  } catch {
    return []
  }
}

export default async function WatchlistPage() {
  const coins = await getWatchlist()

  return (
    <div className="page-content" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          invest / watchlist
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Watchlist <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Crypto prices</span>
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracked assets</CardTitle>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
            via CoinGecko · refreshes every 60s
          </span>
        </CardHeader>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 120px 80px',
          gap: '0 12px',
          padding: '6px 0 8px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 2,
        }}>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SYM</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Price</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>24h</span>
        </div>

        {/* Rows */}
        {coins.length > 0
          ? coins.map((coin) => {
            const isUp = coin.change24h >= 0
            const hasChange = coin.change24h !== 0
            return (
              <div key={coin.symbol} style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 120px 80px',
                gap: '0 12px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}>
                <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {coin.symbol}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{coin.name}</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>
                  {formatPrice(coin.price, coin.currency)}
                </span>
                <div style={{ textAlign: 'right' }}>
                  {hasChange ? (
                    <span className="font-mono" style={{
                      fontSize: 11.5, fontWeight: 500,
                      padding: '2px 7px', borderRadius: 5,
                      color: isUp ? 'var(--green)' : 'var(--red)',
                      background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                    }}>
                      {formatChange(coin.change24h)}
                    </span>
                  ) : (
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>—</span>
                  )}
                </div>
              </div>
            )
          })
          : WATCHLIST_SYMBOLS.map(sym => (
            <div key={sym} style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 120px 80px',
              gap: '0 12px',
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
            }}>
              <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{sym}</span>
              <div className="skeleton" style={{ height: 13, width: 80 }} />
              <div className="skeleton" style={{ height: 13, width: 70, marginLeft: 'auto' }} />
              <div className="skeleton" style={{ height: 20, width: 52, borderRadius: 5, marginLeft: 'auto' }} />
            </div>
          ))
        }

        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 12 }}>
          {coins.length > 0
            ? `${coins.length} asset${coins.length !== 1 ? 's' : ''} · sorted by watchlist order`
            : 'Add COINGECKO_API_KEY to .env.local for live prices'}
        </div>
      </Card>
    </div>
  )
}
