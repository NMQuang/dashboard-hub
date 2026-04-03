/**
 * Cloudflare R2 presigned upload.
 * Client uploads directly to R2 — bypasses Vercel's 4.5MB body limit.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME, R2_PUBLIC_URL (CDN domain)
 */

import type { PresignedUploadUrl } from '@/types/family-types'

const ACCOUNT_ID  = process.env.R2_ACCOUNT_ID ?? ''
const ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID ?? ''
const SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY ?? ''
const BUCKET      = process.env.R2_BUCKET_NAME ?? 'family-photos'
const PUBLIC_URL  = process.env.R2_PUBLIC_URL ?? ''

// R2 endpoint uses standard S3-compatible API
const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`

// ── HMAC SHA-256 helper (Web Crypto API — works in edge runtime) ───────────
async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return hex(buf)
}

// ── AWS Signature V4 presigned PUT URL ────────────────────────────────────
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<PresignedUploadUrl> {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')     // YYYYMMDD
  const amzDate   = now.toISOString().replace(/[:-]|\.\d+/g, '')         // YYYYMMDDTHHmmssZ

  const region  = 'auto'
  const service = 's3'
  const host    = `${R2_ENDPOINT}`.replace('https://', '')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const credential      = `${ACCESS_KEY}/${credentialScope}`

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    credential,
    'X-Amz-Date':          amzDate,
    'X-Amz-Expires':       String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
    'X-Amz-Content-SHA256':'UNSIGNED-PAYLOAD',
  })

  const canonicalRequest = [
    'PUT',
    `/${BUCKET}/${key}`,
    queryParams.toString(),
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n')

  // Derive signing key
  const enc = new TextEncoder()
  let signingKey = await hmac(enc.encode(`AWS4${SECRET_KEY}`).buffer, dateStamp)
  signingKey = await hmac(signingKey, region)
  signingKey = await hmac(signingKey, service)
  signingKey = await hmac(signingKey, 'aws4_request')
  const signature = hex(await hmac(signingKey, stringToSign))

  const uploadUrl = `${R2_ENDPOINT}/${BUCKET}/${key}?${queryParams}&X-Amz-Signature=${signature}`
  const publicUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${BUCKET}/${key}`

  return { uploadUrl, publicUrl, key }
}

// ── Delete photo from R2 ──────────────────────────────────────────────────
export async function deletePhotoFromR2(key: string): Promise<void> {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate   = now.toISOString().replace(/[:-]|\.\d+/g, '')
  const region = 'auto'
  const service = 's3'
  const host = `${R2_ENDPOINT}`.replace('https://', '')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const payloadHash = await sha256('')

  const canonicalRequest = [
    'DELETE',
    `/${BUCKET}/${key}`,
    '',
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}`,
    '',
    'host;x-amz-content-sha256;x-amz-date',
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n')

  const enc = new TextEncoder()
  let signingKey = await hmac(enc.encode(`AWS4${SECRET_KEY}`).buffer, dateStamp)
  signingKey = await hmac(signingKey, region)
  signingKey = await hmac(signingKey, service)
  signingKey = await hmac(signingKey, 'aws4_request')
  const signature = hex(await hmac(signingKey, stringToSign))

  await fetch(`${R2_ENDPOINT}/${BUCKET}/${key}`, {
    method: 'DELETE',
    headers: {
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Content-SHA256': payloadHash,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope},SignedHeaders=host;x-amz-content-sha256;x-amz-date,Signature=${signature}`,
    },
  })
}

// ── Thumbnail key convention ──────────────────────────────────────────────
export function thumbnailKey(originalKey: string): string {
  const parts = originalKey.split('.')
  const ext = parts.pop() ?? 'jpg'
  return `${parts.join('.')}_thumb.${ext}`
}

export function photoKey(id: string, filename: string): string {
  const ext = filename.split('.').pop() ?? 'jpg'
  return `photos/${id}.${ext}`
}
