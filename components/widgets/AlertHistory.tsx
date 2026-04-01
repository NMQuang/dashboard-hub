'use client'

import { useState } from 'react'
import type { AlertRecord } from '@/lib/alert-store'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ACTION_ICON: Record<string, string> = {
  'morning-brief': '☀',
  'gold-alert':    '◎',
  'crypto-digest': '◈',
  'fx-digest':     '¥',
}

const ACTION_COLOR: Record<string, string> = {
  'morning-brief': 'var(--amber)',
  'gold-alert':    'var(--green)',
  'crypto-digest': 'var(--blue)',
  'fx-digest':     'var(--purple)',
}

export default function AlertHistory({ alerts }: { alerts: AlertRecord[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (alerts.length === 0) return null

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14,
      background: 'var(--surface)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Alert history</span>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
          {alerts.length} record{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {alerts.slice(0, 20).map((a, i) => {
        const isOpen = openId === a.id
        const icon = ACTION_ICON[a.action] ?? '●'
        const color = ACTION_COLOR[a.action] ?? 'var(--ink3)'
        const isLast = i === Math.min(19, alerts.length - 1)

        const outputText = a.outputs
          ? (typeof a.outputs?.text === 'string' ? a.outputs.text : JSON.stringify(a.outputs, null, 2))
          : null

        return (
          <div key={a.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
            {/* Row — clickable */}
            <button
              onClick={() => setOpenId(isOpen ? null : a.id)}
              style={{
                width: '100%', display: 'flex', gap: 12, padding: '12px 20px',
                alignItems: 'center', background: isOpen ? 'var(--surface2)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
              onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Icon */}
              <span style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                fontSize: 14, color,
              }}>
                {icon}
              </span>

              {/* Time */}
              <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', minWidth: 64, flexShrink: 0 }}>
                {timeAgo(a.triggeredAt)}
              </span>

              {/* Title + summary */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.summary}
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace', flexShrink: 0,
                background: a.emailSent ? 'var(--green-bg)' : 'var(--surface2)',
                color: a.emailSent ? 'var(--green)' : 'var(--ink3)',
              }}>
                {a.emailSent ? '✓ sent' : 'local'}
              </span>

              {/* Chevron */}
              <span style={{
                fontSize: 10, color: 'var(--ink3)', flexShrink: 0,
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: 4,
              }}>▾</span>
            </button>

            {/* Detail panel */}
            {isOpen && (
              <div style={{
                padding: '0 20px 16px 20px',
                background: 'var(--surface2)',
                borderTop: '1px solid var(--border)',
              }}>
                {/* Meta */}
                <div style={{ display: 'flex', gap: 16, padding: '10px 0 12px', flexWrap: 'wrap' }}>
                  <div>
                    <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Workflow</div>
                    <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)' }}>{a.action}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Triggered</div>
                    <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)' }}>
                      {new Date(a.triggeredAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  {a.runId && (
                    <div>
                      <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Run ID</div>
                      <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)' }}>{a.runId}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Email</div>
                    <div className="font-mono" style={{ fontSize: 11.5, color: a.emailSent ? 'var(--green)' : 'var(--ink3)' }}>
                      {a.emailSent ? 'Sent ✓' : 'Not sent'}
                    </div>
                  </div>
                </div>

                {/* Output text */}
                {outputText && (
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '12px 14px',
                    fontSize: 12, color: 'var(--ink)', lineHeight: 1.7,
                    fontFamily: 'system-ui, sans-serif',
                    whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto',
                  }}>
                    {outputText}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
