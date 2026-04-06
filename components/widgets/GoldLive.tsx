'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { formatPrice, formatChange } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AssetPrice { symbol: string; price: number; change24h: number; currency: string }
interface MarketSnapshot { gold?: AssetPrice }
interface HistoryPoint { time: string; price: number }

// ── Fetcher for SWR ──────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div className="font-mono" style={{ color: 'var(--ink3)', marginBottom: 2 }}>{label}</div>
      <div className="font-mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GoldLive({
  initialPrice,
  initialChange,
}: {
  initialPrice?: number
  initialChange?: number
}) {
  // Poll every 60 s — GoldAPI updates are near-real-time on paid tiers,
  // 30-min cache on free tier. 60s is a reasonable default.
  const { data, isLoading, error } = useSWR<MarketSnapshot>(
    '/api/prices?symbols=XAU',
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: true }
  )

  const gold = data?.gold

  // Price accumulation — builds a real history over the session
  const historyRef = useRef<HistoryPoint[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const firstPrice = useRef<number | null>(null)

  useEffect(() => {
    const price = gold?.price ?? initialPrice
    if (!price) return
    if (firstPrice.current === null) firstPrice.current = price

    const now = new Date()
    const label = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    // Avoid duplicate timestamps
    const last = historyRef.current.at(-1)
    if (last?.time === label) {
      // Update last point in place
      historyRef.current = [...historyRef.current.slice(0, -1), { time: label, price }]
    } else {
      historyRef.current = [...historyRef.current, { time: label, price }]
    }
    // Keep last 60 data points
    if (historyRef.current.length > 60) {
      historyRef.current = historyRef.current.slice(-60)
    }
    setHistory([...historyRef.current])
  }, [gold?.price, initialPrice])

  const price = gold?.price ?? initialPrice
  const change = gold?.change24h ?? initialChange
  const isUp = (change ?? 0) >= 0

  // Chart domain padding
  const prices = history.map(p => p.price)
  const min = prices.length ? Math.min(...prices) : (price ?? 0) * 0.999
  const max = prices.length ? Math.max(...prices) : (price ?? 0) * 1.001
  const pad = (max - min) * 0.15 || 1
  const openRef = firstPrice.current

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Live dot */}
        <span
          className="dot-live"
          style={{ width: 7, height: 7, borderRadius: '50%', background: error ? 'var(--red)' : 'var(--green)', display: 'inline-block', flexShrink: 0 }}
        />

        {/* Price */}
        {price ? (
          <span className="font-mono" style={{ fontSize: 30, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
            {formatPrice(price, 'USD')}
          </span>
        ) : (
          <div className="skeleton" style={{ width: 160, height: 36 }} />
        )}

        {/* Change badge */}
        {change !== undefined ? (
          <span className="font-mono" style={{
            fontSize: 12.5, fontWeight: 500, padding: '3px 10px', borderRadius: 7,
            color: isUp ? 'var(--green)' : 'var(--red)',
            background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
          }}>
            {isUp ? '+' : ''}{change.toFixed(2)}% 24h
          </span>
        ) : null}

        {/* Refresh indicator */}
        <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: isLoading ? 'var(--amber)' : 'var(--ink3)' }}>
          {isLoading ? 'refreshing…' : error ? 'fetch error' : `${history.length} pt${history.length !== 1 ? 's' : ''} · live`}
        </span>
      </div>

      {/* Chart */}
      {history.length >= 2 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--ink3)', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fontSize: 10, fill: 'var(--ink3)', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false} width={72}
              tickFormatter={v => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {openRef && <ReferenceLine y={openRef} stroke="var(--border2)" strokeDasharray="4 4" />}
            <Line
              type="monotone" dataKey="price" isAnimationActive={false}
              stroke={isUp ? 'var(--green)' : 'var(--red)'} strokeWidth={2}
              dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: isUp ? 'var(--green)' : 'var(--red)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        /* Waiting for second poll */
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>
            Building chart · refreshes every 5 min
          </div>
        </div>
      )}

      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
        <span>XAU/USD · via GoldAPI.io</span>
        <span>auto-refresh · 5 min</span>
      </div>
    </div>
  )
}
