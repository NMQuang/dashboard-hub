import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardAction, SectionLabel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { fetchAiNewsByProvider } from '@/services/aiNews'
import { fetchDevNewsBySource } from '@/services/devNews'
import { timeAgo } from '@/lib/utils'
import type { AiNewsItem, AiNewsProvider, DevNewsItem } from '@/types'

export const metadata: Metadata = { title: 'AI / Dev — Knowledge Hub' }

// ── Static data ──────────────────────────────────────────────────────────────

const OFFICIAL_DOCS = [
  { tag: 'Claude',  label: 'Anthropic Docs',        desc: 'Tool use, API specs',       url: 'https://docs.anthropic.com' },
  { tag: 'OpenAI',  label: 'OpenAI Docs',            desc: 'GPT API & models',          url: 'https://platform.openai.com/docs/' },
  { tag: 'Gemini',  label: 'Google AI Studio',       desc: 'Gemini API & models',       url: 'https://ai.google.dev/docs' },
  { tag: 'Dify',    label: 'Dify Docs',              desc: 'Build AI pipelines',        url: 'https://docs.dify.ai' },
  { tag: 'n8n',     label: 'n8n Docs',               desc: 'Workflow automation',       url: 'https://docs.n8n.io' },
  { tag: 'AWS',     label: 'AWS Documentation',      desc: 'Serverless & Cloud',        url: 'https://docs.aws.amazon.com' },
] as const

const COMMUNITIES = [
  { tag: 'Claude',  label: 'Anthropic Discord',      desc: 'Developer discussions',                    url: 'https://discord.gg/anthropic' },
  { tag: 'Dify',    label: 'Dify Discord',           desc: 'Community for Dify users',                 url: 'https://discord.gg/FngNHpbcY7' },
  { tag: 'AWS',     label: 'AWS Vietnam',            desc: 'AWS Vietnam Facebook Community',           url: 'https://www.facebook.com/groups/aws.vietnam/' },
  { tag: 'n8n',     label: 'n8n Community Forum',    desc: 'Official n8n Forum',                       url: 'https://community.n8n.io/' },
  { tag: 'AI',      label: 'ML Vietnam',             desc: 'Cộng đồng AI & ML lớn nhất VN',            url: 'https://www.facebook.com/groups/MachineLearningVietnam/' },
] as const

interface AiTool {
  category: string
  tools: Array<{ name: string; desc: string; url: string; badge?: string }>
}

const AI_TOOLS: AiTool[] = [
  {
    category: 'Slide Generation',
    tools: [
      { name: 'Gamma',         desc: 'AI-powered presentations',         url: 'https://gamma.app',           badge: 'Free tier' },
      { name: 'Claude',        desc: 'Generate slide outlines & content',url: 'https://claude.ai',           badge: 'Prompt' },
      { name: 'Beautiful.ai',  desc: 'Smart slide templates',            url: 'https://beautiful.ai' },
    ],
  },
  {
    category: 'UI / Basic Design',
    tools: [
      { name: 'v0 by Vercel',  desc: 'Generate UI from text prompt',     url: 'https://v0.dev',              badge: 'Hot' },
      { name: 'Figma AI',      desc: 'AI design features in Figma',      url: 'https://figma.com',           badge: 'Native' },
      { name: 'Adobe Firefly', desc: 'Generative fill & image AI',       url: 'https://firefly.adobe.com' },
    ],
  },
  {
    category: 'System & Detail Design',
    tools: [
      { name: 'Claude',        desc: 'Architecture docs, ERD, sequence', url: 'https://claude.ai',           badge: 'Best' },
      { name: 'ChatGPT',       desc: 'System design reasoning',          url: 'https://chat.openai.com' },
      { name: 'Mermaid AI',    desc: 'Diagram-as-code from text',        url: 'https://mermaid.live' },
    ],
  },
  {
    category: 'Layout Generation',
    tools: [
      { name: 'v0 by Vercel',  desc: 'Full layout from description',     url: 'https://v0.dev',              badge: 'React' },
      { name: 'Claude Code',   desc: 'Agentic UI building in terminal',  url: 'https://claude.ai/code',      badge: 'CLI' },
      { name: 'Cursor',        desc: 'AI editor with Composer mode',     url: 'https://cursor.sh' },
    ],
  },
  {
    category: 'Coding Assistance',
    tools: [
      { name: 'Claude Code',   desc: 'Full-repo agentic coding',         url: 'https://claude.ai/code',      badge: 'Agentic' },
      { name: 'GitHub Copilot',desc: 'Inline & chat coding help',        url: 'https://github.com/features/copilot' },
      { name: 'Cursor',        desc: 'AI-native code editor',            url: 'https://cursor.sh' },
    ],
  },
]

// ── Provider metadata ────────────────────────────────────────────────────────

interface ProviderMeta {
  label: string
  color: string
  bg: string
}

const PROVIDER_META: Record<AiNewsProvider, ProviderMeta> = {
  claude:  { label: 'Claude',  color: '#c96442', bg: '#fff4f0' },
  openai:  { label: 'ChatGPT', color: '#19a37f', bg: '#f0fff9' },
  gemini:  { label: 'Gemini',  color: '#1a73e8', bg: '#f0f5ff' },
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AiNewsCard({ item }: { item: AiNewsItem }) {
  const meta = PROVIDER_META[item.provider]
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4,
          background: meta.bg, color: meta.color, fontFamily: 'monospace', flexShrink: 0,
        }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{item.source}</span>
        <span style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 'auto', flexShrink: 0 }}>
          {timeAgo(item.publishedAt)}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500, lineHeight: 1.4 }}>
        {item.title}
      </div>
      {item.summary && (
        <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 3, lineHeight: 1.5 }}>
          {item.summary}
        </div>
      )}
    </a>
  )
}

function ProviderNewsColumn({ provider, items }: { provider: AiNewsProvider; items: AiNewsItem[] }) {
  const meta = PROVIDER_META[provider]
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 8, color: meta.color, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
        {meta.label}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '8px 0' }}>No recent news available</div>
      ) : (
        items.map((item, i) => <AiNewsCard key={`${item.url}-${i}`} item={item} />)
      )}
    </div>
  )
}

function DevNewsCard({ item }: { item: DevNewsItem }) {
  const isDevTo = item.source === 'dev.to'
  const sourceColor = isDevTo ? '#3b49df' : '#55c500'
  const sourceBg   = isDevTo ? '#f0f1ff' : '#f0fff0'

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4,
          background: sourceBg, color: sourceColor, fontFamily: 'monospace', flexShrink: 0,
        }}>
          {item.source}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.author}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 'auto', flexShrink: 0 }}>
          {timeAgo(item.publishedAt)}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500, lineHeight: 1.4, marginBottom: 5 }}>
        {item.title}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} style={{
            fontSize: 10, padding: '1px 5px', borderRadius: 3,
            background: 'var(--surface2)', color: 'var(--ink3)', fontFamily: 'monospace',
          }}>
            #{tag}
          </span>
        ))}
        <span style={{ fontSize: 10.5, color: 'var(--ink3)', marginLeft: 'auto' }}>
          ♥ {item.reactions}
          {item.readingTime !== undefined && ` · ${item.readingTime}m read`}
        </span>
      </div>
    </a>
  )
}

function DevNewsColumn({ title, items, emptyMsg }: { title: string; items: DevNewsItem[]; emptyMsg: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 8, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '8px 0' }}>{emptyMsg}</div>
      ) : (
        items.map((item, i) => <DevNewsCard key={`${item.url}-${i}`} item={item} />)
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AiDevPage() {
  const [newsByProvider, devNews] = await Promise.all([
    fetchAiNewsByProvider(),
    fetchDevNewsBySource(),
  ])

  return (
    <div className="page-content" style={{ maxWidth: 1080 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          learn / ai-dev
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          AI Knowledge Hub{' '}
          <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Claude · ChatGPT · Gemini</span>
        </h1>
      </div>

      {/* Section A: Latest AI News */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel>A — Latest AI News</SectionLabel>
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Recent updates from AI providers</CardTitle>
            <CardAction>live RSS</CardAction>
          </CardHeader>
          <div style={{ display: 'flex', gap: 24 }}>
            {(['claude', 'openai', 'gemini'] as AiNewsProvider[]).map((provider) => (
              <ProviderNewsColumn key={provider} provider={provider} items={newsByProvider[provider]} />
            ))}
          </div>
        </Card>
      </div>

      {/* Section B + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
        {/* Section B: AI Tools for IT */}
        <div>
          <SectionLabel>B — AI Tools for IT Developers</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AI_TOOLS.map((group) => (
              <Card key={group.category}>
                <CardHeader><CardTitle>{group.category}</CardTitle></CardHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.tools.map((tool) => (
                    <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', gap: 10, padding: '7px 0',
                        borderBottom: '1px solid var(--border)',
                        textDecoration: 'none', alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{tool.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{tool.desc}</div>
                      </div>
                      {tool.badge !== undefined && <Badge>{tool.badge}</Badge>}
                    </a>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar: Docs + Communities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>Official Docs</CardTitle></CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {OFFICIAL_DOCS.map((t) => (
                <a
                  key={t.tag}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', gap: 10, padding: '9px 0',
                    borderBottom: '1px solid var(--border)',
                    textDecoration: 'none', alignItems: 'flex-start',
                  }}
                >
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--surface2)', color: 'var(--ink2)',
                    fontFamily: 'monospace', flexShrink: 0, width: 50, textAlign: 'center',
                  }}>
                    {t.tag}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{t.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Communities</CardTitle></CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {COMMUNITIES.map((c) => (
                <a
                  key={c.tag}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', gap: 10, padding: '9px 0',
                    borderBottom: '1px solid var(--border)',
                    textDecoration: 'none', alignItems: 'flex-start',
                  }}
                >
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--surface2)', color: 'var(--ink2)',
                    fontFamily: 'monospace', flexShrink: 0, width: 50, textAlign: 'center',
                  }}>
                    {c.tag}
                  </span>
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

      {/* Section C: IT & DEV articles from dev.to + Qiita */}
      <div>
        <SectionLabel>C — IT / DEV Community</SectionLabel>
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Trending articles · IT &amp; Development</CardTitle>
            <CardAction>dev.to &amp; Qiita</CardAction>
          </CardHeader>
          <div style={{ display: 'flex', gap: 32 }}>
            <DevNewsColumn
              title="dev.to — Trending"
              items={devNews.devTo}
              emptyMsg="dev.to feed unavailable"
            />
            <DevNewsColumn
              title="Qiita — Latest"
              items={devNews.qiita}
              emptyMsg="Qiita feed unavailable"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
