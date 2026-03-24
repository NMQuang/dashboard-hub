import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { fetchRepoContents, fetchRepoBranches, fetchRepoCommits, fetchRepoContributors, fetchRepoPullRequests } from '@/services/github'

interface Props { params: { repo: string } }

export const revalidate = 0

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.repo }
}

export default async function RepoPage({ params }: Props) {
  const { repo } = params
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'your-username'

  const [files, commits, branches, contributors, pullRequests] = await Promise.all([
    fetchRepoContents(username, repo),
    fetchRepoCommits(username, repo),
    fetchRepoBranches(username, repo),
    fetchRepoContributors(username, repo),
    fetchRepoPullRequests(username, repo)
  ])

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <Card>
          <CardHeader><CardTitle>Branches</CardTitle></CardHeader>
          <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
            {branches.length > 0 ? branches.map(b => (
              <div key={b.name} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                &#9090; {b.name}
              </div>
            )) : <div style={{ color: 'var(--ink3)' }}>No branches found</div>}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pull Requests</CardTitle></CardHeader>
          <div style={{ fontSize: 12, color: 'var(--ink)' }}>
            {pullRequests && pullRequests.length > 0 ? pullRequests.map(pr => {
              const isMerged = !!pr.merged_at;
              const stateDisplay = isMerged ? 'Merged' : (pr.state === 'open' ? 'Open' : 'Closed');
              const stateColor = isMerged ? '#8250df' : (pr.state === 'open' ? '#1a7f37' : '#cf222e');
              return (
                <a key={pr.id} href={pr.html_url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: stateColor, fontWeight: 500 }}>[{stateDisplay}]</span>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.title}</span>
                  </div>
                  <div style={{ color: 'var(--ink3)', marginTop: 4 }}>
                    #{pr.number} by {pr.user.login}
                  </div>
                </a>
              )
            }) : <div style={{ color: 'var(--ink3)' }}>No pull requests found</div>}
          </div>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Recent commits</CardTitle></CardHeader>
          <div style={{ fontSize: 12, color: 'var(--ink)' }}>
            {commits.length > 0 ? commits.map(c => (
              <a key={c.sha} href={c.html_url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.commit.message}</div>
                <div style={{ color: 'var(--ink3)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.commit.author.name}</span>
                  <span>{new Date(c.commit.author.date).toLocaleDateString()}</span>
                </div>
              </a>
            )) : <div style={{ color: 'var(--ink3)' }}>No commits available</div>}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>File tree</CardTitle></CardHeader>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink)' }}>
            {files.length > 0 ? files.slice(0, 15).map(f => (
              <div key={f.path} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--ink3)' }}>{f.type === 'dir' ? '📁' : '📄'}</span>
                <span>{f.name}</span>
              </div>
            )) : <div style={{ color: 'var(--ink3)' }}>No files available</div>}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contributors</CardTitle></CardHeader>
          <div style={{ fontSize: 12, color: 'var(--ink)' }}>
            {contributors && contributors.length > 0 ? contributors.map(c => (
              <a key={c.login} href={c.html_url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                <img src={c.avatar_url} alt={c.login} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{c.login}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.contributions} commits</div>
                </div>
              </a>
            )) : <div style={{ color: 'var(--ink3)' }}>No contributors found</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
