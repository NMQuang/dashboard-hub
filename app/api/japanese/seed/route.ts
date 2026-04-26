// app/api/japanese/seed/route.ts
// One-shot endpoint to bulk-load docs/japanese-business-phrases-seed.json
// into Supabase. Safe to call multiple times — uses deterministic IDs (upsert).
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { bulkSavePhrases } from '@/services/japanesePhrases'
import type { JapanesePhrase, OnsiteCategory, PhraseType, PhraseDifficulty } from '@/types'

function seedId(category: string, japanese: string): string {
  let h = 5381
  const s = category + '\x00' + japanese
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(33, h) ^ s.charCodeAt(i)) >>> 0
  }
  return `seed_${h.toString(36)}`
}

export async function POST(): Promise<NextResponse> {
  try {
    const seedPath = join(process.cwd(), 'docs', 'japanese-business-phrases-seed.json')
    const raw = JSON.parse(readFileSync(seedPath, 'utf-8')) as Record<string, unknown>[]

    const phrases: JapanesePhrase[] = raw.map(item => ({
      id: seedId(String(item.category ?? ''), String(item.japanese ?? '')),
      category: item.category as OnsiteCategory,
      japanese: String(item.japanese ?? ''),
      vietnamese: typeof item.vietnamese === 'string' ? item.vietnamese : undefined,
      note: typeof item.note === 'string' ? item.note : undefined,
      tags: Array.isArray(item.tags) ? (item.tags as string[]) : undefined,
      phraseType: typeof item.type === 'string' ? (item.type as PhraseType) : undefined,
      title: typeof item.title === 'string' ? item.title : undefined,
      difficulty: typeof item.difficulty === 'string' ? (item.difficulty as PhraseDifficulty) : undefined,
      categoryVi: typeof item.category_vi === 'string' ? item.category_vi : undefined,
      createdAt: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
      updatedAt: typeof item.updated_at === 'string' ? item.updated_at : undefined,
    }))

    const result = await bulkSavePhrases(phrases)
    return NextResponse.json({ total: phrases.length, ...result })
  } catch (err) {
    console.error('[api/japanese/seed] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
