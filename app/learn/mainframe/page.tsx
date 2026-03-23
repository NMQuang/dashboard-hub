// app/learn/mainframe/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import ChatBox from '@/components/ui/ChatBox'
export const metadata: Metadata = { title: 'Mainframe' }

export default function MainframePage() {
  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>learn / mainframe</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Mainframe <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>COBOL · JCL · IBM z/OS</span>
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
          <Card>
            <CardHeader><CardTitle>Quick references</CardTitle></CardHeader>
            {[
              { label: 'JCL job card',    value: '//JOBNAME JOB ...' },
              { label: 'VSAM KSDS',       value: 'DEFINE CLUSTER (NAME(...))' },
              { label: 'DB2 cursor',      value: 'DECLARE cursor CURSOR FOR SELECT' },
              { label: 'ISPF edit',       value: 'EDIT dataset(member)' },
            ].map(r => (
              <div key={r.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--ink2)', width: 110, flexShrink: 0 }}>{r.label}</span>
                <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>{r.value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
