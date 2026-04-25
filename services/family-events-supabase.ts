/**
 * Family Events — Supabase storage layer
 *
 * Replaces KV-based event storage with Supabase PostgreSQL.
 * Uses the shared supabase client from lib/supabase.ts.
 *
 * Table: family_events (see supabase/001_family_events.sql)
 */

import { supabase } from '@/lib/supabase'
import type { FamilyEvent } from '@/types/family'

// ── Row ↔ FamilyEvent mapping ─────────────────────────────────────────────

interface EventRow {
  id: string
  title: string
  description: string | null
  category: string
  date: string        // DATE → 'YYYY-MM-DD'
  end_date: string | null
  time: string | null // TIME → 'HH:mm:ss'
  location: string | null
  reminder: number | null
  created_by: string
  created_at: string  // TIMESTAMPTZ → ISO string
}

function rowToEvent(row: EventRow): FamilyEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as FamilyEvent['category'],
    date: row.date,
    endDate: row.end_date ?? undefined,
    time: row.time ? row.time.slice(0, 5) : undefined, // 'HH:mm:ss' → 'HH:mm'
    location: row.location ?? undefined,
    reminder: row.reminder ?? undefined,
    createdBy: row.created_by as 'me' | 'partner',
    createdAt: row.created_at,
  }
}

function eventToRow(event: FamilyEvent): Record<string, unknown> {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    category: event.category,
    date: event.date,
    end_date: event.endDate ?? null,
    time: event.time ?? null,
    location: event.location ?? null,
    reminder: event.reminder ?? null,
    created_by: event.createdBy,
    created_at: event.createdAt,
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────

const TABLE = 'family_events'

export async function getEventsSupabase(): Promise<FamilyEvent[]> {
  if (!supabase) {
    console.warn('[family-events-supabase] supabase client not initialized')
    return []
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('[family-events-supabase] getEvents error:', error)
    return []
  }

  return (data as EventRow[]).map(rowToEvent)
}

export async function getUpcomingEventsSupabase(days = 60): Promise<FamilyEvent[]> {
  if (!supabase) return []

  const now = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .gte('date', now)
    .lte('date', limit)
    .order('date', { ascending: true })

  if (error) {
    console.error('[family-events-supabase] getUpcoming error:', error)
    return []
  }

  return (data as EventRow[]).map(rowToEvent)
}

export async function saveEventSupabase(event: FamilyEvent): Promise<boolean> {
  if (!supabase) return false

  const row = eventToRow(event)

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })

  if (error) {
    console.error('[family-events-supabase] saveEvent error:', error)
    return false
  }

  return true
}

export async function deleteEventSupabase(id: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[family-events-supabase] deleteEvent error:', error)
    return false
  }

  return true
}

export async function getEventByIdSupabase(id: string): Promise<FamilyEvent | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return rowToEvent(data as EventRow)
}
