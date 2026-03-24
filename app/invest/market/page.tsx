// app/invest/market/page.tsx
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { fetchMarketSnapshot } from '@/services/market'
import { DEFAULT_WATCHLIST } from '@/lib/constants'
import { formatPrice, formatChange } from '@/lib/utils'
import type { AssetPrice } from '@/types'

// Both use Recharts — need browser APIs
const GoldLive   = dynamic(() => import('@/components/widgets/GoldLive'),   { ssr: false })
const AssetChart = dynamic(() => import('@/components/widgets/AssetChart'), { ssr: false })

export const metadata: Metadata = { title: 'Market' }
export const revalidate = 3600

async function getSnapshot() {
  try { return await fetchMarketSnapshot(DEFAULT_WATCHLIST) }
  catch { return null }
}

export default async function MarketPage() {
  const snapshot = await getSnapshot()
  const gold   = snapshot?.gold
  const coins  = snapshot?.coins  ?? []
  const forex  = snapshot?.forex  ?? []

  // Find specific assets for chart initial values
  const btc = coins.find(c => c.symbol === 'BTC')
  const eth = coins.find(c => c.symbol === 'ETH')
  const fet = coins.find(c => c.symbol === 'FET')
  const jpy = forex.find(f => f.symbol === 'JPY')
  const vnd = forex.find(f => f.symbol === 'VND')

  // Stat strip — top row summary
  const statAssets: AssetPrice[] = [
    ...(gold  ? [gold]  : []),
    ...(btc   ? [btc]   : []),
    ...(eth   ? [eth]   : []),
    ...(fet   ? [fet]   : []),
    ...(jpy   ? [jpy]   : []),
    ...(vnd   ? [vnd]   : []),
  ]

  const all: AssetPrice[] = [
    ...(gold  ? [gold]  : []),
    ...coins,
    ...forex,
  ]

  return (
    <div className="page-content" style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>invest / market</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Market <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Gold · Crypto · FX</span>
        </h1>
      </div>

      {/* ── Vietnam Domestic Gold ────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader>
          <CardTitle>Vietnam Domestic Gold</CardTitle>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>Đơn vị: VND / lượng (cây) · Miếng & Nhẫn 24k</span>
        </CardHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0 24px' }}>
          {snapshot?.vnGold?.map((g) => {
            const isUp = g.change24h >= 0;
            return (
              <div key={g.brand} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{g.brand}</span>
                  {g.change24h !== 0 ? (
                    <span className="font-mono" style={{
                      fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                      color: isUp ? 'var(--green)' : 'var(--red)',
                      background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                    }}>
                      {isUp ? '+' : ''}{g.change24h.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="font-mono" style={{
                      fontSize: 10.5, padding: '2px 7px', borderRadius: 5,
                      color: 'var(--ink3)', background: 'var(--surface)',
                    }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink2)' }}>
                    Buy: {g.buy > 0 ? `${g.buy.toLocaleString('vi-VN')} ₫/lượng` : '- ₫/lượng'}
                  </span>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink)' }}>
                    Sell: {g.sell > 0 ? `${g.sell.toLocaleString('vi-VN')} ₫/lượng` : '- ₫/lượng'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Stat strip — always 6 tiles ──────────────────────────────── */}
      {(() => {
        const SLOTS = [
          { symbol: 'XAU', name: 'Gold',     currency: 'USD', source: gold },
          { symbol: 'BTC', name: 'Bitcoin',  currency: 'USD', source: btc  },
          { symbol: 'ETH', name: 'Ethereum', currency: 'USD', source: eth  },
          { symbol: 'FET', name: 'Fetch.ai', currency: 'USD', source: fet  },
          { symbol: 'JPY', name: 'USD/JPY',  currency: 'JPY', source: jpy  },
          { symbol: 'VND', name: 'USD/VND',  currency: 'VND', source: vnd  },
        ]
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 24 }}>
            {SLOTS.map(({ symbol, name, currency, source }) => {
              const price   = source?.price
              const change  = source?.change24h ?? null
              const isUp    = (change ?? 0) >= 0
              const hasData = price != null && price > 0
              const hasBadge = change !== null && change !== 0
              return (
                <div key={symbol} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                  {/* Label */}
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {name}
                  </div>
                  {/* Price */}
                  <div className="font-mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 6, minHeight: 22 }}>
                    {hasData ? formatPrice(price!, currency) : <span style={{ color: 'var(--ink3)', fontSize: 12 }}>loading…</span>}
                  </div>
                  {/* Change badge */}
                  {hasBadge ? (
                    <span className="font-mono" style={{
                      display: 'inline-block',
                      fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                      color: isUp ? 'var(--green)' : 'var(--red)',
                      background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                    }}>
                      {isUp ? '+' : ''}{change!.toFixed(2)}%
                    </span>
                  ) : hasData ? (
                    <span className="font-mono" style={{
                      display: 'inline-block', fontSize: 10.5,
                      padding: '2px 7px', borderRadius: 5,
                      color: 'var(--ink3)', background: 'var(--surface)',
                    }}>— 24h</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Charts row 1: Gold (wide) + BTC ─────────────────────────── */}
      <div className="grid-2col" style={{ marginBottom: 16 }}>
        <Card>
          <CardHeader><CardTitle>Gold / XAU</CardTitle></CardHeader>
          {gold
            ? <GoldLive initialPrice={gold.price} initialChange={gold.change24h} />
            : <MissingKey keyName="GOLD_API_KEY" />}
        </Card>

        <Card>
          <CardHeader><CardTitle>Bitcoin / BTC</CardTitle></CardHeader>
          <AssetChart
            symbol="BTC"
            initialPrice={btc?.price}
            initialChange={btc?.change24h}
            initialCurrency="USD"
            initialName="Bitcoin"
          />
        </Card>
      </div>

      {/* ── Charts row 2: ETH · FET ───────────────────────────────────── */}
      <div className="grid-2col" style={{ marginBottom: 16 }}>
        <Card>
          <CardHeader><CardTitle>Ethereum / ETH</CardTitle></CardHeader>
          <AssetChart
            symbol="ETH"
            initialPrice={eth?.price}
            initialChange={eth?.change24h}
            initialCurrency="USD"
            initialName="Ethereum"
          />
        </Card>

        <Card>
          <CardHeader><CardTitle>Fetch.ai / FET</CardTitle></CardHeader>
          <AssetChart
            symbol="FET"
            initialPrice={fet?.price}
            initialChange={fet?.change24h}
            initialCurrency="USD"
            initialName="Fetch.ai"
          />
        </Card>
      </div>

      {/* ── Charts row 3: FX ─────────────────────────────────────────── */}
      <div className="grid-2col" style={{ marginBottom: 16 }}>
        <Card>
          <CardHeader>
            <CardTitle>USD / JPY</CardTitle>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>hourly · no 24h delta</span>
          </CardHeader>
          <AssetChart
            symbol="JPY"
            initialPrice={jpy?.price}
            initialChange={0}
            initialCurrency="JPY"
            initialName="USD / JPY"
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>USD / VND</CardTitle>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>hourly · no 24h delta</span>
          </CardHeader>
          <AssetChart
            symbol="VND"
            initialPrice={vnd?.price}
            initialChange={0}
            initialCurrency="VND"
            initialName="USD / VND"
          />
        </Card>
      </div>

      {/* ── Full watchlist ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Full watchlist</CardTitle>
          {!snapshot && (
            <span style={{ fontSize: 11, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '1px 8px', borderRadius: 20, fontFamily: 'monospace' }}>
              API key missing
            </span>
          )}
        </CardHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 24px' }}>
          {all.length > 0
            ? all.map((a, i) => (
                <div key={a.symbol} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', width: 44, flexShrink: 0 }}>{a.symbol}</span>
                  <span style={{ flex: 1, fontSize: 11.5, color: 'var(--ink2)' }}>{a.name}</span>
                  <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{formatPrice(a.price, a.currency)}</span>
                  {a.change24h !== 0 && (
                    <span className="font-mono" style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 5, minWidth: 50, textAlign: 'right',
                      color: a.change24h >= 0 ? 'var(--green)' : 'var(--red)',
                      background: a.change24h >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                    }}>{formatChange(a.change24h)}</span>
                  )}
                </div>
              ))
            : ['XAU', 'BTC', 'ETH', 'FET', 'SOL', 'BNB'].map(sym => (
                <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', width: 44 }}>{sym}</span>
                  <div className="skeleton" style={{ flex: 1, height: 13 }} />
                </div>
              ))
          }
        </div>
        {!snapshot && (
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 12 }}>
            Add GOLD_API_KEY + COINGECKO_API_KEY to .env.local for live prices
          </div>
        )}
      </Card>
    </div>
  )
}

function MissingKey({ keyName }: { keyName: string }) {
  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ fontSize: 22, opacity: 0.25 }}>◎</div>
      <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.7 }}>
        Add <span className="font-mono" style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>{keyName}</span><br />
        to <span className="font-mono" style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>.env.local</span>
      </div>
    </div>
  )
}
