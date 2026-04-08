import { NextRequest, NextResponse } from 'next/server'
import { getAllPhotos, getPhotosByTag, groupByMonth, deletePhoto } from '@/services/family-storage'
import { deletePhotoFromR2, photoKey } from '@/services/family-r2'
import { generatePhotoStory } from '@/services/family-ai'
import { saveStory } from '@/services/family-storage'
import type { PhotoStory } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// GET /api/family/photos?tag=japan&view=timeline
export async function GET(req: NextRequest) {
  const tag  = req.nextUrl.searchParams.get('tag')
  const view = req.nextUrl.searchParams.get('view') ?? 'flat'

  const photos = tag ? await getPhotosByTag(tag) : await getAllPhotos()

  // Sort newest first
  photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt))

  if (view === 'timeline') {
    return NextResponse.json({ timeline: groupByMonth(photos), total: photos.length })
  }

  return NextResponse.json({ photos, total: photos.length })
}

// DELETE /api/family/photos?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const all = await getAllPhotos()
    const photo = all.find(p => p.id === id)
    if (photo) {
      // Delete from R2
      const ext = photo.filename.split('.').pop() ?? 'jpg'
      await deletePhotoFromR2(`photos/${id}.${ext}`)
    }
    await deletePhoto(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/family/photos (generate story from selected photos)
export async function POST(req: NextRequest) {
  const { action, photoIds, tag } = await req.json() as {
    action: 'generate-story'
    photoIds: string[]
    tag?: string
  }

  if (action !== 'generate-story') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const all = await getAllPhotos()
  const selected = all.filter(p => photoIds.includes(p.id))

  if (selected.length === 0) {
    return NextResponse.json({ error: 'Không tìm thấy ảnh đã chọn trong KV. Vui lòng reload và thử lại.' }, { status: 400 })
  }

  try {
    const { title, description } = await generatePhotoStory(selected, tag)
    const story: PhotoStory = {
      id: generateId(),
      title,
      description,
      photoIds,
      createdAt: new Date().toISOString(),
      tag,
    }
    await saveStory(story)
    return NextResponse.json({ story })
  } catch (e) {
    console.error('[generate-story] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
