// app/work/tools/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
export const metadata: Metadata = { title: 'Tools' }

const TOOLS = [
  { label: 'Web3 DApp',        desc: 'Wallet connect, contract interaction',    icon: '\u25C8', color: '#f2f0fd', href: '#' },
  { label: 'COBOL Analyzer',   desc: 'Paste & analyze COBOL source code',       icon: '\u2B1B', color: '#f0f0ed', href: '/learn/mainframe' },
  { label: 'Analytics',        desc: 'Data visualization & analysis',            icon: '\u25CE', color: '#f0f5fd', href: '#' },
  { label: 'Market Dashboard', desc: 'Gold & crypto real-time prices',           icon: '\u25CE', color: '#fdf8ed', href: '/invest/market' },
  { label: 'AI Hub',           desc: 'Claude · GPT · Gemini chat',               icon: '\u25CE', color: '#f0f5fd', href: '/work/ai-hub' },
  { label: 'Dify Workflows',   desc: 'Trigger daily reports & price alerts',     icon: '\u25C9', color: '#fdf8ed', href: '/invest/alerts' },
]

export default function ToolsPage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>work / tools</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Tools <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Quick access</span>
        </h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {TOOLS.map(t => (
          <Link key={t.label} href={t.href} style={{ textDecoration: 'none' }}>
            <Card style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                }}>
                  {t.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{t.label}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5 }}>{t.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
