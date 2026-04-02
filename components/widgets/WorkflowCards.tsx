'use client'

import { useState } from 'react'
import type { WorkflowOverride } from '@/lib/workflow-store'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface WorkflowDef {
  id: string
  name: string
  desc: string
  schedule: string
  cron: string
  endpoint: string
  envKey: string
  color: string
  bg: string
  icon: string
  disabled: boolean
}

interface AlertRecord {
  id: string
  action: string
  title: string
  summary: string
  triggeredAt: string
  emailSent: boolean
  outputs?: unknown
}

interface Props {
  defaults: WorkflowDef[]
  overrides: WorkflowOverride[]
  alerts: AlertRecord[]
  isDifyConfigured: boolean
  /** Set of workflow IDs that have their env key configured — computed server-side */
  configuredIds: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function validateCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  return parts.length === 5
}

// ── Input styles ───────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '5px 9px', fontSize: 12,
  color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9.5, color: 'var(--ink3)', fontFamily: 'monospace',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 4,
}

// ── Single card ────────────────────────────────────────────────────────────────
function WorkflowCard({
  wf, lastAlert, isConfigured,
}: {
  wf: WorkflowDef
  lastAlert: AlertRecord | undefined
  isConfigured: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ name: wf.name, desc: wf.desc, schedule: wf.schedule, cron: wf.cron })
  const [live, setLive] = useState({ name: wf.name, desc: wf.desc, schedule: wf.schedule, cron: wf.cron })
  const [cronError, setCronError] = useState('')

  const openEdit = () => {
    setDraft({ ...live })
    setCronError('')
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setCronError('')
  }

  const save = async () => {
    if (!validateCron(draft.cron)) {
      setCronError('Cron phải có đúng 5 phần, ví dụ: 0 22 * * *')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wf.id, ...draft }),
      })
      if (!res.ok) throw new Error(await res.text())
      setLive({ ...draft })
      setEditing(false)
    } catch (e) {
      setCronError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setSaving(true)
    try {
      await fetch('/api/workflows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wf.id }),
      })
      setLive({ name: wf.name, desc: wf.desc, schedule: wf.schedule, cron: wf.cron })
      setDraft({ name: wf.name, desc: wf.desc, schedule: wf.schedule, cron: wf.cron })
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '18px 20px',
      opacity: wf.disabled ? 0.45 : 1,
      pointerEvents: wf.disabled ? 'none' : undefined,
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: wf.disabled ? 'var(--surface2)' : wf.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
          color: wf.disabled ? 'var(--ink3)' : wf.color,
        }}>
          {wf.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{live.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{live.schedule}</div>
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace', flexShrink: 0,
          background: wf.disabled ? 'var(--surface2)' : isConfigured ? 'var(--green-bg)' : 'var(--surface2)',
          color: wf.disabled ? 'var(--ink3)' : isConfigured ? 'var(--green)' : 'var(--ink3)',
        }}>
          {wf.disabled ? 'coming soon' : isConfigured ? 'active' : 'setup'}
        </span>

        {/* Edit button */}
        {!wf.disabled && !editing && (
          <button
            onClick={openEdit}
            title="Edit workflow config"
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--ink3)', flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--border)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
          >
            ✎
          </button>
        )}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>{live.desc}</div>

      {/* ── Edit panel ── */}
      {editing && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 14px 12px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>
            Edit configuration
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Workflow name"
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <input
                style={inputStyle}
                value={draft.desc}
                onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
                placeholder="Short description"
              />
            </div>

            {/* Schedule label */}
            <div>
              <label style={labelStyle}>Schedule label</label>
              <input
                style={inputStyle}
                value={draft.schedule}
                onChange={e => setDraft(d => ({ ...d, schedule: e.target.value }))}
                placeholder="Daily 07:00 JST / 05:00 ICT"
              />
            </div>

            {/* Cron */}
            <div>
              <label style={labelStyle}>Cron expression</label>
              <input
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  borderColor: cronError ? 'var(--red)' : 'var(--border)',
                }}
                value={draft.cron}
                onChange={e => { setDraft(d => ({ ...d, cron: e.target.value })); setCronError('') }}
                placeholder="0 22 * * *"
              />
              {cronError && (
                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{cronError}</div>
              )}
              <div style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 4 }}>
                5 fields: min hour dom month dow — e.g. <span style={{ fontFamily: 'monospace' }}>0 22 * * *</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                background: 'var(--ink)', color: 'var(--bg)', border: 'none',
                borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 500,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              style={{
                background: 'var(--surface)', color: 'var(--ink2)', border: '1px solid var(--border)',
                borderRadius: 7, padding: '6px 14px', fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={reset}
              disabled={saving}
              style={{
                marginLeft: 'auto', background: 'transparent', color: 'var(--ink3)',
                border: 'none', fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Reset to default
            </button>
          </div>
        </div>
      )}

      {/* Last alert preview */}
      {!wf.disabled && (lastAlert ? (
        <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 7, marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{lastAlert.title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: lastAlert.outputs ? 8 : 0 }}>{lastAlert.summary}</div>
          {lastAlert.outputs ? (
            <div style={{
              background: 'var(--surface)', padding: 10, borderRadius: 6,
              fontSize: 11, color: 'var(--ink2)', fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto',
            }}>
              {typeof (lastAlert.outputs as Record<string, unknown>)?.text === 'string'
                ? String((lastAlert.outputs as Record<string, unknown>).text)
                : JSON.stringify(lastAlert.outputs, null, 2)}
            </div>
          ) : null}
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 8 }}>
            {timeAgo(lastAlert.triggeredAt)}
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 7, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>No alerts fired yet</div>
        </div>
      ))}

      {/* Cron display */}
      {!wf.disabled && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', flex: 1 }}>
            cron: {live.cron}
          </span>
        </div>
      )}
    </div>
  )
}

// ── WorkflowCards (exported) ───────────────────────────────────────────────────
export default function WorkflowCards({ defaults, overrides, alerts, isDifyConfigured, configuredIds }: Props) {
  // Merge defaults with persisted overrides
  const workflows: WorkflowDef[] = defaults.map(def => {
    const ov = overrides.find(o => o.id === def.id)
    return ov ? { ...def, ...ov } : def
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
      {workflows.map(wf => {
        const lastAlert = alerts.find(a => a.action === wf.id)
        const isConfigured = !wf.disabled && isDifyConfigured && configuredIds.includes(wf.id)
        return (
          <WorkflowCard
            key={wf.id}
            wf={wf}
            lastAlert={lastAlert}
            isConfigured={isConfigured}
          />
        )
      })}
    </div>
  )
}
