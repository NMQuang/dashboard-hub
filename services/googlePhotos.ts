/**
 * Google Photos service — server-side only.
 *
 * Uses Google Photos Library API (photoslibrary.googleapis.com).
 * Requires scope: https://www.googleapis.com/auth/photoslibrary.readonly
 *
 * Auth flow:
 *   1. User completes one-time OAuth at /family/setup → receives refresh_token
 *   2. refresh_token stored in KV (or GOOGLE_REFRESH_TOKEN env var as fallback)
 *   3. This service exchanges it for a short-lived access_token on each call
 */

import type { GoogleFamilyPhoto } from '@/types'
import type { GooglePhotoAlbum } from '@/types/family'
import { getStoredGoogleRefreshToken, getPickedGooglePhotos } from '@/services/family-storage'

// ── Env ───────────────────────────────────────────────────────────────────────

const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID     ?? '').trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()
const ENV_REFRESH   = (process.env.GOOGLE_REFRESH_TOKEN ?? '').trim()

async function getRefreshToken(): Promise<string> {
  if (ENV_REFRESH) return ENV_REFRESH
  return (await getStoredGoogleRefreshToken()) ?? ''
}

// 60-second in-memory cache so KV isn't hit on every request in the same process
let _configuredCache: { value: boolean; expiresAt: number } | null = null

async function isConfigured(): Promise<boolean> {
  if (!CLIENT_ID || !CLIENT_SECRET) return false
  if (ENV_REFRESH) return true
  if (_configuredCache && Date.now() < _configuredCache.expiresAt) {
    return _configuredCache.value
  }
  const token = await getStoredGoogleRefreshToken()
  const value = Boolean(token)
  _configuredCache = { value, expiresAt: Date.now() + 60_000 }
  return value
}

// ── Token refresh ─────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type:    'refresh_token',
  })

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      cache:   'no-store',
    })

    if (!res.ok) {
      console.warn('[googlePhotos] token refresh HTTP error:', res.status)
      return null
    }

    const data = await res.json() as TokenResponse
    if (data.error) {
      console.warn('[googlePhotos] token refresh error:', data.error)
      return null
    }

    return data.access_token ?? null
  } catch (err) {
    console.error('[googlePhotos] refreshAccessToken threw:', err)
    return null
  }
}

// ── Photos Library API types ──────────────────────────────────────────────────

interface RawMediaMetadata {
  creationTime: string
  width: string
  height: string
  photo?: Record<string, string>
}

interface RawMediaItem {
  id: string
  filename: string
  baseUrl: string
  mimeType: string
  description?: string
  mediaMetadata: RawMediaMetadata
}

interface MediaItemsResponse {
  mediaItems?: RawMediaItem[]
  nextPageToken?: string
}

interface RawAlbum {
  id: string
  title: string
  mediaItemsCount?: string
  coverPhotoBaseUrl?: string
  productUrl?: string
}

interface AlbumsListResponse {
  albums?: RawAlbum[]
  nextPageToken?: string
}

// ── Normalizer ────────────────────────────────────────────────────────────────

function normalizeItem(item: RawMediaItem): GoogleFamilyPhoto {
  const meta = item.mediaMetadata
  return {
    id:           item.id,
    url:          `${item.baseUrl}=d`,
    thumbnailUrl: `${item.baseUrl}=w400-h400-c`,
    filename:     item.filename,
    description:  item.description,
    takenAt:      meta.creationTime,
    createdAt:    meta.creationTime,
    mimeType:     item.mimeType,
    width:        parseInt(meta.width,  10) || 0,
    height:       parseInt(meta.height, 10) || 0,
    source:       'google_photos',
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GooglePhotosPage {
  photos: GoogleFamilyPhoto[]
  nextPageToken?: string
}

export interface GoogleAlbumsPage {
  albums: GooglePhotoAlbum[]
  nextPageToken?: string
}

export type GooglePhotosStatus = 'ok' | 'not_configured' | 'token_expired'

/**
 * Returns photos the user has previously synced via the Picker flow.
 * Photos are stored in KV after each picker session.
 * Never throws — always resolves.
 */
export async function fetchGooglePhotosPage(
  _pageSize = 100,
  _pageToken?: string,
): Promise<GooglePhotosPage> {
  if (!(await isConfigured())) return { photos: [] }
  try {
    const photos = await getPickedGooglePhotos()
    return { photos }
  } catch (err) {
    console.error('[googlePhotos] fetchGooglePhotosPage threw:', err)
    return { photos: [] }
  }
}

/** Backward-compatible single-call helper. */
export async function fetchGooglePhotos(pageSize = 100): Promise<GoogleFamilyPhoto[]> {
  const { photos } = await fetchGooglePhotosPage(pageSize)
  return photos
}

/**
 * Returns the connection status for display in the UI.
 */
export async function getGooglePhotosStatus(): Promise<GooglePhotosStatus> {
  if (!(await isConfigured())) return 'not_configured'
  const token = await refreshAccessToken()
  return token ? 'ok' : 'token_expired'
}

/** @deprecated use getGooglePhotosStatus() */
export async function isGooglePhotosConfigured(): Promise<boolean> {
  return isConfigured()
}

/** Albums not supported with Picker API. */
export async function fetchGoogleAlbums(_pageToken?: string): Promise<GoogleAlbumsPage> {
  return { albums: [] }
}

/** Album photos not supported with Picker API. */
export async function fetchAlbumPhotos(
  _albumId: string,
  _pageSize = 100,
  _pageToken?: string,
): Promise<GooglePhotosPage> {
  return { photos: [] }
}
