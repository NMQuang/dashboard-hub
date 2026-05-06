/**
 * Pure conversion helpers between photo storage types and the unified
 * DisplayPhoto format used by PhotosHubClient.
 *
 * These functions have no side-effects and are safe to import in both
 * Server Components and Client Components.
 */

import type { FamilyPhoto, DisplayPhoto } from '@/types/family'
import type { GoogleFamilyPhoto } from '@/types'

export function familyPhotoToDisplay(p: FamilyPhoto): DisplayPhoto {
  return {
    id:           p.id,
    url:          p.url,
    thumbnailUrl: p.thumbnailUrl,
    filename:     p.filename,
    caption:      p.caption,
    takenAt:      p.takenAt,
    location:     p.location,
    tags:         Array.from(p.tags ?? []),
    source:       'local',
    width:        p.width,
    height:       p.height,
  }
}

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '').trim()

export function googlePhotoToDisplay(p: GoogleFamilyPhoto): DisplayPhoto {
  // R2-stored photos have permanent public CDN URLs — serve directly, no proxy needed.
  // Google Picker CDN URLs require OAuth, so those still go through the proxy.
  const isR2 = Boolean(R2_BASE && p.url.startsWith(R2_BASE))

  if (isR2) {
    return {
      id:           p.id,
      url:          p.url,
      thumbnailUrl: p.thumbnailUrl,
      filename:     p.filename,
      description:  p.description,
      takenAt:      p.takenAt,
      tags:         [],
      source:       'google_photos',
      width:        p.width,
      height:       p.height,
      albumTitle:   p.albumTitle,
    }
  }

  const proxy = (size: 'thumb' | 'full') =>
    `/api/family/photos/proxy?id=${encodeURIComponent(p.id)}&size=${size}`

  return {
    id:           p.id,
    url:          proxy('full'),
    thumbnailUrl: proxy('thumb'),
    filename:     p.filename,
    description:  p.description,
    takenAt:      p.takenAt,
    tags:         [],
    source:       'google_photos',
    width:        p.width,
    height:       p.height,
    albumTitle:   p.albumTitle,
  }
}
