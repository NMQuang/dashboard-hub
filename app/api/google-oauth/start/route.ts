import { NextRequest, NextResponse } from 'next/server'

// GET /api/google-oauth/start
// Redirects the browser to Google's OAuth consent screen.
// After approval, Google redirects to /api/google-oauth/callback on the same host.
export async function GET(req: NextRequest) {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim()
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  // Build redirect_uri from the current request origin so it works on any port
  const origin = req.nextUrl.origin   // e.g. http://localhost:3001
  const redirectUri = `${origin}/api/google-oauth/callback`

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',     clientId)
  url.searchParams.set('redirect_uri',  redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope',         'https://www.googleapis.com/auth/photospicker.mediaitems.readonly')
  url.searchParams.set('access_type',   'offline')
  url.searchParams.set('prompt',        'consent')

  return NextResponse.redirect(url.toString())
}
