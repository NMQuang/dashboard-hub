import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
import { timeAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'AI / Dev' }

const OFFICIAL_DOCS = [
  { tag: 'Dify',   label: 'Dify Docs',               desc: 'Build AI pipelines',             url: 'https://docs.dify.ai' },
  { tag: 'AWS',    label: 'AWS Documentation',       desc: 'Serverless & Cloud',             url: 'https://docs.aws.amazon.com' },
  { tag: 'Claude', label: 'Anthropic Docs',          desc: 'Tool use, API specs',            url: 'https://docs.anthropic.com' },
  { tag: 'n8n',    label: 'n8n Docs',                desc: 'Workflow automation',            url: 'https://docs.n8n.io' },
  { tag: 'Web3',   label: 'Ethereum Developers',     desc: 'Smart contracts, Web3',          url: 'https://ethereum.org/en/developers/docs/' },
  { tag: 'AI',     label: 'OpenAI Docs',             desc: 'GPT API & models',               url: 'https://platform.openai.com/docs/' },
]

const COMMUNITIES = [
  { tag: 'Dify',   label: 'Dify Discord',            desc: 'Community for Dify users',                 url: 'https://discord.gg/FngNHpbcY7' },
  { tag: 'AWS',    label: 'AWS Vietnam',             desc: 'AWS Vietnam Facebook Community',           url: 'https://www.facebook.com/groups/aws.vietnam/' },
  { tag: 'Claude', label: 'Anthropic Discord',       desc: 'Developer discussions',                    url: 'https://discord.gg/anthropic' },
  { tag: 'n8n',    label: 'n8n Community Forum',     desc: 'Official n8n Forum',                       url: 'https://community.n8n.io/' },
  { tag: 'Web3',   label: 'Web3 / Blockchain VN',    desc: 'Cộng đồng Web3 Việt Nam',                  url: 'https://www.facebook.com/groups/Web3VietNam/' },
  { tag: 'AI',     label: 'Machine Learning Vietnam',desc: 'Cộng đồng AI & ML lớn nhất VN',            url: 'https://www.facebook.com/groups/MachineLearningVietnam/' },
]

export default function AiDevPage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / ai-dev</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>AI & Dev <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Dify · AWS · Claude</span></span>
          <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 400, marginTop: 4 }}>
            • Docs synced {timeAgo(new Date().toISOString())}
          </span>
        </h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <Card style={{ minHeight: 500 }}>
          <CardHeader><CardTitle>AI assistant</CardTitle></CardHeader>
          <ChatBox context="general" defaultProvider="claude" placeholder="Ask about Dify, AWS, Claude API..." />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>Official Docs</CardTitle></CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {OFFICIAL_DOCS.map(t => (
                <a key={t.tag} href={t.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--ink2)', fontFamily: 'monospace', flexShrink: 0, width: 50, textAlign: 'center' }}>{t.tag}</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{t.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Communities & Groups</CardTitle></CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {COMMUNITIES.map(c => (
                <a key={c.tag} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--ink2)', fontFamily: 'monospace', flexShrink: 0, width: 50, textAlign: 'center' }}>{c.tag}</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{c.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
