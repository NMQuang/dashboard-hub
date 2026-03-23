import { Suspense } from 'react'
import { Card, CardHeader, CardTitle, CardAction, SectionLabel } from '@/components/ui/Card'
import HomeClient from '@/components/widgets/HomeClient'
import NavShortcuts from '@/components/widgets/NavShortcuts'
import { formatPrice, formatChange, daysUntil } from '@/lib/utils'
import { DEFAULT_WATCHLIST } from '@/lib/constants'
import { fetchMarketSnapshot } from '@/services/market'

// ISR: revalidate market data every 60 seconds
export const revalidate = 60

const NAV_ITEMS = [
  { href: '/learn/japanese',  icon: '日', label: 'Japanese',  desc: 'AI chat · shadowing · N2',   color: '#edfaf4' },
  { href: '/learn/mainframe', icon: '⬛', label: 'Mainframe', desc: 'COBOL · JCL · IBM docs',      color: '#f0f0ed' },
  { href: '/learn/ai-dev',    icon: '◈',  label: 'AI / Dev',  desc: 'Dify · AWS · Claude',        color: '#f2f0fd' },
  { href: '/work/tools',      icon: '⚙',  label: 'Tools',     desc: 'Web3 · Analytics',           color: '#f5f4f2' },
  { href: '/work/ai-hub',     icon: '◎',  label: 'AI Hub',    desc: 'Claude · GPT · Gemini',      color: '#f0f5fd' },
  { href: '/work/projects',   icon: '⌥',  label: 'Projects',  desc: 'web3 · ai · aws · ibm',      color: '#f0f5fd' },
  { href: '/invest/market',   icon: '◎',  label: 'Market',    desc: 'Gold · BTC · ETH · SOL',     color: '#fdf8ed' },
  { href: '/invest/alerts',   icon: '◉',  label: 'Alerts',    desc: 'Dify daily report',           color: '#fdf8ed' },
]

// Server-side: call service directly — no internal HTTP self-fetch
async function getMarketData() {
  try {
    return await fetchMarketSnapshot(DEFAULT_WATCHLIST)
  } catch {
    return null
  }
}

export default async function HomePage() {
  const market = await getMarketData()
  const onsiteDate = process.env.NEXT_PUBLIC_ONSITE_DATE ?? '2025-07-01'
  const daysLeft = daysUntil(onsiteDate)

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>

      {/* Header — greeting + date handled client-side */}
      <HomeClient daysLeft={daysLeft} onsiteDate={onsiteDate} />

      {/* Quick nav — mouse hover handled in NavShortcuts (client component) */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Sections</SectionLabel>
        <NavShortcuts items={NAV_ITEMS} />
      </div>

      {/* Market + Weather */}
      <div className="grid-2col" style={{ marginBottom: 24 }}>
        <Card>
          <CardHeader>
            <CardTitle>Market snapshot</CardTitle>
            <CardAction href="/invest/market">View all →</CardAction>
          </CardHeader>
          {market ? (
            <>
              <MarketRow symbol="XAU" name="Gold / USD" price={market.gold?.price} change={market.gold?.change24h} currency="USD" />
              {market.coins?.slice(0, 4).map((c) => (
                <MarketRow key={c.symbol} symbol={c.symbol} name={c.name} price={c.price} change={c.change24h} currency="USD" />
              ))}
              {market.forex?.map((f) => (
                <MarketRow key={f.symbol} symbol={f.symbol} name={f.name} price={f.price} change={f.change24h} currency="JPY" />
              ))}
            </>
          ) : (
            <MarketSkeleton />
          )}
          <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            via CoinGecko + GoldAPI · refreshes every 60s
          </div>
        </Card>

        {/* Weather + Countdown */}
        <Suspense fallback={<Card><div className="skeleton" style={{ height: 200 }} /></Card>}>
          <WeatherCard daysLeft={daysLeft} />
        </Suspense>
      </div>

      {/* Activity + Focus */}
      <div className="grid-2col">
        <Card>
          <CardHeader>
            <CardTitle>GitHub activity</CardTitle>
            <CardAction href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`}>Open →</CardAction>
          </CardHeader>
          {/* TODO: replace with real GitHub events feed when GITHUB_TOKEN is configured */}
          <GithubActivityMock />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s focus</CardTitle>
          </CardHeader>
          <FocusBlock color="var(--green)" tag="🇯🇵 Japanese" text="JLPT N2 listening · 30 min shadowing NHK Web Easy" />
          <FocusBlock color="var(--blue)" tag="⬛ Mainframe" text="Study COBOL file I/O · JCL job card structure" />
          <FocusBlock color="var(--amber)" tag="◎ Market" text="Check Dify daily report · Gold trend + BTC weekly close" />
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>Weekly prep progress</div>
            <ProgressBar label="Japanese (N2)" value={57} color="var(--green)" note="4/7 days" />
            <ProgressBar label="COBOL / Mainframe" value={43} color="var(--blue)" note="3/7 days" />
            <ProgressBar label="Market review" value={71} color="var(--amber)" note="5/7 days" />
          </div>
        </Card>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MarketRow({ symbol, name, price, change, currency }: {
  symbol: string; name: string; price?: number; change?: number; currency: string
}) {
  const up = (change ?? 0) >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="font-mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', width: 44, flexShrink: 0 }}>{symbol}</span>
      <span style={{ fontSize: 12, color: 'var(--ink2)', flex: 1 }}>{name}</span>
      <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
        {price != null ? formatPrice(price, currency) : '—'}
      </span>
      {change != null && (
        <span className="font-mono" style={{
          fontSize: 11, fontWeight: 500, minWidth: 52, textAlign: 'right',
          padding: '2px 6px', borderRadius: 5,
          color: up ? 'var(--green)' : 'var(--red)',
          background: up ? 'var(--green-bg)' : 'var(--red-bg)',
        }}>
          {formatChange(change)}
        </span>
      )}
    </div>
  )
}

function MarketSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 28 }} />
      ))}
    </div>
  )
}

function WeatherCard({ daysLeft }: { daysLeft: number }) {
  return (
    <Card>
      <CardHeader><CardTitle>Weather</CardTitle></CardHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <CityWeather city="Tokyo" flag="🇯🇵" temp="—" desc="Loading…" humidity="—" wind="—" />
        <CityWeather city="Ho Chi Minh" flag="🇻🇳" temp="—" desc="Loading…" humidity="—" wind="—" />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink2)', marginBottom: 8, fontWeight: 500 }}>Onsite countdown</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="font-mono" style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--ink)' }}>{daysLeft}</span>
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>days until Japan</span>
        </div>
        <div style={{ marginTop: 8, height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: '35%', transition: 'width 0.6s ease' }} />
        </div>
        <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 4 }}>Prep progress</div>
      </div>
    </Card>
  )
}

function CityWeather({ city, flag, temp, desc, humidity, wind }: {
  city: string; flag: string; temp: string; desc: string; humidity: string; wind: string
}) {
  return (
    <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{city}</span>
        <span style={{ fontSize: 14 }}>{flag}</span>
      </div>
      <div className="font-mono" style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>{temp}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{desc}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>💧 <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{humidity}</span></span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>💨 <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{wind}</span></span>
      </div>
    </div>
  )
}

function FocusBlock({ color, tag, text }: { color: string; tag: string; text: string }) {
  return (
    <div style={{ borderLeft: `2px solid ${color}`, padding: '10px 14px', background: 'var(--surface2)', borderRadius: '0 8px 8px 0', marginBottom: 8 }}>
      <div className="font-mono" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 3 }}>{tag}</div>
      <div style={{ fontSize: 13, color: 'var(--ink)' }}>{text}</div>
    </div>
  )
}

function ProgressBar({ label, value, color, note }: { label: string; value: number; color: string; note: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{note}</span>
      </div>
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 99, width: `${value}%` }} />
      </div>
    </div>
  )
}

// Mock activity feed — replace with real GitHub events when GITHUB_TOKEN is configured
function GithubActivityMock() {
  const events = [
    { type: 'push',   repo: 'web3-dapp',            msg: 'feat: add wallet connect v2',       time: '2h ago',  color: 'var(--green)'  },
    { type: 'create', repo: 'claude-tools',          msg: 'branch: feature/dify-webhook',      time: '5h ago',  color: 'var(--blue)'   },
    { type: 'push',   repo: 'ibm-mainframe-notes',   msg: 'docs: JCL syntax cheatsheet',       time: '1d ago',  color: 'var(--green)'  },
    { type: 'push',   repo: 'aws-infra',             msg: 'chore: lambda runtime node20',      time: '2d ago',  color: 'var(--green)'  },
    { type: 'pr',     repo: 'ai-agents',             msg: 'PR #12: claude tool-use pipeline',  time: '3d ago',  color: '#8b5cf6'       },
  ]
  return (
    <>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.color, marginTop: 5, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>{e.repo}</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.msg}</div>
          </div>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', flexShrink: 0 }}>{e.time}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontFamily: 'monospace' }}>
        Connect GitHub token in .env.local to load real activity
      </div>
    </>
  )
}
