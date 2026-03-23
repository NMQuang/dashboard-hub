'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MarketSnapshot } from '@/types'

// ── useMarket: poll /api/prices every 60s ────────────────────────────────
export function useMarket(symbols?: string[]) {
  const [data, setData] = useState<MarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const qs = symbols ? `?symbols=${symbols.join(',')}` : ''
      const res = await fetch(`/api/prices${qs}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [symbols?.join(',')])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 60_000)
    return () => clearInterval(id)
  }, [fetch_])

  return { data, loading, error, refetch: fetch_ }
}

// ── useClock: live time string ────────────────────────────────────────────
export function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── useLocalStorage ───────────────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch { return initial }
  })

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      try { window.localStorage.setItem(key, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }, [key])

  return [value, set] as const
}

// ── useGithub ─────────────────────────────────────────────────────────────
export function useGithubEvents() {
  const [events, setEvents] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/github?action=events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { events, loading }
}
