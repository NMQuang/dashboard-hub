/**
 * Google Photos Picker API client — server-side only.
 * Replacement for deprecated Photos Library API.
 * Scope: https://www.googleapis.com/auth/photospicker.mediaitems.readonly
 * Docs: https://developers.google.com/photos/picker
 */

const PICKER_BASE = 'https://photospicker.googleapis.com/v1'

export interface PickerSession {
  id: string
  pickerUri: string
  mediaItemsSet: boolean
  expireTime: string
  pollingConfig: {
    pollInterval: string  // e.g. "5s"
    timeoutIn: string     // e.g. "300s"
  }
}

interface PickerMediaFile {
  baseUrl: string
  mimeType: string
  filename?: string
  mediaFileMetadata?: {
    width?: number
    height?: number
    photoMetadata?: Record<string, unknown>
  }
}

export interface PickerMediaItem {
  id: string
  createTime: string
  type: string
  mediaFile: PickerMediaFile
}

export async function createPickerSession(accessToken: string): Promise<PickerSession> {
  const res = await fetch(`${PICKER_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Create session failed: ${res.status} ${await res.text().catch(() => '')}`)
  }
  return res.json() as Promise<PickerSession>
}

export async function getPickerSession(accessToken: string, sessionId: string): Promise<PickerSession> {
  const res = await fetch(`${PICKER_BASE}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Get session failed: ${res.status} ${await res.text().catch(() => '')}`)
  }
  return res.json() as Promise<PickerSession>
}

export async function getPickerMediaItems(accessToken: string, sessionId: string): Promise<PickerMediaItem[]> {
  const items: PickerMediaItem[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(`${PICKER_BASE}/mediaItems`)
    url.searchParams.set('sessionId', sessionId)
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Get media items failed: ${res.status} ${await res.text().catch(() => '')}`)
    }

    const data = await res.json() as { mediaItems?: PickerMediaItem[]; nextPageToken?: string }
    items.push(...(data.mediaItems ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return items
}
