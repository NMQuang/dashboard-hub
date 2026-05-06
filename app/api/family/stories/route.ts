import { NextRequest, NextResponse } from 'next/server'
import { getFamilyPhotoStories, saveFamilyPhotoStory, deleteFamilyPhotoStory } from '@/services/family-storage'
import type { FamilyPhotoStory } from '@/types/family'
import { randomBytes } from 'crypto'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function generateShareToken(): string {
  return randomBytes(16).toString('hex')
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

// PATCH /api/family/stories?id=xxx — edit fields or generate share token
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const stories = await getFamilyPhotoStories()
    const story = stories.find((s) => s.id === id)
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    const body = await req.json() as {
      title?: string
      description?: string
      location?: string
      notes?: string
      generateShareToken?: boolean
    }

    const updated: FamilyPhotoStory = {
      ...story,
      title:       body.title?.trim()       ?? story.title,
      description: body.description !== undefined ? (body.description.trim() || undefined) : story.description,
      location:    body.location    !== undefined ? (body.location.trim()    || undefined) : story.location,
      notes:       body.notes       !== undefined ? (body.notes.trim()       || undefined) : story.notes,
      shareToken:  body.generateShareToken ? (story.shareToken ?? generateShareToken()) : story.shareToken,
      updatedAt:   new Date().toISOString(),
    }

    await saveFamilyPhotoStory(updated)
    return NextResponse.json({ story: updated })
  } catch (e) {
    console.error('[stories] PATCH error:', e)
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
