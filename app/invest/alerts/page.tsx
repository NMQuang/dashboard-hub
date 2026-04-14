import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAlerts } from '@/lib/alert-store'
import { getWorkflowOverrides } from '@/lib/workflow-store'
import AlertHistory from '@/components/widgets/AlertHistory'
import WorkflowCards, { type WorkflowDef } from '@/components/widgets/WorkflowCards'

export const metadata: Metadata = { title: 'Alerts' }
export const dynamic = 'force-dynamic'

const WORKFLOW_DEFAULTS: WorkflowDef[] = [
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
    name: 'Báo Giá Vàng Sáng',
    desc: 'Giá vàng trong nước (miếng, nhẫn, SJC) + % thay đổi + tin tức mỗi sáng',
    schedule: 'Daily 07:00 ICT / 00:00 UTC',
    cron: '0 0 * * *',
    endpoint: '/api/cron/gold-alert',
    envKey: 'DIFY_GOLD_ALERT_WORKFLOW_ID',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    icon: '◈',
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

export default async function AlertsPage() {
  const [alerts, overrides] = await Promise.all([
    getAlerts(),
    getWorkflowOverrides(),
  ])

  const isDifyConfigured = !!(
    process.env.DIFY_API_KEY &&
    process.env.DIFY_MORNING_BRIEF_WORKFLOW_ID
  )

  // Compute server-side which workflows have their env key set
  const configuredIds = WORKFLOW_DEFAULTS
    .filter(wf => !wf.disabled && isDifyConfigured && !!(process.env as Record<string, string>)[wf.envKey])
    .map(wf => wf.id)

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
          Emails sent to <span className="font-mono" style={{ color: 'var(--ink)' }}>{process.env.RECIPIENT_EMAIL ?? '(not set)'}</span>
        </p>
      </div>

      {/* Workflow cards — client component with edit mode */}
      <WorkflowCards
        defaults={WORKFLOW_DEFAULTS}
        overrides={overrides}
        alerts={alerts}
        isDifyConfigured={isDifyConfigured}
        configuredIds={configuredIds}
      />

      {/* Setup guide */}
      {!isDifyConfigured && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader><CardTitle>Setup Guide</CardTitle></CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '01', title: 'Create Dify account', desc: 'Go to app.dify.ai → Sign up → Create new app (type: Workflow)' },
              { step: '02', title: 'Build each workflow', desc: 'Create 4 workflows matching the table below. Each should have an HTTP node fetching prices, an LLM node generating the brief, and an Email node sending to Gmail.' },
              { step: '03', title: 'Add Gmail node', desc: 'In Dify: add "Email" tool node → use input variable recipient_email = $RECIPIENT_EMAIL · Or use Resend/SendGrid integration instead.' },
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
      <AlertHistory alerts={alerts} />
    </div>
  )
}
