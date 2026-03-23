// app/learn/japanese/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
export const metadata: Metadata = { title: 'Japanese' }

export default function JapanesePage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / japanese</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Japanese <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>JLPT N2 prep</span>
        </h1>
      </div>
      <div className="grid-2col">
        <Card style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <CardHeader>
            <CardTitle>AI Tutor</CardTitle>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>claude / gpt / gemini</span>
          </CardHeader>
          <ChatBox context="japanese" defaultProvider="claude" placeholder="Ask in Japanese or English... e.g. JLPT N2 grammar &#12390;&#12418;" />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>Quick review</CardTitle></CardHeader>
            {[
              { jp: '&#24403;&#28982;', en: 'of course / naturally', level: 'N2' },
              { jp: '&#12354;&#12427;&#12356;&#12399;', en: 'or / otherwise', level: 'N2' },
              { jp: '&#12418;&#12425;&#12358;', en: 'to receive (humble)', level: 'N3' },
              { jp: '&#12395;&#12418;&#12363;&#12363;&#12431;&#12425;&#12378;', en: 'despite / in spite of', level: 'N2' },
            ].map(w => (
              <div key={w.jp} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 16, color: 'var(--ink)', minWidth: 80 }} dangerouslySetInnerHTML={{ __html: w.jp }} />
                <span style={{ fontSize: 12.5, color: 'var(--ink2)', flex: 1 }}>{w.en}</span>
                <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>{w.level}</span>
              </div>
            ))}
          </Card>
          <Card>
            <CardHeader><CardTitle>Study plan</CardTitle></CardHeader>
            {[
              { activity: 'NHK Web Easy reading',    duration: '20 min', done: true  },
              { activity: 'N2 grammar drills',       duration: '30 min', done: true  },
              { activity: 'Shadowing practice',      duration: '15 min', done: false },
              { activity: 'Kanji review (10 words)', duration: '10 min', done: false },
            ].map(s => (
              <div key={s.activity} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, opacity: s.done ? 1 : 0.3 }}>{s.done ? '\u2713' : '\u25CB'}</span>
                <span style={{ fontSize: 13, color: s.done ? 'var(--ink3)' : 'var(--ink)', flex: 1, textDecoration: s.done ? 'line-through' : 'none' }}>{s.activity}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>{s.duration}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
