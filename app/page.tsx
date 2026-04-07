import { Card, CardHeader, CardTitle, CardAction, SectionLabel } from '@/components/ui/Card'
import HomeClient from '@/components/widgets/HomeClient'
import NavShortcuts from '@/components/widgets/NavShortcuts'
import { formatPrice, formatChange, daysUntil } from '@/lib/utils'
import { DEFAULT_WATCHLIST } from '@/lib/constants'
import { fetchMarketSnapshot } from '@/services/market'
import { fetchUserEvents } from '@/services/github'
import { fetchWeather } from '@/services/weather'
import { fetchTechNews } from '@/services/techNews'
import type { GithubEvent, WeatherData } from '@/types'
import type { TechNewsItem } from '@/services/techNews'

export const revalidate = 1800

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'NMQuang'

const NAV_ITEMS = [
  { href: '/learn/japanese', icon: '日', label: 'Japanese', desc: 'AI chat · shadowing · N2', color: '#edfaf4' },
  { href: '/learn/mainframe', icon: '⬛', label: 'Mainframe', desc: 'COBOL · JCL · IBM docs', color: '#f0f0ed' },
  { href: '/learn/ai-dev', icon: '◈', label: 'AI / Dev', desc: 'Dify · AWS · Claude', color: '#f2f0fd' },
  { href: '/work/tools', icon: '⚙', label: 'Tools', desc: 'Web3 · Analytics', color: '#f5f4f2' },
  { href: '/work/ai-hub', icon: '◎', label: 'AI Hub', desc: 'Claude · GPT · Gemini', color: '#f0f5fd' },
  { href: '/work/projects', icon: '⌥', label: 'Projects', desc: 'web3 · ai · aws · ibm · dify', color: '#f0f5fd' },
  { href: '/work/accounts', icon: '👤', label: 'Accounts', desc: 'Dify · Vercel · Udemy', color: '#f0f5fd' },
  { href: '/invest/market', icon: '◎', label: 'Market', desc: 'Gold · BTC · ETH · SOL', color: '#fdf8ed' },
  { href: '/invest/alerts', icon: '◉', label: 'Alerts', desc: 'Dify daily report', color: '#fdf8ed' },
]

// ── Data fetching ─────────────────────────────────────────────────────────────
async function getPageData() {
  const [market, events, weather, news] = await Promise.allSettled([
    fetchMarketSnapshot(DEFAULT_WATCHLIST),
    fetchUserEvents(GITHUB_USERNAME),
    fetchWeather(),
    fetchTechNews(8),
  ])

  return {
    market: market.status === 'fulfilled' ? market.value : null,
    events: events.status === 'fulfilled' ? events.value : [],
    weather: weather.status === 'fulfilled' ? weather.value : { tokyo: null, hcmc: null },
    news: news.status === 'fulfilled' ? news.value : [],
  }
}

export default async function HomePage() {
  const { market, events, weather, news } = await getPageData()
  const onsiteDate = process.env.NEXT_PUBLIC_ONSITE_DATE ?? '2025-07-01'
  const daysLeft = daysUntil(onsiteDate)

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>

      <HomeClient daysLeft={daysLeft} onsiteDate={onsiteDate} />

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
              {market.vnGold?.slice(0, 2).map((g) => (
                <MarketRow
                  key={g.key}
                  symbol={g.key === 'mieng' ? 'BTMC' : 'NHAN'}
                  name={g.key === 'mieng' ? 'Vàng Miếng' : 'Vàng Nhẫn'}
                  price={g.sell > 0 ? g.sell : undefined}
                  change={g.change24h}
                  currency="VND"
                />
              ))}
              {market.coins?.slice(0, 3).map((c) => (
                <MarketRow key={c.symbol} symbol={c.symbol} name={c.name} price={c.price} change={c.change24h} currency="USD" />
              ))}
              {market.forex?.map((f) => (
                <MarketRow key={f.symbol} symbol={f.symbol} name={f.name} price={f.price} change={f.change24h} currency={f.currency} />
              ))}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 28 }} />
              ))}
            </div>
          )}
          <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            CoinGecko · GoldAPI · BTMC · refreshes every 30min
          </div>
        </Card>

        <WeatherCard weather={weather} daysLeft={daysLeft} onsiteDate={onsiteDate} />
      </div>

      {/* GitHub activity + Today's focus */}
      <div className="grid-2col">
        <Card>
          <CardHeader>
            <CardTitle>GitHub activity</CardTitle>
            <CardAction href={`https://github.com/${GITHUB_USERNAME}`}>Open →</CardAction>
          </CardHeader>
          <GitHubActivity events={events} username={GITHUB_USERNAME} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s focus</CardTitle>
            <CardAction href="https://news.ycombinator.com" >HN →</CardAction>
          </CardHeader>
          <TechNewsFeed news={news} />
        </Card>
      </div>

    </div>
  )
}

// ── Market row ────────────────────────────────────────────────────────────────

function MarketRow({ symbol, name, price, change, currency }: {
  symbol: string; name: string; price?: number; change?: number; currency: string
}) {
  const up = (change ?? 0) >= 0
  const priceStr = price != null
    ? currency === 'VND'
      ? (price / 1_000_000).toFixed(1) + 'M ₫'
      : formatPrice(price, currency)
    : '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="font-mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', width: 44, flexShrink: 0 }}>{symbol}</span>
      <span style={{ fontSize: 12, color: 'var(--ink2)', flex: 1 }}>{name}</span>
      <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{priceStr}</span>
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

// ── Weather card ──────────────────────────────────────────────────────────────

function WeatherCard({
  weather,
  daysLeft,
  onsiteDate,
}: {
  weather: { tokyo: WeatherData | null; hcmc: WeatherData | null }
  daysLeft: number
  onsiteDate: string
}) {
  const hasKey = !!(process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== 'your_openweathermap_key_here')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather</CardTitle>
        {!hasKey && (
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)' }}>add WEATHER_API_KEY</span>
        )}
      </CardHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <CityWeather
          city="Tokyo"
          flag="🇯🇵"
          data={weather.tokyo}
          placeholder={!hasKey}
        />
        <CityWeather
          city="Ho Chi Minh"
          flag="🇻🇳"
          data={weather.hcmc}
          placeholder={!hasKey}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink2)', marginBottom: 8, fontWeight: 500 }}>Onsite countdown</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="font-mono" style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--ink)' }}>{daysLeft}</span>
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>days until Japan ({new Date(onsiteDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</span>
        </div>
        <div style={{ marginTop: 8, height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: '35%', transition: 'width 0.6s ease' }} />
        </div>
        <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 4 }}>Prep progress</div>
      </div>
    </Card>
  )
}

function CityWeather({ city, flag, data, placeholder }: {
  city: string; flag: string; data: WeatherData | null; placeholder: boolean
}) {
  const temp = data ? `${data.temp}°` : placeholder ? '—' : '—'
  const desc = data
    ? data.description.charAt(0).toUpperCase() + data.description.slice(1)
    : placeholder ? 'No API key' : 'Unavailable'
  const humidity = data ? `${data.humidity}%` : '—'
  const wind = data ? `${data.wind_speed}m/s` : '—'

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

// ── GitHub activity ───────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; color: string; msgFn: (p: GithubEvent['payload']) => string }> = {
  PushEvent: {
    label: 'push',
    color: 'var(--green)',
    msgFn: (p) => p.commits?.[0]?.message?.split('\n')[0] ?? 'pushed commits',
  },
  CreateEvent: {
    label: 'create',
    color: 'var(--blue)',
    msgFn: (p) => p.ref ? `branch: ${p.ref}` : 'created repository',
  },
  PullRequestEvent: {
    label: 'PR',
    color: '#8b5cf6',
    msgFn: (p) => p.pull_request ? `PR #${p.pull_request.number}: ${p.pull_request.title}` : 'pull request',
  },
  DeleteEvent: {
    label: 'delete',
    color: 'var(--red)',
    msgFn: (p) => p.ref ? `deleted: ${p.ref}` : 'deleted',
  },
  IssuesEvent: {
    label: 'issue',
    color: 'var(--amber)',
    msgFn: () => 'issue activity',
  },
  WatchEvent: {
    label: 'star',
    color: '#f59e0b',
    msgFn: () => 'starred',
  },
  ForkEvent: {
    label: 'fork',
    color: 'var(--ink3)',
    msgFn: () => 'forked',
  },
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / (1000 * 60 * 60))
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function GitHubActivity({ events, username }: { events: GithubEvent[]; username: string }) {
  const visible = events
    .filter((e) => e.type in EVENT_META)
    .slice(0, 6)

  if (visible.length === 0) {
    return (
      <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)', padding: '12px 0' }}>
        No recent events — check GITHUB_TOKEN in .env.local
      </div>
    )
  }

  return (
    <>
      {visible.map((e, i) => {
        const meta = EVENT_META[e.type]
        const repoName = e.repo.name.replace(`${username}/`, '')
        const msg = meta.msgFn(e.payload)
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {repoName}
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 6, fontWeight: 400 }}>{meta.label}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg}</div>
            </div>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', flexShrink: 0 }}>{relTime(e.created_at)}</span>
          </div>
        )
      })}
      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        github.com/{username} · live
      </div>
    </>
  )
}

// ── Tech news feed ────────────────────────────────────────────────────────────

const AI_KW = ['claude', 'anthropic', 'openai', 'gpt', 'llm', 'gemini', 'mistral', 'llama', 'deepseek', 'agent', 'ai ']

function isAiBadge(title: string): string | null {
  const lower = title.toLowerCase()
  if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude'
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('gpt')) return 'OpenAI'
  if (lower.includes('gemini')) return 'Gemini'
  if (lower.includes('llm') || lower.includes('llama') || lower.includes('mistral') || lower.includes('deepseek')) return 'LLM'
  if (AI_KW.some((k) => lower.includes(k))) return 'AI'
  return null
}

function TechNewsFeed({ news }: { news: (TechNewsItem & { timeAgo: string })[] }) {
  if (news.length === 0) {
    return (
      <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)', padding: '12px 0' }}>
        Loading Hacker News…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {news.map((item, i) => {
        const badge = isAiBadge(item.title)
        return (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 0',
            borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', flexShrink: 0, paddingTop: 2, width: 18 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}
              >
                {item.title}
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                {badge && (
                  <span className="font-mono" style={{
                    fontSize: 9.5, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                    color: badge === 'Claude' || badge === 'AI' || badge === 'LLM' ? 'var(--blue)' : 'var(--ink3)',
                    background: badge === 'Claude' || badge === 'AI' || badge === 'LLM' ? 'var(--blue-bg, #eff6ff)' : 'var(--surface2)',
                    textTransform: 'uppercase',
                  }}>
                    {badge}
                  </span>
                )}
                <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                  ▲{item.score} · {item.timeAgo}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        Hacker News top stories · AI/dev filtered · 30min cache
      </div>
    </div>
  )
}
