// app/work/accounts/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Accounts' }

interface Account {
  label: string
  desc: string
  url: string
  icon: string
  color: string
}

const ACCOUNTS: Account[] = [
  {
    label: 'Dify',
    desc: 'AI Workflow & Agent Builder',
    url: 'https://cloud.dify.ai/',
    icon: '◉',
    color: '#eef6ff',
  },
  {
    label: 'Vercel',
    desc: 'Deployment & Hosting for Dashboards',
    url: 'https://vercel.com/dashboard',
    icon: '▲',
    color: '#f0f0ed',
  },
  {
    label: 'Udemy',
    desc: 'Online learning and technical courses',
    url: 'https://www.udemy.com/',
    icon: 'ᴜ',
    color: '#fdf8ed',
  },
  {
    label: 'GitHub',
    desc: 'Source code repositories & CI/CD',
    url: 'https://github.com/',
    icon: 'octocat', // Will fall back to character or text
    color: '#f0f5fd',
  },
  {
    label: 'AWS Console',
    desc: 'Cloud Infrastructure & Lambda',
    url: 'https://console.aws.amazon.com/',
    icon: '☁',
    color: '#fffbf0',
  },
  {
    label: 'Anthropic / Claude',
    desc: 'Claude AI API & Console',
    url: 'https://console.anthropic.com/',
    icon: '◈',
    color: '#fdf3f2', // light red/orange tint
  },
  {
    label: 'ChatGPT',
    desc: 'OpenAI Chat & API Console',
    url: 'https://chatgpt.com/',
    icon: '◯',
    color: '#eefcf5', // light green tint
  },
  {
    label: 'Gemini',
    desc: 'Google AI Studio & Chat',
    url: 'https://gemini.google.com/',
    icon: '✨',
    color: '#f0f5fd', // light blue tint
  },
  {
    label: 'Firebase',
    desc: 'Backend as a Service & Database',
    url: 'https://console.firebase.google.com/',
    icon: '🔥',
    color: '#fffbf0', // light amber/yellow tint
  },
]

export default function AccountsPage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>work / accounts</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Accounts <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Important Links & Platforms</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {ACCOUNTS.map((acc) => (
          <Link
            key={acc.label}
            href={acc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: acc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  color: 'var(--ink)'
                }}>
                  {acc.icon === 'octocat' ? <span style={{ fontSize: 20 }}>🐙</span> : acc.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{acc.label}</div>
                  {/* <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', marginTop: 1 }}>↗ opens in new tab</div> */}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5, flex: 1 }}>{acc.desc}</div>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink3)', wordBreak: 'break-all' }}>
                {acc.url.replace(/^https?:\/\//, '')}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
