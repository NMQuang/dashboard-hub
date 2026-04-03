'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FamilyLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const from = params.get('from') ?? '/family'
    const res = await fetch(`/api/family/auth?from=${encodeURIComponent(from)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      const data = await res.json() as { redirectTo: string }
      router.push(data.redirectTo)
    } else {
      setError('Sai mật khẩu. Thử lại nhé.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏠</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}>
            Family Space
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
            Nhập mật khẩu gia đình để tiếp tục
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Mật khẩu gia đình..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 14, color: 'var(--ink)', outline: 'none',
              marginBottom: error ? 8 : 14, fontFamily: 'inherit',
            }}
          />

          {error && (
            <div style={{ fontSize: 12.5, color: 'var(--red)', marginBottom: 12, padding: '6px 10px', background: 'var(--red-bg)', borderRadius: 7 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: 'var(--ink)', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              opacity: loading || !password ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Đang vào...' : 'Vào Family Space →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink3)', marginTop: 20, fontFamily: 'monospace' }}>
          Chỉ dành cho gia đình Cafe
        </p>
      </div>
    </div>
  )
}
