import { headers } from 'next/headers'
import SetupClient from './SetupClient'

export const dynamic = 'force-dynamic'

export default async function FamilySetupPage() {
  // Read the host from the incoming request headers so the displayed
  // redirect URI exactly matches what the start route will send to Google.
  const headersList = headers()
  const host     = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const origin   = `${protocol}://${host}`
  const callbackUri = `${origin}/api/google-oauth/callback`

  return <SetupClient callbackUri={callbackUri} />
}
