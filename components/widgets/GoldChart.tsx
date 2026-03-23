'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'

interface GoldChartProps {
  currentPrice: number
  change24h: number  // percentage
}

// Build a plausible intraday series from the current price + 24h change
function buildSeries(price: number, change24h: number) {
  const points = 24
  const open = price / (1 + change24h / 100)
  const result = []
  for (let i = 0; i <= points; i++) {
    const progress = i / points
    // smooth trend + small noise
    const trend = open + (price - open) * progress
    const noise = (Math.sin(i * 2.3) * 0.0015 + Math.cos(i * 1.7) * 0.001) * open
    const val = trend + noise
    const hh = String(i).padStart(2, '0')
    result.push({ time: `${hh}:00`, price: parseFloat(val.toFixed(2)) })
  }
  return result
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--ink3)', fontFamily: 'monospace', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: 'monospace' }}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

export default function GoldChart({ currentPrice, change24h }: GoldChartProps) {
  const data = buildSeries(currentPrice, change24h)
  const isUp = change24h >= 0
  const color = isUp ? 'var(--green)' : 'var(--red)'
  const open = data[0].price
  const min = Math.min(...data.map(d => d.price))
  const max = Math.max(...data.map(d => d.price))
  const pad = (max - min) * 0.1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="font-mono" style={{
          fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
          color: isUp ? 'var(--green)' : 'var(--red)',
          background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
        }}>
          {isUp ? '+' : ''}{change24h.toFixed(2)}%
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--ink3)' }}>24h</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--ink3)', fontFamily: 'monospace' }}
            axisLine={false} tickLine={false}
            interval={5}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 10, fill: 'var(--ink3)', fontFamily: 'monospace' }}
            axisLine={false} tickLine={false} width={68}
            tickFormatter={v => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={open} stroke="var(--border2)" strokeDasharray="4 4" />
          <Line
            type="monotone" dataKey="price"
            stroke={color} strokeWidth={1.8}
            dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 8 }}>
        Open ${open.toLocaleString('en-US', { minimumFractionDigits: 2 })} · via GoldAPI.io · simulated intraday curve
      </div>
    </div>
  )
}
