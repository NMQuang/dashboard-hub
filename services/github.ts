import type { GithubRepo, GithubEvent } from '@/types'

const BASE = 'https://api.github.com'

const headers = (): Record<string, string> => {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

export async function fetchUserRepos(username: string): Promise<GithubRepo[]> {
  const res = await fetch(
    `${BASE}/users/${username}/repos?sort=updated&per_page=30`,
    { headers: headers(), next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`GitHub repos error: ${res.status}`)
  return res.json()
}

export async function fetchRepo(username: string, repo: string): Promise<GithubRepo> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) throw new Error(`GitHub repo error: ${res.status}`)
  return res.json()
}

export async function fetchRepoReadme(username: string, repo: string): Promise<string> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/readme`,
    { headers: { ...headers(), Accept: 'application/vnd.github.raw+json' }, next: { revalidate: 600 } }
  )
  if (!res.ok) return '# No README found'
  return res.text()
}

export async function fetchRepoContents(
  username: string,
  repo: string,
  path = ''
): Promise<Array<{ name: string; type: string; path: string; size: number }>> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/contents/${path}`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  return res.json()
}

export async function fetchFileContent(
  username: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/contents/${path}`,
    { headers: { ...headers(), Accept: 'application/vnd.github.raw+json' }, next: { revalidate: 600 } }
  )
  if (!res.ok) throw new Error('File not found')
  return res.text()
}

export async function fetchUserEvents(username: string): Promise<GithubEvent[]> {
  const res = await fetch(
    `${BASE}/users/${username}/events?per_page=20`,
    { headers: headers(), next: { revalidate: 120 } }
  )
  if (!res.ok) return []
  return res.json()
}

export async function fetchContributions(username: string): Promise<number[][]> {
  // GitHub's contribution graph requires GraphQL
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
  `
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  const weeks = data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
  return weeks.map((w: { contributionDays: Array<{ contributionCount: number }> }) =>
    w.contributionDays.map((d) => d.contributionCount)
  )
}

export async function fetchRepoBranches(username: string, repo: string): Promise<Array<{ name: string }>> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/branches?per_page=10`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  return res.json()
}

export async function fetchRepoCommits(username: string, repo: string): Promise<Array<{ sha: string, commit: { message: string, author: { name: string, date: string } }, html_url: string }>> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/commits?per_page=5`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  return res.json()
}

export async function fetchRepoContributors(username: string, repo: string): Promise<Array<{ login: string, avatar_url: string, html_url: string, contributions: number }>> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/contributors?per_page=10`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  return res.json()
}

export async function fetchRepoPullRequests(username: string, repo: string): Promise<Array<{ id: number, number: number, title: string, state: string, html_url: string, user: { login: string }, merged_at: string | null }>> {
  const res = await fetch(
    `${BASE}/repos/${username}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=5`,
    { headers: headers(), next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  return res.json()
}
