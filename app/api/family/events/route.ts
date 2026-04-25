// ─────────────────────────────────────────────────────────────────────────
// app/api/family/events/route.ts — Events CRUD (Supabase)
// ─────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import {
  getEventsSupabase,
  saveEventSupabase,
  deleteEventSupabase,
  getEventByIdSupabase,
} from '@/services/family-events-supabase'
import type { FamilyEvent, EventCategory } from '@/types/family'

const VALID_CATEGORIES: EventCategory[] = [
  'flight', 'visit', 'birthday', 'medical', 'holiday', 'trip', 'vaccine', 'school', 'other',
]

// GET — list all events
export async function GET() {
  try {
    const events = await getEventsSupabase()
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[api/family/events] GET error:', error)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

// POST — create new event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, category, date, endDate, time, location, description } = body

    if (!title || !category || !date) {
      return NextResponse.json({ error: 'title, category, date are required' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 })
    }

    const event: FamilyEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      category,
      date,
      endDate: endDate || undefined,
      time: time || undefined,
      location: location || undefined,
      description: description || undefined,
      createdBy: 'me',
      createdAt: new Date().toISOString(),
    }

    const ok = await saveEventSupabase(event)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save event to database' }, { status: 500 })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[api/family/events] POST error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PUT — update existing event
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, category, date, endDate, time, location, description } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await getEventByIdSupabase(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updated: FamilyEvent = {
      ...existing,
      title: title ?? existing.title,
      category: category ?? existing.category,
      date: date ?? existing.date,
      endDate: endDate !== undefined ? (endDate || undefined) : existing.endDate,
      time: time !== undefined ? (time || undefined) : existing.time,
      location: location !== undefined ? (location || undefined) : existing.location,
      description: description !== undefined ? (description || undefined) : existing.description,
    }

    const ok = await saveEventSupabase(updated)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to update event in database' }, { status: 500 })
    }

    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error('[api/family/events] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE — remove event by id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const ok = await deleteEventSupabase(id)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to delete event from database' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/family/events] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
