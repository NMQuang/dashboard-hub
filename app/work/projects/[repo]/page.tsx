import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

interface Props { params: { repo: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.repo }
}

export default async function RepoPage({ params }: Props) {
  const { repo } = params
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'your-username'

  // In production this fetches from /api/github?action=readme&repo=...
  const readmeContent = `# ${repo}\n\n> Connect your GitHub token to load the actual README from this repo.\n\nSet \`GITHUB_TOKEN\` and \`GITHUB_USERNAME\` in \`.env.local\` and this page will automatically fetch:\n- README.md content (rendered as markdown)\n- File tree\n- Recent commits\n- Open pull requests`

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>
      <div style={{ marginBottom: 20 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          <a href="/work/projects" style={{ color: 'var(--ink3)', textDecoration: 'none' }}>projects</a>
          {' / '}{repo}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="font-mono" style={{ fontSize: 22, fontWeight: 500 }}>{repo}</h1>
          <a href={`https://github.com/${username}/${repo}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20 }}>
            Open on GitHub ↗
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
        <Card>
          <CardHeader><CardTitle>README</CardTitle></CardHeader>
          <pre style={{ fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {readmeContent}
          </pre>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader><CardTitle>File tree</CardTitle></CardHeader>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Connect GitHub token to browse files
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent commits</CardTitle></CardHeader>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Connect GitHub token to view commits
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
