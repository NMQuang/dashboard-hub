// app/learn/japanese/page.tsx
import type { Metadata } from 'next'
import { getPhrasesAll } from '@/services/japanesePhrases'
import JapaneseTabs from './JapaneseTabs'

export const metadata: Metadata = { title: 'Japanese Learning' }

export default async function JapanesePage() {
  // Fetch initial phrases server-side — falls back to [] if Supabase is unavailable
  const [phrasesResult] = await Promise.allSettled([getPhrasesAll()])
  const initialPhrases = phrasesResult.status === 'fulfilled' ? phrasesResult.value : []

  // Let the client component know whether DB is configured
  // (empty array alone is ambiguous — could be no phrases or DB unavailable)
  const dbAvailable =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          learn / japanese
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Japanese{' '}
          <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Learning 2026</span>
        </h1>
      </div>

      <JapaneseTabs
        initialPhrases={initialPhrases}
        dbAvailable={dbAvailable}
      />
    </div>
  )
}
