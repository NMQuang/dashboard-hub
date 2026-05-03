import { NextRequest, NextResponse } from 'next/server'
import { saveStoredGoogleRefreshToken } from '@/services/family-storage'

// GET /api/google-oauth/callback?code=...
// Exchanges the authorization code for tokens, saves refresh_token to KV,
// then redirects to setup page. No API verification — the photos page
// will show real status on load.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    const dest = new URL('/family/setup', origin)
    dest.searchParams.set('error', error)
    return NextResponse.redirect(dest.toString())
  }

  if (!code) {
    const dest = new URL('/family/setup', origin)
    dest.searchParams.set('error', 'no_code')
    return NextResponse.redirect(dest.toString())
  }

  const clientId     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()
  const redirectUri  = `${origin}/api/google-oauth/callback`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        code,
        grant_type: 'authorization_code',
      }).toString(),
      cache: 'no-store',
    })

    const data = await tokenRes.json() as {
      access_token?: string
      refresh_token?: string
      scope?: string
      error?: string
      error_description?: string
    }

    if (data.error || !data.refresh_token) {
      const dest = new URL('/family/setup', origin)
      dest.searchParams.set('error', data.error ?? 'no_refresh_token')
      return NextResponse.redirect(dest.toString())
    }

    console.info('[oauth-callback] granted scopes:', data.scope)
    await saveStoredGoogleRefreshToken(data.refresh_token)

    const dest = new URL('/family/setup', origin)
    dest.searchParams.set('success', '1')
    dest.searchParams.set('apiOk', 'true')
    return NextResponse.redirect(dest.toString())
  } catch (err) {
    const dest = new URL('/family/setup', origin)
    dest.searchParams.set('error', String(err))
    return NextResponse.redirect(dest.toString())
  }
}
