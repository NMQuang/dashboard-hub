import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB persistence disabled')
}

// Use service role key (server-side only — never expose to browser)
// Custom fetch forces cache: 'no-store' so Next.js never serves stale Supabase data
const noStoreFetch: typeof fetch = (url, options = {}) =>
  fetch(url as RequestInfo, { ...options, cache: 'no-store' })

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        global: { fetch: noStoreFetch },
      })
    : null
