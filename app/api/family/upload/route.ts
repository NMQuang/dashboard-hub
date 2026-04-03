import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUploadUrl, photoKey, thumbnailKey } from '@/services/family-r2'
import { savePhoto } from '@/services/family-storage'
import { generatePhotoCaption, detectFacesInPhoto } from '@/services/family-ai'
import type { FamilyPhoto } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// POST /api/family/upload
// Body: { filename, contentType, takenAt, tags, location, uploadedBy, width, height, sizeBytes }
// Returns: { uploadUrl, photo } — client PUTs to uploadUrl, then photo is already saved
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      filename: string
      contentType: string
      takenAt: string
      tags: string[]
      location?: string
      uploadedBy: 'me' | 'partner'
      width: number
      height: number
      sizeBytes: number
    }

    const id = generateId()
    const key = photoKey(id, body.filename)
    const thumbKey = thumbnailKey(key)

    // Get presigned URL for direct client upload
    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, body.contentType)

    // Build photo record (caption + faces generated async after upload)
    const photo: FamilyPhoto = {
      id,
      filename: body.filename,
      url: publicUrl,
      thumbnailUrl: `${process.env.R2_PUBLIC_URL ?? ''}/${thumbKey}`,
      takenAt: body.takenAt,
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy,
      tags: body.tags,
      location: body.location,
      albumIds: [],
      sizeBytes: body.sizeBytes,
      width: body.width,
      height: body.height,
    }

    await savePhoto(photo)

    // Trigger AI caption + face detection in background (non-blocking)
    // In production: use Vercel background functions or queue
    void (async () => {
      try {
        const [caption, faces] = await Promise.all([
          generatePhotoCaption(publicUrl, {
            tags: body.tags,
            location: body.location,
            takenAt: body.takenAt,
          }),
          detectFacesInPhoto(publicUrl),
        ])
        const updated: FamilyPhoto = { ...photo, caption, faces, captionGeneratedAt: new Date().toISOString() }
        await savePhoto(updated)
      } catch (e) {
        console.error('AI caption/face error:', e)
      }
    })()

    return NextResponse.json({ uploadUrl, photo })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
