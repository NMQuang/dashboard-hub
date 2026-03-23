// app/learn/ai-dev/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
export const metadata: Metadata = { title: 'AI / Dev' }

const TOPICS = [
  { tag: 'Dify',   label: 'Workflow builder',        desc: 'Build AI pipelines with Dify',        url: 'https://docs.dify.ai' },
  { tag: 'AWS',    label: 'Lambda + Bedrock',         desc: 'Serverless AI on AWS',                url: 'https://docs.aws.amazon.com' },
  { tag: 'Claude', label: 'Anthropic API',            desc: 'Tool use, streaming, system prompts', url: 'https://docs.anthropic.com' },
  { tag: 'n8n',    label: 'Workflow automation',      desc: 'Open-source automation',              url: 'https://docs.n8n.io' },
]

export default function AiDevPage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / ai-dev</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>AI & Dev <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Dify · AWS · Claude</span></h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <Card style={{ minHeight: 500 }}>
          <CardHeader><CardTitle>AI assistant</CardTitle></CardHeader>
          <ChatBox context="general" defaultProvider="claude" placeholder="Ask about Dify, AWS, Claude API..." />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>Docs & resources</CardTitle></CardHeader>
            {TOPICS.map(t => (
              <a key={t.tag} href={t.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--ink2)', fontFamily: 'monospace', flexShrink: 0 }}>{t.tag}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{t.desc}</div>
                </div>
              </a>
            ))}
          </Card>
          <Card>
            <CardHeader><CardTitle>GitHub docs (from your repos)</CardTitle></CardHeader>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
              Connect your GitHub token in <span className="font-mono" style={{ fontSize: 11 }}>.env.local</span> to auto-load README files from your ibm, aws, claude repos.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
