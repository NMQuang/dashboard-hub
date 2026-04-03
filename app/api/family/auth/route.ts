import { NextRequest, NextResponse } from 'next/server'

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD ?? ''
const COOKIE_NAME = 'family_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function hashPassword(password: string): Promise<string> {
  const salt = process.env.FAMILY_COOKIE_SALT ?? 'dashboard-hub-family-2025'
  const data = new TextEncoder().encode(password + salt)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password: string }

  if (!password || !FAMILY_PASSWORD) {
    return NextResponse.json({ error: 'Missing password' }, { status: 400 })
  }

  if (password !== FAMILY_PASSWORD) {
    return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 })
  }

  const token = await hashPassword(password)
  const redirectTo = req.nextUrl.searchParams.get('from') ?? '/family'

  const res = NextResponse.json({ ok: true, redirectTo })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
