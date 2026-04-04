# Debug Workflow — dashboard-hub (STRICT)

Follow this workflow EXACTLY when debugging any issue.

---

# 1. Identify Error Type

Classify the error FIRST:

- Build error (TypeScript / Vercel build fail)
- Runtime error (crash, undefined, fetch failed)
- UI issue (loading stuck, wrong data, wrong active state)
- API issue (status != 200, network error)
- Data issue (wrong mapping, undefined values)

DO NOT jump to fix before classification.

---

# 2. Locate Root Cause

Check in this order:

1. Type mismatch (most common)
2. Undefined / null access
3. Async not handled (missing await / missing catch)
4. External API failure
5. Wrong architecture (calling API inside server component)
6. Environment variable missing

---

# 3. Apply Safe Debug Strategy

## NEVER:
- Patch blindly
- Add `any`
- Add `// @ts-ignore`
- Change multiple unrelated files

## ALWAYS:
- Fix minimal scope
- Preserve architecture
- Keep types correct

---

# 4. Common Fix Patterns

## TypedArray / FileList errors

Replace:
```ts
[...typedArray]
```

With:
```ts
Array.from(typedArray)
```

---

## toFixed undefined error

Replace:
```ts
value.toFixed(2)
```

With:
```ts
Number.isFinite(value) ? value.toFixed(2) : '--'
```

---

## API crash (fetch failed)

Wrap with:

```ts
try {
  ...
} catch {
  return fallback
}
```

---

## Multiple API calls

Replace:
```ts
Promise.all([...])
```

With:
```ts
Promise.allSettled([...])
```

---

## Object indexing error

Replace:
```ts
obj[key]
```

With:
```ts
const keyTyped = key as keyof typeof obj
obj[keyTyped]
```

---

# 5. Async UI Fix Rules

- NEVER leave loading state unresolved
- ALWAYS set loading=false in finally
- ALWAYS handle error state

---

# 6. Services Debug Rules

- Services MUST NOT throw uncaught errors
- Services MUST return fallback
- Services MUST not break UI

---

# 7. Verification Checklist

Before finishing:

- [ ] TypeScript passes
- [ ] No runtime crash possible
- [ ] Handles undefined safely
- [ ] Works without API / KV
- [ ] UI never stuck loading

---

# 8. Output Requirements

When fixing code:

- Show ONLY necessary changes
- Explain root cause briefly
- Keep solution minimal
- Ensure build-safe on Vercel

---

END
