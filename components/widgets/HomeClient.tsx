'use client'

import { useEffect, useState } from 'react'
import { greetingJapanese } from '@/lib/utils'

interface HomeClientProps {
  daysLeft: number
  onsiteDate: string
}

export default function HomeClient({ daysLeft }: HomeClientProps) {
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState(greetingJapanese)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setMounted(true)
    const update = () => {
      setGreeting(greetingJapanese())
      const now = new Date()
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) return <div style={{ height: 72, marginBottom: 24 }} />

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', letterSpacing: '0.05em', marginBottom: 4 }}>
          {greeting.jp}
        </div>
        <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
          {greeting.en}, <span style={{ fontWeight: 500 }}>QuangNM</span> 👋
        </div>
      </div>
      <div className="font-mono" style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink3)', lineHeight: 1.8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{dateStr}</div>
        <div>Japan onsite · <span style={{ fontWeight: 500, color: 'var(--ink2)' }}>{daysLeft} days</span> away</div>
      </div>
    </div>
  )
}
