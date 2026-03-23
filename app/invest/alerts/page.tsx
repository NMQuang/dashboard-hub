// app/invest/alerts/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAlerts } from '@/lib/alert-store'

export const metadata: Metadata = { title: 'Alerts' }
export const dynamic = 'force-dynamic'

const WORKFLOWS = [
  {
    id: 'morning-brief',
    name: 'Morning Market Brief',
    desc: 'Full briefing: Gold, BTC, ETH, FET, JPY, VND',
    schedule: 'Daily 07:00 JST / 05:00 ICT',
    cron: '0 22 * * *',
    endpoint: '/api/cron/morning-brief',
    envKey: 'DIFY_MORNING_BRIEF_WORKFLOW_ID',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    icon: '☀',
    disabled: false,
  },
  {
    id: 'gold-alert',
    name: 'Gold Price Alert',
    desc: 'Fires when XAU moves ±1.5% between checks',
    schedule: 'Every 30 minutes',
    cron: '0,30 * * * *',
    endpoint: '/api/cron/gold-alert',
    envKey: 'DIFY_GOLD_ALERT_WORKFLOW_ID',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    icon: '◎',
    disabled: false,
  },
  {
    id: 'crypto-digest',
    name: 'Crypto Daily Digest',
    desc: 'BTC, ETH, FET — prices + 24h change',
    schedule: 'Daily 08:00 JST / 06:00 ICT',
    cron: '0 23 * * *',
    endpoint: '/api/cron/crypto-digest',
    envKey: 'DIFY_CRYPTO_DIGEST_WORKFLOW_ID',
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    icon: '◈',
    disabled: true,
  },
  {
    id: 'fx-digest',
    name: 'JPY / VND Weekly Digest',
    desc: 'USD/JPY and USD/VND weekly summary',
    schedule: 'Every Monday 09:00 JST / 07:00 ICT',
    cron: '0 0 * * 1',
    endpoint: '/api/cron/fx-digest',
    envKey: 'DIFY_FX_DIGEST_WORKFLOW_ID',
    color: 'var(--purple)',
    bg: 'var(--purple-bg)',
    icon: '¥',
    disabled: true,
  },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function AlertsPage() {
  const alerts = await getAlerts()
  const isDifyConfigured = !!(
    process.env.DIFY_API_KEY &&
    process.env.DIFY_MORNING_BRIEF_WORKFLOW_ID
  )

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>invest / alerts</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', margin: 0 }}>
            Alerts <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Dify Workflows</span>
          </h1>
          {!isDifyConfigured && (
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '1px 8px', borderRadius: 20 }}>
              setup required
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink3)', marginTop: 6, lineHeight: 1.6 }}>
          Emails sent to <span className="font-mono" style={{ color: 'var(--ink)' }}>quangnmjp96@gmail.com</span>
        </p>
      </div>

      {/* Workflow cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
        {WORKFLOWS.map(wf => {
          const lastAlert = alerts.find(a => a.action === wf.id)
          const isConfigured = !wf.disabled && isDifyConfigured && !!(process.env as Record<string,string>)[wf.envKey]
          return (
            <Card key={wf.id} style={{ opacity: wf.disabled ? 0.45 : 1, pointerEvents: wf.disabled ? 'none' : undefined }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{wf.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{wf.schedule}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace',
                  background: wf.disabled ? 'var(--surface2)' : isConfigured ? 'var(--green-bg)' : 'var(--surface2)',
                  color: wf.disabled ? 'var(--ink3)' : isConfigured ? 'var(--green)' : 'var(--ink3)',
                }}>
                  {wf.disabled ? 'coming soon' : isConfigured ? 'active' : 'setup'}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>{wf.desc}</div>

              {!wf.disabled && (lastAlert ? (
                <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 7, marginBottom: 10 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{lastAlert.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8 }}>{lastAlert.summary}</div>
                  {lastAlert.outputs && (
                    <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 6, fontSize: 11, color: 'var(--ink2)', fontFamily: 'system-ui, sans-serif', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>
                      {typeof lastAlert.outputs?.text === 'string' ? lastAlert.outputs.text : JSON.stringify(lastAlert.outputs, null, 2)}
                    </div>
                  )}
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 8 }}>{timeAgo(lastAlert.triggeredAt)}</div>
                </div>
              ) : (
                <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 7, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>No alerts fired yet</div>
                </div>
              ))}

              {!wf.disabled && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', flex: 1 }}>cron: {wf.cron}</span>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Setup guide */}
      {!isDifyConfigured && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader><CardTitle>Setup Guide</CardTitle></CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '01', title: 'Create Dify account', desc: 'Go to app.dify.ai → Sign up → Create new app (type: Workflow)' },
              { step: '02', title: 'Build each workflow', desc: 'Create 4 workflows matching the table below. Each should have an HTTP node fetching prices, an LLM node generating the brief, and an Email node sending to Gmail.' },
              { step: '03', title: 'Add Gmail node', desc: 'In Dify: add "Email" tool node → use input variable recipient_email = quangnmjp96@gmail.com · Or use Resend/SendGrid integration instead.' },
              { step: '04', title: 'Add env vars', desc: 'Copy each Workflow ID from Dify URL and add to .env.local (see table below)' },
              { step: '05', title: 'Deploy to Vercel', desc: 'Push to GitHub → Vercel auto-deploys. Crons start automatically on Vercel Pro (free tier: manual trigger only).' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 14 }}>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)', flexShrink: 0, marginTop: 1 }}>{s.step}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}


      {/* Alert history */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Alert history</CardTitle></CardHeader>
          {alerts.slice(0, 20).map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < Math.min(19, alerts.length - 1) ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
              <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', minWidth: 80, flexShrink: 0, marginTop: 2 }}>{timeAgo(a.triggeredAt)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink2)' }}>{a.summary}</div>
                {a.outputs && (
                  <div style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: 8, marginTop: 8, fontSize: 12, color: 'var(--ink)', fontFamily: 'system-ui, sans-serif', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                    {typeof a.outputs?.text === 'string' ? a.outputs.text : JSON.stringify(a.outputs, null, 2)}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace', flexShrink: 0, marginTop: 2,
                background: a.emailSent ? 'var(--green-bg)' : 'var(--surface2)',
                color: a.emailSent ? 'var(--green)' : 'var(--ink3)',
              }}>
                {a.emailSent ? '✓ sent' : 'local'}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
