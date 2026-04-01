// app/work/projects/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { fetchUserRepos } from '@/services/github'
import type { GithubRepo } from '@/types'

export const metadata: Metadata = { title: 'Projects' }
export const revalidate = 0

function repoColor(repo: GithubRepo): string {
  const key = [repo.name, ...(repo.topics ?? [])].join(' ').toLowerCase()
  if (/web3|solidity|ethers|hardhat/.test(key)) return '#f2f0fd'
  if (/ai|claude|openai|gpt|llm|dify/.test(key)) return '#f0faf4'
  if (/aws|lambda|cdk|bedrock|cloud/.test(key)) return '#fdf8ed'
  if (/ibm|cobol|jcl|mainframe|zos/.test(key)) return '#f0f0ed'
  return '#f5f4f2'
}

function repoIcon(repo: GithubRepo): string {
  const key = [repo.name, ...(repo.topics ?? [])].join(' ').toLowerCase()
  if (/web3|solidity/.test(key)) return '\u25C8'
  if (/ai|claude|openai|gpt|llm/.test(key)) return '\u25CE'
  if (/aws|lambda|cloud/.test(key)) return '\u2601'
  if (/ibm|cobol|mainframe/.test(key)) return '\u2B1B'
  return '\u25CB'
}

function formatUpdated(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks}w ago`
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  } catch { return '' }
}

type RepoResult =
  | { repos: GithubRepo[]; error: null }
  | { repos: []; error: string }

async function getRepos(username: string): Promise<RepoResult> {
  if (!username || username === 'your-username') {
    return { repos: [], error: 'GITHUB_USERNAME chưa được cấu hình trong .env.local' }
  }
  try {
    const repos = await fetchUserRepos(username)
    return { repos: repos.filter(r => !r.private), error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { repos: [], error: msg }
  }
}

export default async function ProjectsPage() {
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'your-username'
  const { repos, error } = await getRepos(username)

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>work / projects</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', margin: 0 }}>
          Projects <span className="font-mono" style={{ fontWeight: 300, fontSize: 16, color: 'var(--ink3)' }}>@{username}</span>
        </h1>
      </div>

      {error ? (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 14,
          padding: '32px 28px', textAlign: 'center', color: 'var(--ink3)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink2)', marginBottom: 8 }}>
            Không thể tải dữ liệu từ GitHub
          </div>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 16, background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', display: 'inline-block' }}>
            {error}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            Kiểm tra <code>GITHUB_TOKEN</code> trong <code>.env.local</code> — token có thể đã hết hạn.
          </div>
        </div>
      ) : repos.length === 0 ? (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 14,
          padding: '32px 28px', textAlign: 'center', color: 'var(--ink3)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14 }}>Không có repository public nào.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {repos.map(r => {
            const card = (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px', textDecoration: 'none',
                display: 'block', height: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: repoColor(r),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {repoIcon(r)}
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{formatUpdated(r.updated_at)}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink3)' }}>&#9733; {r.stargazers_count}</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5, marginBottom: 10 }}>
                  {r.description ?? '\u2014'}
                </div>
                {r.language && <Badge>{r.language}</Badge>}
              </div>
            )

            return (
              <Link key={r.id} href={`/work/projects/${r.name}`} style={{ textDecoration: 'none', display: 'block' }}>
                {card}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
