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

export function googlePhotoToDisplay(p: GoogleFamilyPhoto): DisplayPhoto {
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
