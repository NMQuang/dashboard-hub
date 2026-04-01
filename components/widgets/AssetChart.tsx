'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────
interface AssetPrice {
  symbol: string; price: number; change24h: number; currency: string; name: string
}
interface MarketSnapshot {
  gold?: AssetPrice; coins?: AssetPrice[]; forex?: AssetPrice[]
}
interface HistoryPoint { time: string; price: number }

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; currency: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const fmt = currency === 'USD'
    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: val < 1 ? 6 : 2 })}`
    : `${val.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '7px 11px', fontSize: 11.5,
    }}>
      <div className="font-mono" style={{ color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
      <div className="font-mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{fmt}</div>
    </div>
  )
}

// ── Price formatter ──────────────────────────────────────────────────────────
function fmt(price: number, currency: string) {
  if (currency === 'USD') {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1)    return `$${price.toFixed(4)}`
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${price.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

function fmtAxis(price: number, currency: string) {
  if (currency === 'USD') {
    if (price > 1000) return `$${(price / 1000).toFixed(1)}k`
    if (price < 1)    return `$${price.toFixed(3)}`
    return `$${price.toFixed(0)}`
  }
  if (currency === 'VND') return `${(price / 1000).toFixed(0)}k`
  return price.toFixed(2)
}

// ── AssetChart ───────────────────────────────────────────────────────────────
interface AssetChartProps {
  /** The symbol key as returned by /api/prices: 'BTC', 'ETH', 'FET', 'JPY', 'VND' */
  symbol: string
  /** Initial price from SSR — displayed instantly, avoids empty state on load */
  initialPrice?: number
  initialChange?: number
  initialCurrency?: string
  initialName?: string
}

export default function AssetChart({
  symbol, initialPrice, initialChange, initialCurrency = 'USD', initialName,
}: AssetChartProps) {
  const { data, isLoading, error } = useSWR<MarketSnapshot>(
    `/api/prices?symbols=${symbol}`,
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: true }
  )

  // Resolve current values from SWR or initial props
  const all = [data?.gold, ...(data?.coins ?? []), ...(data?.forex ?? [])].filter(Boolean) as AssetPrice[]
  const asset = all.find(a => a.symbol === symbol)

  const price    = asset?.price    ?? initialPrice
  const change   = asset?.change24h ?? initialChange ?? 0
  const currency = asset?.currency  ?? initialCurrency
  const name     = asset?.name      ?? initialName ?? symbol
  const isUp     = change >= 0

  // Accumulate real price history
  const historyRef = useRef<HistoryPoint[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [chartTimedOut, setChartTimedOut] = useState(false)

  // After 3 min with < 2 points → show empty state
  useEffect(() => {
    const t = setTimeout(() => {
      if (historyRef.current.length < 2) setChartTimedOut(true)
    }, 3 * 60 * 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!price) return
    const now = new Date()
    const label = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const last = historyRef.current.at(-1)
    if (last?.time === label) {
      historyRef.current = [...historyRef.current.slice(0, -1), { time: label, price }]
    } else {
      historyRef.current = [...historyRef.current, { time: label, price }]
    }
    if (historyRef.current.length > 60) historyRef.current = historyRef.current.slice(-60)
    setHistory([...historyRef.current])
    // Clear timeout flag once we have data
    if (historyRef.current.length >= 2) setChartTimedOut(false)
  }, [price])

  // Chart domain
  const prices = history.map(p => p.price)
  const min = prices.length ? Math.min(...prices) : (price ?? 0) * 0.998
  const max = prices.length ? Math.max(...prices) : (price ?? 0) * 1.002
  const pad = (max - min) * 0.15 || price! * 0.001 || 0.001

  const lineColor = isUp ? 'var(--green)' : 'var(--red)'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="dot-live"
            style={{ width: 6, height: 6, borderRadius: '50%', background: error ? 'var(--red)' : 'var(--green)', display: 'inline-block', flexShrink: 0 }}
          />
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.06em' }}>
            {name}
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 10.5, color: isLoading ? 'var(--amber)' : 'var(--ink3)' }}>
          {isLoading ? 'updating…' : error ? 'error' : 'live · 5 min'}
        </span>
      </div>

      {/* Price */}
      {price ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {fmt(price, currency)}
          </span>
          {change !== 0 && (
            <span className="font-mono" style={{
              fontSize: 11.5, fontWeight: 500, padding: '2px 7px', borderRadius: 6,
              color: isUp ? 'var(--green)' : 'var(--red)',
              background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
            }}>
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          )}
        </div>
      ) : (
        <div className="skeleton" style={{ width: 140, height: 28, marginBottom: 12 }} />
      )}

      {/* Chart */}
      {history.length >= 2 ? (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={history} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: 'var(--ink3)', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fontSize: 9, fill: 'var(--ink3)', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false} width={56}
              tickFormatter={v => fmtAxis(v, currency)}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Line
              type="monotone" dataKey="price" isAnimationActive={false}
              stroke={lineColor} strokeWidth={1.8}
              dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : chartTimedOut ? (
        <div style={{
          width: '100%', height: 130, borderRadius: 6,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          border: '1px dashed var(--border)', background: 'var(--surface2)',
        }}>
          <span style={{ fontSize: 20, opacity: 0.3 }}>◎</span>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>No chart data</span>
        </div>
      ) : (
        <div className="skeleton" style={{ width: '100%', height: 130, borderRadius: 6 }} />
      )}
    </div>
  )
}
