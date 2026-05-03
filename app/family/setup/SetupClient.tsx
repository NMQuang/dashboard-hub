'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// Maps Google OAuth error codes to human-readable diagnoses
const ERROR_DIAGNOSIS: Record<string, { title: string; fix: string }> = {
  org_internal: {
    title: 'App is restricted to Google Workspace (org_internal)',
    fix:   'OAuth consent screen → User Type → change from Internal to External → Save',
  },
  access_denied: {
    title: 'Access denied — scope not declared on consent screen',
    fix:   'OAuth consent screen → Edit App → Scopes → "+ Add or Remove Scopes" → search "photospicker" → add photospicker.mediaitems.readonly → Save',
  },
  redirect_uri_mismatch: {
    title: 'Redirect URI mismatch',
    fix:   'Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs → add the URI shown in Step 1 below',
  },
  no_refresh_token: {
    title: 'Google did not return a refresh token',
    fix:   'Go to myaccount.google.com/permissions → revoke this app → then click Connect again',
  },
  no_code: {
    title: 'No authorization code received',
    fix:   'Try clicking Connect Google Photos again',
  },
}

function diagnose(error: string): { title: string; fix: string } {
  return ERROR_DIAGNOSIS[error] ?? {
    title: `Google error: ${error}`,
    fix:   'Check the Google Cloud Console configuration and try again',
  }
}

function SetupContent({ callbackUri }: { callbackUri: string }) {
  const params   = useSearchParams()
  const success  = params.get('success') === '1'
  const apiOk    = params.get('apiOk') === 'true'
  const error    = params.get('error') ?? ''
  const apiError = params.get('apiError') ?? ''
  const [copied, setCopied] = useState(false)

  const diagnosis = error ? diagnose(error) : null

  function copyUri() {
    navigator.clipboard.writeText(callbackUri).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ padding: '32px', maxWidth: 680 }}>
      <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6 }}>
        family / setup
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', marginBottom: 28 }}>
        Google Photos Setup
      </h1>

      {/* ── Success ── */}
      {success && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, marginBottom: 24,
          background: apiOk ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${apiOk ? '#86efac' : '#fcd34d'}`,
        }}>
          {apiOk ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#15803d', marginBottom: 4 }}>
                ✓ Google Photos connected!
              </div>
              <div style={{ fontSize: 13, color: '#166534' }}>
                Token saved. Go to{' '}
                <a href="/family/photos" style={{ color: '#15803d', textDecoration: 'underline' }}>
                  /family/photos
                </a>{' '}
                to see your real photos.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#b45309', marginBottom: 4 }}>
                ⚠ Token saved but Photos API returned an error
              </div>
              <div style={{ fontSize: 13, color: '#92400e', marginBottom: 8 }}>{apiError}</div>
              <div style={{ fontSize: 12.5, color: '#78350f' }}>
                Enable the <strong>Photos Library API</strong> in Google Cloud Console (see Step 2).
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Error with diagnosis ── */}
      {error && diagnosis && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, marginBottom: 24,
          background: '#fef2f2', border: '1px solid #fca5a5',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 8 }}>
            ✗ {diagnosis.title}
          </div>
          <div style={{
            fontSize: 12.5, color: '#991b1b',
            padding: '8px 12px', borderRadius: 6, background: 'rgba(185,28,28,0.06)',
            fontFamily: 'monospace',
          }}>
            Fix: {diagnosis.fix}
          </div>
          {error === 'access_denied' && (
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 10, lineHeight: 1.6 }}>
              Full steps for scope fix: Google Cloud Console →{' '}
              <a href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank" rel="noopener noreferrer" style={{ color: '#b91c1c' }}>
                OAuth consent screen
              </a>
              {' '}→ <strong>Edit App</strong> → <strong>Step 2: Scopes</strong> →{' '}
              <strong>+ Add or Remove Scopes</strong> → search <code>drive.photos</code> →
              check <code>photospicker.mediaitems.readonly</code> → <strong>Update</strong> →{' '}
              <strong>Save and Continue</strong> → <strong>Save and Continue</strong> → <strong>Back to Dashboard</strong>
            </div>
          )}
          {error === 'org_internal' && (
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 10, lineHeight: 1.6 }}>
              Full steps: Google Cloud Console →{' '}
              <a href="https://console.cloud.google.com/apis/credentials/consent"
                target="_blank" rel="noopener noreferrer" style={{ color: '#b91c1c' }}>
                OAuth consent screen
              </a>
              {' '}→ scroll to <strong>User Type</strong> → currently shows <em>Internal</em> →
              click <strong>Make External</strong> → confirm.
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Redirect URI ── */}
      <Step n={1} title="Add redirect URI to Google Cloud Console">
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 10, lineHeight: 1.6 }}>
          <a href="https://console.cloud.google.com/apis/credentials"
            target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue,#3b82f6)' }}>
            console.cloud.google.com/apis/credentials
          </a>
          {' '}→ OAuth 2.0 Client ID → <strong>Authorized redirect URIs</strong> → add:
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, padding: '9px 13px', borderRadius: 7,
            background: 'var(--surface2)', fontFamily: 'monospace',
            fontSize: 13, color: 'var(--ink)', wordBreak: 'break-all',
            border: '1px solid var(--border)',
          }}>
            {callbackUri}
          </div>
          <button onClick={copyUri} style={{
            padding: '0 14px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: copied ? '#f0fdf4' : 'var(--surface)',
            color: copied ? '#15803d' : 'var(--ink2)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </Step>

      {/* ── Step 2: Scope ── */}
      <Step n={2} title="Add photospicker.mediaitems.readonly scope to consent screen">
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 10, lineHeight: 1.6 }}>
          <a href="https://console.cloud.google.com/apis/credentials/consent"
            target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue,#3b82f6)' }}>
            OAuth consent screen
          </a>
          {' '}→ <strong>Edit App</strong> → <strong>Scopes (Step 2)</strong> →{' '}
          <strong>+ Add or Remove Scopes</strong> → paste vào ô "Enter manually":
        </p>
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'var(--surface2)', fontFamily: 'monospace',
          fontSize: 12.5, color: 'var(--ink)', border: '1px solid var(--border)', marginBottom: 8,
        }}>
          https://www.googleapis.com/auth/photospicker.mediaitems.readonly
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 0, lineHeight: 1.6 }}>
          Add to table → check the box → Update → Save and Continue (×2) → Back to Dashboard.
          Scope này không cần app verification — dùng được ngay trong Testing mode.
        </p>
      </Step>

      {/* ── Step 3: Enable API ── */}
      <Step n={3} title="Enable Google Photos Picker API">
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 0, lineHeight: 1.6 }}>
          <a href="https://console.cloud.google.com/apis/library/photospicker.googleapis.com"
            target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue,#3b82f6)' }}>
            Google Photos Picker API
          </a>
          {' '}→ click <strong>Enable</strong>. Đây là API mới thay thế Photos Library API (deprecated).
        </p>
      </Step>

      {/* ── Step 4: Test Users ── */}
      <Step n={4} title="Add your email as a Test User">
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 0, lineHeight: 1.6 }}>
          <a href="https://console.cloud.google.com/apis/credentials/consent"
            target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue,#3b82f6)' }}>
            OAuth consent screen
          </a>
          {' '}→ scroll to <strong>Test users</strong> → <strong>+ Add Users</strong> →
          enter your Gmail address → <strong>Save</strong>.
        </p>
      </Step>

      {/* ── Step 5: Connect ── */}
      <Step n={5} title="Authorize">
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', marginBottom: 14, lineHeight: 1.6 }}>
          After completing steps 1–4, click below. If you still see an error,
          the banner above will show the exact cause and fix.
        </p>
        <a href="/api/google-oauth/start" style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 10,
          background: '#4285F4', color: '#fff', textDecoration: 'none',
          fontSize: 14, fontWeight: 500,
        }}>
          Connect Google Photos
        </a>
      </Step>

      <div style={{ marginTop: 28 }}>
        <a href="/family/photos" style={{ fontSize: 13, color: 'var(--ink3)' }}>
          ← Back to Photos
        </a>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 20px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--ink)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {n}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

export default function SetupClient({ callbackUri }: { callbackUri: string }) {
  return (
    <Suspense>
      <SetupContent callbackUri={callbackUri} />
    </Suspense>
  )
}
