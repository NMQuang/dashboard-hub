// app/api/japanese/phrases/route.ts
// Client-facing API for Japanese phrase CRUD.
// All Supabase access is server-side via the service layer.
import { NextRequest, NextResponse } from 'next/server'
import {
  getPhrasesAll,
  savePhrase,
  deletePhrase,
} from '@/services/japanesePhrases'
import { ONSITE_CATEGORIES } from '@/types'
import type { OnsiteCategory, JapanesePhrase, PhraseType, PhraseDifficulty } from '@/types'

const PHRASE_TYPES: readonly string[] = ['sample_phrase', 'template', 'scenario_example']
const PHRASE_DIFFICULTIES: readonly string[] = ['basic', 'practical']

// GET — return all phrases
export async function GET(): Promise<NextResponse> {
  try {
    const phrases = await getPhrasesAll()
    return NextResponse.json({ phrases })
  } catch (error) {
    console.error('[api/japanese/phrases] GET error:', error)
    return NextResponse.json({ error: 'Failed to load phrases' }, { status: 500 })
  }
}

// POST — create a new phrase
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    const { category, japanese, vietnamese, note, tags, phraseType, title, difficulty, categoryVi } = b

    if (typeof category !== 'string' || typeof japanese !== 'string') {
      return NextResponse.json(
        { error: 'category and japanese are required strings' },
        { status: 400 },
      )
    }

    if (!(ONSITE_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 },
      )
    }

    if (japanese.trim().length === 0) {
      return NextResponse.json({ error: 'japanese must not be empty' }, { status: 400 })
    }

    if (phraseType !== undefined && !PHRASE_TYPES.includes(phraseType as string)) {
      return NextResponse.json({ error: `Invalid phraseType: ${phraseType}` }, { status: 400 })
    }

    if (difficulty !== undefined && !PHRASE_DIFFICULTIES.includes(difficulty as string)) {
      return NextResponse.json({ error: `Invalid difficulty: ${difficulty}` }, { status: 400 })
    }

    const phrase: JapanesePhrase = {
      id: `jp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      category: category as OnsiteCategory,
      japanese: japanese.trim(),
      vietnamese: typeof vietnamese === 'string' ? vietnamese.trim() || undefined : undefined,
      note: typeof note === 'string' ? note.trim() || undefined : undefined,
      tags: Array.isArray(tags)
        ? (tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : undefined,
      phraseType: typeof phraseType === 'string' ? phraseType as PhraseType : undefined,
      title: typeof title === 'string' ? title.trim() || undefined : undefined,
      difficulty: typeof difficulty === 'string' ? difficulty as PhraseDifficulty : undefined,
      categoryVi: typeof categoryVi === 'string' ? categoryVi.trim() || undefined : undefined,
      createdAt: new Date().toISOString(),
    }

    const ok = await savePhrase(phrase)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save phrase' }, { status: 500 })
    }

    return NextResponse.json({ phrase }, { status: 201 })
  } catch (error) {
    console.error('[api/japanese/phrases] POST error:', error)
    return NextResponse.json({ error: 'Failed to create phrase' }, { status: 500 })
  }
}

// DELETE — remove phrase by ?id=
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const ok = await deletePhrase(id)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to delete phrase' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/japanese/phrases] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete phrase' }, { status: 500 })
  }
}
