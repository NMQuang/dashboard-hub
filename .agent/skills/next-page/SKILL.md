---
name: next-page
description: >
  Create a new page in the nexus.hq dashboard. Triggered when the user asks to
  "add a page", "create a new section", "build the /learn/... page", or similar.
  Handles the full flow: page.tsx, metadata, sidebar link, types if needed.
---

# Skill: Create a new dashboard page

## Context
This is a Next.js 14 App Router project. Pages live in `app/**/**/page.tsx`.
The sidebar is defined in `lib/constants.ts` → `NAV_ITEMS`.
Shared components: `Card`, `CardHeader`, `CardTitle`, `CardAction`, `SectionLabel` from `components/ui/Card.tsx`.

## Steps

### 1. Confirm the route
Ask: "What is the route? e.g. `/learn/vocabulary` or `/work/notes`"
Map to file path: `/learn/vocabulary` → `app/learn/vocabulary/page.tsx`

### 2. Create the page file
```tsx
// app/{route}/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = { title: '{Page Title}' }

export default function {PageName}Page() {
  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          {breadcrumb path}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          {Title} <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>{subtitle}</span>
        </h1>
      </div>
      {/* page content */}
    </div>
  )
}
```

### 3. Add to sidebar
In `lib/constants.ts`, find the matching group in `NAV_ITEMS` and add:
```ts
{ label: '{Label}', href: '/{route}', icon: '{icon char}' }
```

### 4. Add to Home quick-nav (if it's a top-level section)
In `app/page.tsx`, add an entry to the quick-nav grid array.

### 5. Create client widget if needed
If the page needs client interactivity (hooks, state, events), create:
`components/widgets/{PageName}Client.tsx` with `'use client'` directive.
Import and render it inside the Server Component page.

### 6. Add API route if needed
If the page fetches external data:
- Create `app/api/{name}/route.ts`
- Create `services/{name}.ts` with the fetch logic
- Add env var to `.env.local.example` and `app/settings/page.tsx`

## Checklist before finishing
- [ ] `page.tsx` has correct `export const metadata`
- [ ] Breadcrumb matches the route
- [ ] Sidebar link added to `NAV_ITEMS`
- [ ] No hardcoded colors — using CSS variables
- [ ] Client components marked with `'use client'`
- [ ] API keys in `.env.local.example` if applicable
