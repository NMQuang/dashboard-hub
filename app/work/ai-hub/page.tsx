import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
export const metadata: Metadata = { title: 'AI Hub' }

const SAVED_PROMPTS = [
  { tag: 'COBOL',    text: 'Explain this COBOL division structure and identify potential issues' },
  { tag: 'Japanese', text: 'Translate this to business Japanese (keigo level)' },
  { tag: 'Market',   text: 'Analyze gold price trend and BTC correlation for this week' },
  { tag: 'Code',     text: 'Review this code for bugs, performance, and best practices' },
  { tag: 'AWS',      text: 'Design a serverless architecture for this use case using AWS services' },
]

export default function AiHubPage() {
  return (
    <div className="page-content" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>work / ai-hub</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>AI Hub <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Claude · ChatGPT · Gemini</span></h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <Card style={{ minHeight: 600 }}>
          <CardHeader>
            <CardTitle>Multi-model chat</CardTitle>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>Switch models mid-conversation</span>
          </CardHeader>
          <ChatBox context="general" defaultProvider="claude" placeholder="Ask anything across all AI models..." />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>Saved prompts</CardTitle></CardHeader>
            {SAVED_PROMPTS.map((p, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < SAVED_PROMPTS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--ink2)', fontFamily: 'monospace', marginBottom: 4, display: 'inline-block' }}>{p.tag}</span>
                <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{p.text}</div>
              </div>
            ))}
          </Card>
          <Card>
            <CardHeader><CardTitle>Model info</CardTitle></CardHeader>
            {[
              { name: 'Claude Sonnet 4', provider: 'Anthropic', strength: 'Reasoning, code, long context', color: '#D4845A' },
              { name: 'GPT-4o',          provider: 'OpenAI',    strength: 'Versatile, vision, speed',       color: '#10a37f' },
              { name: 'Gemini 1.5 Pro',  provider: 'Google',    strength: 'Multimodal, huge context',       color: '#4285F4' },
            ].map(m => (
              <div key={m.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.name}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)', paddingLeft: 16 }}>{m.strength}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
