import { NextRequest, NextResponse } from 'next/server'
import {
  fetchUserRepos,
  fetchRepo,
  fetchRepoReadme,
  fetchRepoContents,
  fetchFileContent,
  fetchUserEvents,
  fetchContributions,
} from '@/services/github'

const USERNAME = process.env.GITHUB_USERNAME ?? ''

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'repos'
  const repo   = searchParams.get('repo') ?? ''
  const path   = searchParams.get('path') ?? ''

  try {
    switch (action) {
      case 'repos':
        return NextResponse.json(await fetchUserRepos(USERNAME))
      case 'repo':
        return NextResponse.json(await fetchRepo(USERNAME, repo))
      case 'readme':
        return NextResponse.json({ content: await fetchRepoReadme(USERNAME, repo) })
      case 'contents':
        return NextResponse.json(await fetchRepoContents(USERNAME, repo, path))
      case 'file':
        return NextResponse.json({ content: await fetchFileContent(USERNAME, repo, path) })
      case 'events':
        return NextResponse.json(await fetchUserEvents(USERNAME))
      case 'contributions':
        return NextResponse.json(await fetchContributions(USERNAME))
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
