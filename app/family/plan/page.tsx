// ─────────────────────────────────────────────────────────────────────────
// app/family/plan/page.tsx — Family Plan (server wrapper)
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { getEventsSupabase } from '@/services/family-events-supabase'
import PlanClient from '@/components/family/PlanClient'
import './plan.css'

export const metadata: Metadata = { title: 'Plan · Family' }
export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const events = await getEventsSupabase()

  return <PlanClient initialEvents={events} />
}
