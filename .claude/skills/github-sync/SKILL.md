---
name: github-sync
description: >
  Fetch, display, or sync data from GitHub repos. Triggered when the user asks to
  "load my repos", "show README from GitHub", "display file tree", "fetch commits",
  "sync docs from ibm repo", or anything related to GitHub API integration.
---

# Skill: GitHub Sync

## Architecture
```
Client page              → /api/github?action=X&repo=Y&path=Z
app/api/github/route.ts  → services/github.ts
services/github.ts       → api.github.com (REST + GraphQL)
```

## API actions (already implemented in services/github.ts)
| action | params | returns |
|--------|--------|---------|
| `repos` | — | All user repos sorted by updated_at |
| `repo` | `repo` | Single repo metadata |
| `readme` | `repo` | Raw README.md content |
| `contents` | `repo`, `path?` | File/folder listing |
| `file` | `repo`, `path` | Raw file content |
| `events` | — | Recent user activity events |
| `contributions` | — | 52-week contribution heatmap (GraphQL) |

## User's repos to integrate
```ts
// lib/constants.ts → GITHUB_REPOS
const GITHUB_REPOS = [
  { name: 'web3',   topic: 'Web3 / DApp',          color: 'purple' },
  { name: 'ai',     topic: 'AI / Agents',           color: 'blue'   },
  { name: 'aws',    topic: 'AWS / Infrastructure',  color: 'amber'  },
  { name: 'claude', topic: 'Claude tools',          color: 'teal'   },
  { name: 'ibm',    topic: 'IBM Mainframe / COBOL', color: 'gray'   },
]
```

## Rendering README as markdown
Install `react-markdown` + `remark-gfm`:
```bash
npm install react-markdown remark-gfm
```
```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm">
  {readmeContent}
</ReactMarkdown>
```

## Loading repo docs into /learn pages
The `ibm` repo contains docs on COBOL, JCL, logical thinking.
Sync flow for `/learn/mainframe`:
```ts
// Fetch file list from ibm repo
const contents = await fetch('/api/github?action=contents&repo=ibm')
// Filter .md files
const docs = contents.filter(f => f.name.endsWith('.md'))
// Fetch each doc on demand
const content = await fetch(`/api/github?action=file&repo=ibm&path=${doc.path}`)
```

## Contribution heatmap
The `contributions` action uses GraphQL API:
```ts
// Returns: number[][] — 52 weeks × 7 days, each = contribution count
// Map to heat levels:
const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4
// CSS classes: hm-cell, hm-cell l1, l2, l3, l4
```

## Rate limits
| Token | Limit |
|-------|-------|
| No token | 60 req/hour |
| PAT (classic) | 5,000 req/hour |
| PAT (fine-grained) | 5,000 req/hour |
Always use `next: { revalidate: 300 }` to cache aggressively.

## Adding GitHub token
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-handle
```
Generate at: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
Scopes needed: `repo` (read-only for private), `read:user`
