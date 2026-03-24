// app/learn/mainframe/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { IBM_DOCS } from '@/data/docs-ibm'

export const metadata: Metadata = { title: 'Mainframe' }

export default function MainframePage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / mainframe</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Mainframe <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>COBOL · JCL · IBM z/OS</span></span>
          <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 400, marginTop: 4 }}>
            • Docs synced {timeAgo(new Date().toISOString())}
          </span>
        </h1>
      </div>
      <div className="grid-2col">
        <Card style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <CardHeader>
            <CardTitle>COBOL Assistant</CardTitle>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>claude / gpt</span>
          </CardHeader>
          <ChatBox context="cobol" defaultProvider="claude" placeholder="Paste COBOL code or ask a mainframe question..." />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>GitHub docs (IBM)</CardTitle></CardHeader>
            {IBM_DOCS.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {IBM_DOCS.map(doc => (
                  <Link key={doc.path} href={`/work/projects/${doc.repo}?file=${encodeURIComponent(doc.path)}`}
                    style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 500 }}>{doc.title}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{doc.path}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>No IBM docs synced yet.</div>
            )}
          </Card>
          <Card>
            <CardHeader><CardTitle>COBOL structure</CardTitle></CardHeader>
            {[
              { div: 'IDENTIFICATION DIVISION', desc: 'Program name and metadata' },
              { div: 'ENVIRONMENT DIVISION',    desc: 'System and file assignments' },
              { div: 'DATA DIVISION',           desc: 'Working storage, file records' },
              { div: 'PROCEDURE DIVISION',      desc: 'Business logic and flow control' },
            ].map(d => (
              <div key={d.div} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)', fontWeight: 500 }}>{d.div}</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{d.desc}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
