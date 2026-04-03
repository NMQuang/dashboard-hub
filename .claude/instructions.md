# dashboard-hub — Claude Operating Instructions (STRICT MODE)

You are working on a production-grade personal dashboard project.

This instruction file MUST be followed strictly. Do not override, ignore, or reinterpret rules unless explicitly told.

---

# 1. Project Overview

Project: dashboard-hub

Purpose:
- Japanese learning
- IBM Mainframe / COBOL study
- Market data (gold, crypto, forex)
- AI Hub (Claude, GPT, Gemini)
- GitHub project viewer
- Family module (auth + storage)

Stack:
- Next.js 14 App Router
- TypeScript (strict)
- Tailwind CSS
- Vercel deployment

---

# 2. Core Architecture (MANDATORY)

## Separation of concerns

- `services/` → ALL external data logic (API, KV, scraping)
- `app/` → routing + server components only
- `components/` → UI only (no business logic)
- `lib/` → utilities, hooks, constants

## Rules

- NEVER fetch external APIs inside components
- NEVER fetch internal `/api/*` from Server Components
- ALWAYS call `services/*` directly in Server Components

Correct:
```ts
import { fetchMarket } from '@/services/market'
````

Wrong:

```ts
fetch('/api/prices')
```

---

# 3. TypeScript Rules (STRICT)

* NEVER use `any`
* NEVER use `// @ts-ignore`
* ALWAYS define return types for functions
* ALWAYS define prop types

## Object indexing

* NEVER index object with untyped key

Correct:

```ts
const map: Record<'high'|'medium'|'low', number>
```

Wrong:

```ts
map[a.priority]
```

---

# 4. Runtime Safety (CRITICAL)

## TypedArray / FileList

NEVER use spread operator on:

* Uint8Array
* FileList
* ArrayBuffer views
* DOM collections

Forbidden:

```ts
[...new Uint8Array(buf)]
[...(e.target.files)]
```

Required:

```ts
Array.from(new Uint8Array(buf))
Array.from(e.target.files ?? [])
```

## String conversion

Forbidden:

```ts
String.fromCharCode(...typedArray)
```

Required:

```ts
Array.from(typedArray, b => String.fromCharCode(b)).join('')
```

---

# 5. Data Fetching Rules

## Server Components

* Use `fetch()` or service functions
* Use `next: { revalidate: N }`

## Multiple APIs

* ALWAYS use `Promise.allSettled`
* NEVER use `Promise.all` for external APIs

---

# 6. Resilience (VERY IMPORTANT)

This project must NEVER crash due to external failures.

## Services

* MUST catch errors
* MUST return fallback data
* MUST NOT throw unhandled errors

## UI

* MUST always render
* MUST handle missing data gracefully

Examples:

* API fails → show placeholder
* KV fails → fallback to memory
* AI fails → show fallback message

---

# 7. Async UI Safety

ALL async UI must:

* Have loading state
* Have error state
* ALWAYS resolve (no infinite loading)

Forbidden:

* Button stuck in loading
* Promise without catch

---

# 8. Environment Variables

* NEVER assume env exists
* ALWAYS validate before use

Example:

```ts
if (!API_KEY) return fallback
```

---

# 9. Services Layer Rules

Services must:

* Be pure functions
* Return normalized data
* Not depend on React
* Not access DOM
* Not throw uncaught external errors

Services must NOT:

* Import from components
* Use hooks
* Use browser APIs

---

# 10. Styling Rules

* Use Tailwind for layout
* Use CSS variables for colors

Forbidden:

```ts
style={{ color: '#333' }}
```

Allowed:

```ts
color: var(--ink)
```

---

# 11. Next.js Rules

* Server Components by default
* Add `'use client'` ONLY when needed
* API routes use `NextRequest`, `NextResponse`
* No `pages/` directory

---

# 12. Performance Rules

* Prefer Server Components
* Avoid large client bundles
* Use proper `revalidate`:

  * market: 60s
  * github: 300s
  * static: 3600s

---

# 13. Security Rules

* API keys are server-only
* NEVER expose secrets
* NEVER access `process.env` in client components

---

# 14. Git Rules

* Use conventional commits:
  feat(scope): message
  fix(scope): message

* NEVER commit to main directly

---

# 15. Known Pitfalls (DO NOT REPEAT)

* Spread operator on typed arrays → BREAKS build
* FileList spread → BREAKS build
* fetch() without catch → UI freeze
* API dependency → must fallback
* Missing env → must fallback
* Internal API call from server → wrong architecture
* Object indexing without typing → TS error

---

# 16. Behavior Rules (CRITICAL)

You MUST:

* Follow ALL rules above
* Refuse to generate code that violates rules
* Prefer safe code over clever code
* Prefer explicit over implicit

If unsure:

* choose safest implementation
* add fallback
* add type

---

# 17. Output Expectations

When generating code:

* MUST be TypeScript-safe
* MUST be build-safe on Vercel
* MUST not introduce runtime crashes
* MUST include error handling
* MUST follow project structure