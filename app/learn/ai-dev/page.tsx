// app/learn/ai-dev/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { CLAUDE_DOCS } from '@/data/docs-claude'
import { AWS_DOCS } from '@/data/docs-aws'
import { AI_DOCS } from '@/data/docs-ai'
import { DIFY_DOCS } from '@/data/docs-dify'

export const metadata: Metadata = { title: 'AI / Dev' }

const TOPICS = [
  { tag: 'Dify',   label: 'Workflow builder',        desc: 'Build AI pipelines with Dify',        url: 'https://docs.dify.ai' },
  { tag: 'AWS',    label: 'Lambda + Bedrock',         desc: 'Serverless AI on AWS',                url: 'https://docs.aws.amazon.com' },
  { tag: 'Claude', label: 'Anthropic API',            desc: 'Tool use, streaming, system prompts', url: 'https://docs.anthropic.com' },
  { tag: 'n8n',    label: 'Workflow automation',      desc: 'Open-source automation',              url: 'https://docs.n8n.io' },
]

export default function AiDevPage() {
  const GITHUB_DOCS = [...CLAUDE_DOCS, ...AWS_DOCS, ...AI_DOCS, ...DIFY_DOCS]

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
            <CardHeader><CardTitle>GitHub docs</CardTitle></CardHeader>
            {GITHUB_DOCS.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {GITHUB_DOCS.map(doc => (
                  <Link key={doc.path} href={`/work/projects/${doc.repo}?file=${encodeURIComponent(doc.path)}`}
                    style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{doc.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink3)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{doc.repo}</span>
                    </div>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{doc.path}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>No AI/Dev docs synced yet.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
