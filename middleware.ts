import { NextRequest, NextResponse } from 'next/server'

/**
 * Protects all /family/* routes with a shared family password.
 * Cookie: family_auth=<hashed_token>, httpOnly, 30-day expiry.
 *
 * Env: FAMILY_PASSWORD=your-password-here
 */

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD ?? ''
const COOKIE_NAME = 'family_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Simple hash: SHA-256 of password + salt
async function hashPassword(password: string): Promise<string> {
  const salt = process.env.FAMILY_COOKIE_SALT ?? 'dashboard-hub-family-2025'
  const data = new TextEncoder().encode(password + salt)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /family routes
  if (!pathname.startsWith('/family')) {
    return NextResponse.next()
  }

  // Allow the login page itself
  if (pathname === '/family/login') {
    return NextResponse.next()
  }

  // Allow the login POST API
  if (pathname === '/api/family/auth') {
    return NextResponse.next()
  }

  // Check auth cookie
  const cookie = req.cookies.get(COOKIE_NAME)
  if (cookie?.value) {
    const expected = await hashPassword(FAMILY_PASSWORD)
    if (cookie.value === expected) {
      return NextResponse.next()
    }
  }

  // Redirect to login
  const loginUrl = new URL('/family/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/family/:path*', '/api/family/:path*'],
}
