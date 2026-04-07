// app/work/tools/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import DifyLinkBadges from '@/components/widgets/DifyLinkBadges'
export const metadata: Metadata = { title: 'Tools' }

interface SubLink { label: string; icon: string; href: string }
interface Tool {
  label: string; desc: string; icon: string; color: string
  href: string; external: boolean
  subLinks?: SubLink[]
}

const TOOLS: Tool[] = [
  {
    label: 'Web3 DApp',
    desc: 'Wallet connect, contract interaction',
    icon: '◈', color: '#f2f0fd',
    href: 'https://web3-project-xi-three.vercel.app/',
    external: true,
    subLinks: [
      { label: 'DApp',                icon: '◈', href: 'https://web3-project-xi-three.vercel.app/' },
      { label: 'Staking Voting App',  icon: '◉', href: '#' },
    ],
  },
  {
    label: 'COBOL Analyzer',
    desc: 'Paste & analyze COBOL source code',
    icon: '⬛', color: '#f0f0ed',
    href: '/learn/mainframe',
    external: false,
    subLinks: [
      { label: 'Migration Tool', icon: '⚙', href: 'https://claude-project-frontend.vercel.app/' },
    ],
  },
  { label: 'Analytics',        desc: 'Data visualization & analysis',       icon: '◎', color: '#f0f5fd', href: '#',                 external: false },
  { label: 'Market Dashboard', desc: 'Gold & crypto real-time prices',      icon: '◎', color: '#fdf8ed', href: '/invest/market',    external: false },
  { label: 'AI Hub',           desc: 'Claude · GPT · Gemini chat',         icon: '◎', color: '#f0f5fd', href: '/work/ai-hub',      external: false },
  {
    label: 'Dify Workflows',
    desc: 'Trigger daily reports & price alerts',
    icon: '◉', color: '#fdf8ed',
    href: '/invest/alerts',
    external: false,
    subLinks: [
      { label: 'Morning Brief', icon: '☀', href: 'https://cloud.dify.ai/app/3d242c17-3120-4833-a343-e68576605210/workflow' },
      { label: 'Gold Alert',    icon: '◎', href: 'https://cloud.dify.ai/app/71b4d553-a466-4690-90de-1a059b16cd50/workflow' },
      { label: 'Gold Alert VN', icon: '◈', href: 'https://cloud.dify.ai/app/b93b7659-b8ed-4ef1-bcf1-493d6c6a2b83/workflow' },
    ],
  },
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
        {TOOLS.map(t => {
          const cardContent = (
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                }}>
                  {t.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{t.label}</div>
                  {t.external && !t.subLinks && (
                    <div className="font-mono" style={{ fontSize: 9.5, color: 'var(--ink3)', marginTop: 1 }}>↗ external</div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5, flex: 1 }}>{t.desc}</div>

              {/* Sub-links */}
              {t.subLinks && (
                <DifyLinkBadges links={t.subLinks} />
              )}
            </Card>
          )

          // Cards will now be wrapped in <Link> properly since subLinks no longer use <a> tags.

          return (
            <Link
              key={t.label}
              href={t.href}
              style={{ textDecoration: 'none' }}
              {...(t.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {cardContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
