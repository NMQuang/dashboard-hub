import { NextRequest, NextResponse } from 'next/server'
import { getFamilyPhotoStories, saveFamilyPhotoStory, deleteFamilyPhotoStory } from '@/services/family-storage'
import type { FamilyPhotoStory } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// GET /api/family/stories
export async function GET() {
  try {
    const stories = await getFamilyPhotoStories()
    return NextResponse.json({ stories })
  } catch (e) {
    console.error('[stories] GET error:', e)
    return NextResponse.json({ stories: [] })
  }
}

// POST /api/family/stories — create new story
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      title?: string
      description?: string
      photoIds?: string[]
      dateFrom?: string
      dateTo?: string
      location?: string
      notes?: string
    }

    const title    = body.title?.trim() ?? ''
    const photoIds = Array.isArray(body.photoIds) ? body.photoIds : []

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (photoIds.length === 0) {
      return NextResponse.json({ error: 'photoIds must not be empty' }, { status: 400 })
    }

    const story: FamilyPhotoStory = {
      id:          generateId(),
      title,
      description: body.description?.trim() || undefined,
      photoIds,
      dateFrom:    body.dateFrom || undefined,
      dateTo:      body.dateTo   || undefined,
      location:    body.location?.trim() || undefined,
      notes:       body.notes?.trim()    || undefined,
      syncStatus:  'local',
      createdAt:   new Date().toISOString(),
    }

    await saveFamilyPhotoStory(story)
    return NextResponse.json({ story })
  } catch (e) {
    console.error('[stories] POST error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE /api/family/stories?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    await deleteFamilyPhotoStory(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
