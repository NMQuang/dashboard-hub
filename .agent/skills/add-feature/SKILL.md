---
name: add-feature
description: >
  Add a new reusable UI component or feature to the dashboard. Triggered when the
  user asks to "add a component", "create a widget", "build a chart", "add dark mode",
  "create a table", or any request to build a new reusable piece of UI.
---

# Skill: Add a UI Feature or Component

## Component placement guide
| Type | Location | Export |
|------|----------|--------|
| Shared primitive (Button, Badge, Input) | `components/ui/` | Named export |
| Layout element (Header, Breadcrumb) | `components/layout/` | Named export |
| Page-specific client widget | `components/widgets/` | Default export |
| Data display (PriceCard, GitHubEvent) | `components/ui/` | Named export |

## Component template (Server, no hooks)
```tsx
// components/ui/MyComponent.tsx
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  value: number
  className?: string
}

export function MyComponent({ title, value, className }: MyComponentProps) {
  return (
    <div className={cn('...', className)} style={{ color: 'var(--ink)' }}>
      {title}: {value}
    </div>
  )
}
```

## Client component template (needs hooks/events)
```tsx
// components/widgets/MyWidget.tsx
'use client'

import { useState } from 'react'

interface MyWidgetProps {
  initialValue?: string
}

export default function MyWidget({ initialValue = '' }: MyWidgetProps) {
  const [value, setValue] = useState(initialValue)
  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
    </div>
  )
}
```

## Color variables reference
```css
--ink        #1a1917   /* Primary text */
--ink2       #6b6860   /* Secondary text */
--ink3       #a8a49d   /* Muted / labels */
--surface    #ffffff   /* Card background */
--surface2   #f5f4f2   /* Subtle background */
--border     #e8e6e1   /* Default border */
--border2    #d4d0c8   /* Hover border */
--green      #1a7f4e   /* Success / positive */
--green-bg   #f0faf4
--red        #c0392b   /* Error / negative */
--red-bg     #fdf3f2
--blue       #1d5fa8   /* Links / info */
--blue-bg    #f0f5fd
--amber      #92580a   /* Warning */
--amber-bg   #fdf8ed
```

## Adding dark mode support
Currently the project is light-only. To add dark mode:
1. Add `data-theme` to `<html>` in `app/layout.tsx`
2. Add dark mode variables in `globals.css` under `[data-theme="dark"]`
3. Create `components/ui/ThemeToggle.tsx` client component
4. Persist preference with `useLocalStorage('theme', 'light')`

## Recharts wrapper pattern
```tsx
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function PriceChart({ data }: { data: Array<{ time: string; price: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--ink3)' }} width={55} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey="price" stroke="var(--ink)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Badge / tag component
```tsx
export function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    gray:   { bg: 'var(--surface2)',  text: 'var(--ink2)'  },
    green:  { bg: 'var(--green-bg)',  text: 'var(--green)' },
    red:    { bg: 'var(--red-bg)',    text: 'var(--red)'   },
    blue:   { bg: 'var(--blue-bg)',   text: 'var(--blue)'  },
    amber:  { bg: 'var(--amber-bg)',  text: 'var(--amber)' },
  }
  const { bg, text } = map[color] ?? map.gray
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color: text, fontWeight: 500 }}>
      {children}
    </span>
  )
}
```
