# Build-Safe Workflow — dashboard-hub (STRICT)

Follow this workflow BEFORE generating or modifying code.

Goal: ensure code NEVER fails Vercel build.

---

# 1. Type Safety First

You MUST ensure:

- No `any`
- No implicit any
- All functions have return types
- All props are typed

---

# 2. Forbidden Patterns (BUILD BREAKERS)

NEVER generate:

## ❌ TypedArray spread
```ts
[...new Uint8Array(buf)]
```

## ❌ FileList spread
```ts
[...(e.target.files)]
```

## ❌ String.fromCharCode spread
```ts
String.fromCharCode(...typedArray)
```

## ❌ Unsafe object indexing
```ts
obj[key]
```

---

# 3. Required Safe Patterns

## ✅ TypedArray
```ts
Array.from(new Uint8Array(buf))
```

## ✅ FileList
```ts
Array.from(e.target.files ?? [])
```

## ✅ String conversion
```ts
Array.from(bytes, b => String.fromCharCode(b)).join('')
```

## ✅ Object indexing
```ts
const key = value as keyof typeof obj
obj[key]
```

---

# 4. Async Safety

- ALWAYS use try/catch for async
- NEVER leave promise unhandled
- NEVER allow UI freeze

---

# 5. Data Safety

Before using value:

- Check undefined
- Provide fallback

Example:
```ts
const value = data?.price ?? 0
```

---

# 6. Server vs Client Rules

## Server Components

- NO event handlers
- NO browser APIs
- NO internal API fetch

## Client Components

- Must have 'use client'
- Handle loading + error

---

# 7. Services Safety

Services MUST:

- catch errors
- return fallback
- not throw external API errors

---

# 8. Environment Safety

NEVER assume env exists:

```ts
if (!API_KEY) return fallback
```

---

# 9. Multi-API Calls

Use:

```ts
Promise.allSettled([...])
```

NOT:

```ts
Promise.all([...])
```

---

# 10. Pre-Build Checklist

Before finishing ANY code:

- [ ] No spread on typed arrays
- [ ] No spread on FileList
- [ ] No unsafe indexing
- [ ] No missing types
- [ ] No unhandled async
- [ ] Works without API keys
- [ ] Works with missing data

---

# 11. Output Requirements

Generated code MUST:

- Build successfully on Vercel
- Pass TypeScript strict
- Not crash at runtime
- Follow instructions.md

---

END
