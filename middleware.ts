import { NextRequest, NextResponse } from 'next/server'

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD ?? ''
const COOKIE_NAME = 'family_auth'

async function hashPassword(password: string): Promise<string> {
  const salt = process.env.FAMILY_COOKIE_SALT ?? 'dashboard-hub-family-2025'
  const data = new TextEncoder().encode(password + salt)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/api/family/auth') {
    return NextResponse.next()
  }

  const isFamilyPage = pathname.startsWith('/family')
  const isFamilyApi = pathname.startsWith('/api/family')

  if (!isFamilyPage && !isFamilyApi) {
    return NextResponse.next()
  }

  if (pathname === '/family/login') {
    return NextResponse.next()
  }

  if (!FAMILY_PASSWORD) {
    if (isFamilyPage) {
      const loginUrl = new URL('/family/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('error', 'missing-password')
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.json({ error: 'Family password is not configured' }, { status: 503 })
  }

  const cookie = req.cookies.get(COOKIE_NAME)
  if (cookie?.value) {
    const expected = await hashPassword(FAMILY_PASSWORD)
    if (cookie.value === expected) {
      return NextResponse.next()
    }
  }

  if (isFamilyApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/family/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/family/:path*', '/api/family/:path*'],
}
