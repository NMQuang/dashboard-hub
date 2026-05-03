import { NextResponse } from 'next/server'

const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()
const REFRESH_TOKEN = (process.env.GOOGLE_REFRESH_TOKEN ?? '').trim()

export async function GET() {
  const configured = {
    clientId:     CLIENT_ID     ? `${CLIENT_ID.slice(0, 12)}...`     : '(empty)',
    clientSecret: CLIENT_SECRET ? `${CLIENT_SECRET.slice(0, 8)}...`  : '(empty)',
    refreshToken: REFRESH_TOKEN ? `${REFRESH_TOKEN.slice(0, 8)}...`  : '(empty)',
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json({ step: 'env', ok: false, configured })
  }

  // Step 1: refresh token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }).toString(),
    cache: 'no-store',
  })

  const tokenBody = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string }

  if (!tokenRes.ok || tokenBody.error) {
    return NextResponse.json({
      step: 'token',
      ok: false,
      configured,
      tokenStatus: tokenRes.status,
      error: tokenBody.error,
      errorDescription: tokenBody.error_description,
    })
  }

  const accessToken = tokenBody.access_token!

  // Step 2: check token scopes
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { cache: 'no-store' }
  )
  const tokenInfo = await tokenInfoRes.json() as { scope?: string; error?: string }
  const grantedScopes = tokenInfo.scope?.split(' ') ?? []
  const hasReadonly = grantedScopes.some(s => s.includes('photoslibrary.readonly'))

  // Step 3: list 1 photo
  const photosRes = await fetch(
    'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=1',
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )

  const rawBody = await photosRes.text()
  let photosBody: { mediaItems?: unknown[]; error?: { message: string; status?: string } }
  try { photosBody = JSON.parse(rawBody) } catch { photosBody = {} }

  if (!photosRes.ok) {
    const fix = photosRes.status === 403 && photosBody.error?.message?.includes('scope')
      ? 'Run: node scripts/setup-google-oauth.mjs to get a fresh token with the correct scopes.'
      : photosRes.status === 403
      ? 'Enable "Photos Library API" at https://console.cloud.google.com/apis/library'
      : 'Check credentials and retry.'

    return NextResponse.json({
      step: 'api',
      ok: false,
      configured,
      apiStatus: photosRes.status,
      apiError: photosBody.error?.message,
      apiErrorStatus: photosBody.error?.status,
      grantedScopes,
      hasReadonlyScope: hasReadonly,
      fix,
    })
  }

  // Step 4: list albums
  const albumsRes = await fetch(
    'https://photoslibrary.googleapis.com/v1/albums?pageSize=5',
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  const albumsBody = await albumsRes.json() as { albums?: unknown[]; error?: { message: string } }

  return NextResponse.json({
    step: 'done',
    ok: true,
    configured,
    grantedScopes,
    photoCount:  (photosBody as { mediaItems?: unknown[] }).mediaItems?.length ?? 0,
    albumCount:  albumsBody.albums?.length ?? 0,
    samplePhoto: (photosBody as { mediaItems?: unknown[] }).mediaItems?.[0],
    sampleAlbum: albumsBody.albums?.[0],
  })
}
