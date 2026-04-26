/**
 * services/japanesePhrases.ts
 * Server-side CRUD for japanese_phrases table in Supabase.
 * Uses service role key — never call from client components.
 * Always resolves — never throws. Returns [] / false on failure.
 */
import { supabase } from '@/lib/supabase'
import type { JapanesePhrase, OnsiteCategory, PhraseType, PhraseDifficulty } from '@/types'

// ── DB row shape ──────────────────────────────────────────────────────────────

interface PhraseRow {
  id: string
  category: string
  japanese: string
  vietnamese: string | null
  note: string | null
  tags: string[] | null
  type: string | null
  title: string | null
  difficulty: string | null
  category_vi: string | null
  created_at: string
  updated_at: string | null
}

function rowToPhrase(row: PhraseRow): JapanesePhrase {
  return {
    id: row.id,
    category: row.category as OnsiteCategory,
    japanese: row.japanese,
    vietnamese: row.vietnamese ?? undefined,
    note: row.note ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    phraseType: (row.type ?? undefined) as PhraseType | undefined,
    title: row.title ?? undefined,
    difficulty: (row.difficulty ?? undefined) as PhraseDifficulty | undefined,
    categoryVi: row.category_vi ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function phraseToRow(phrase: JapanesePhrase): Record<string, unknown> {
  return {
    id: phrase.id,
    category: phrase.category,
    japanese: phrase.japanese,
    vietnamese: phrase.vietnamese ?? null,
    note: phrase.note ?? null,
    tags: phrase.tags ?? null,
    type: phrase.phraseType ?? null,
    title: phrase.title ?? null,
    difficulty: phrase.difficulty ?? null,
    category_vi: phrase.categoryVi ?? null,
    created_at: phrase.createdAt,
    updated_at: phrase.updatedAt ?? null,
  }
}

const TABLE = 'japanese_phrases'

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns all phrases ordered newest-first.
 * Returns [] if Supabase is unavailable or query fails.
 */
export async function getPhrasesAll(): Promise<JapanesePhrase[]> {
  if (!supabase) {
    console.warn('[japanesePhrases] supabase not initialized')
    return []
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[japanesePhrases] getPhrasesAll error:', error)
    return []
  }

  return (data as PhraseRow[]).map(rowToPhrase)
}

/**
 * Returns phrases for a specific category.
 */
export async function getPhrasesByCategory(
  category: OnsiteCategory,
): Promise<JapanesePhrase[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[japanesePhrases] getPhrasesByCategory error:', error)
    return []
  }

  return (data as PhraseRow[]).map(rowToPhrase)
}

/**
 * Upserts a phrase. Returns true on success.
 */
export async function savePhrase(phrase: JapanesePhrase): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from(TABLE)
    .upsert(phraseToRow(phrase), { onConflict: 'id' })

  if (error) {
    console.error('[japanesePhrases] savePhrase error:', error)
    return false
  }

  return true
}

/**
 * Deletes a phrase by id. Returns true on success.
 */
export async function deletePhrase(id: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error) {
    console.error('[japanesePhrases] deletePhrase error:', error)
    return false
  }

  return true
}

/**
 * Bulk upsert phrases. Returns count of rows inserted/updated.
 */
export async function bulkSavePhrases(
  phrases: JapanesePhrase[],
): Promise<{ inserted: number; error?: string }> {
  if (!supabase) return { inserted: 0, error: 'supabase not initialized' }
  if (phrases.length === 0) return { inserted: 0 }

  const rows = phrases.map(phraseToRow)
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'id' })
    .select('id')

  if (error) {
    console.error('[japanesePhrases] bulkSavePhrases error:', error)
    return { inserted: 0, error: error.message }
  }

  return { inserted: data?.length ?? 0 }
}
