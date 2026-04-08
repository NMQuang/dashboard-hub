import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUploadUrl, photoKey, thumbnailKey } from '@/services/family-r2'
import { savePhoto } from '@/services/family-storage'
import { generatePhotoCaption, detectFacesInPhoto, inferTagsFromPhoto } from '@/services/family-ai'
import type { FamilyPhoto } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// POST /api/family/upload
// Body: { filename, contentType, takenAt, location, uploadedBy, width, height, sizeBytes }
// Returns: { uploadUrl, photo } — client PUTs to uploadUrl, then photo is already saved
// Tags are NOT sent by client — AI infers them from the image in the background step.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      filename: string
      contentType: string
      takenAt: string
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

    // Save photo with placeholder tag — AI will update tags in the background
    const photo: FamilyPhoto = {
      id,
      filename: body.filename,
      url: publicUrl,
      thumbnailUrl: process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${thumbKey}` : publicUrl,
      takenAt: body.takenAt,
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy,
      tags: ['family'],   // placeholder — overwritten by AI below
      location: body.location,
      albumIds: [],
      sizeBytes: body.sizeBytes,
      width: body.width,
      height: body.height,
    }

    await savePhoto(photo)

    // Trigger AI caption + face detection + tag inference in background (non-blocking)
    void (async () => {
      try {
        const [caption, faces, tags] = await Promise.allSettled([
          generatePhotoCaption(publicUrl, {
            location: body.location,
            takenAt: body.takenAt,
          }),
          detectFacesInPhoto(publicUrl),
          inferTagsFromPhoto(publicUrl),
        ])
        const updated: FamilyPhoto = {
          ...photo,
          caption:            caption.status === 'fulfilled' ? caption.value : undefined,
          faces:              faces.status   === 'fulfilled' ? faces.value   : undefined,
          tags:               tags.status    === 'fulfilled' && tags.value.length > 0
                                ? tags.value
                                : photo.tags,
          captionGeneratedAt: new Date().toISOString(),
        }
        await savePhoto(updated)
      } catch (e) {
        console.error('AI caption/face/tag error:', e)
      }
    })()

    return NextResponse.json({ uploadUrl, photo })
  } catch (e) {
    console.error('[upload] POST error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
