---
name: family-hub
description: >
  Build or extend the /family section of the dashboard. Triggered when the user
  asks about family features: photo upload, check-in, budget, tasks, calendar,
  R2 storage, Vercel KV, family auth, AI caption, face recognition, stories,
  or anything under /family/* routes.
---

# Skill: Family Hub

## Architecture overview

```
/family/*           → Protected by middleware.ts (shared password cookie)
/api/family/*       → API routes (auth, upload, photos, checkins, tasks, budget)

Storage:
  Photos/videos     → Cloudflare R2 (presigned PUT, direct from browser)
  Metadata          → Vercel KV / Upstash Redis (all other data)

AI features (services/family-ai.ts):
  Caption           → Claude Vision → tiếng Việt
  Face detection    → Claude Vision → 'bé' | 'vợ' | 'chồng'
  Story generation  → Claude text → title + narrative
  JP translation    → Claude haiku → check-in tiếng Nhật → tiếng Việt
```

## Key files

| File | Purpose |
|------|---------|
| `middleware.ts` | Shared password auth for all `/family` routes |
| `types/family.ts` | All TypeScript interfaces |
| `services/family-storage.ts` | Vercel KV CRUD helpers |
| `services/family-r2.ts` | R2 presigned upload (S3 sig v4, Web Crypto) |
| `services/family-ai.ts` | Claude Vision: caption, faces, story, translate |
| `app/api/family/auth/route.ts` | POST login, DELETE logout |
| `app/api/family/upload/route.ts` | Presigned URL + metadata save + AI async |
| `app/api/family/photos/route.ts` | List, delete, generate-story |
| `app/api/family/checkins/route.ts` | Check-in CRUD |
| `app/api/family/tasks/route.ts` | Task CRUD with priority/assign |
| `app/api/family/budget/route.ts` | Budget entries by month |
| `components/family/MemoriesClient.tsx` | Tags→Timeline, upload, lightbox, story |
| `components/family/ConnectClient.tsx` | Check-in form + feed |
| `components/family/TasksClient.tsx` | Task list with priority, assign, done |
| `components/family/FinanceClient.tsx` | Budget form + breakdown chart |

## Auth pattern
```ts
// middleware.ts checks /family/* routes
// Cookie: family_auth = SHA256(FAMILY_PASSWORD + FAMILY_COOKIE_SALT)
// Login: POST /api/family/auth { password }
// Logout: DELETE /api/family/auth
```

## Photo upload flow
```
1. Client reads file → getImageDimensions() + getExifDate()
2. POST /api/family/upload → returns { uploadUrl, photo }
3. Client PUTs file directly to R2 uploadUrl
4. Server saves metadata to KV
5. Background: Claude Vision generates caption + detects faces
6. KV updated with caption + faces
```

## Vercel KV key schema
```
family:photos           → FamilyPhoto[]
family:photo:{id}       → FamilyPhoto
family:albums           → PhotoAlbum[]
family:checkins:{YYYY-MM} → DailyCheckIn[]
family:events           → FamilyEvent[]
family:tasks            → FamilyTask[]
family:budget:{YYYY-MM} → BudgetEntry[]
family:stories          → PhotoStory[]
```

## Tags for Memories
`japan` | `family` | `baby` | `couple` | `travel` | `milestone` | custom

## Currency handling (Finance)
- Vietnam expenses: VND
- Japan expenses: JPY (auto-converts using live `/api/prices` forex rate)
- Summary shows both in VND equivalent
- JPY/VND conversion: `amount_jpy / jpy_per_usd * vnd_per_usd` (approx 170 VND/JPY)

## Env vars required
```
FAMILY_PASSWORD             shared family password
FAMILY_COOKIE_SALT          random salt string
FAMILY_KV_REST_API_URL      Vercel KV / Upstash REST URL
FAMILY_KV_REST_API_TOKEN    KV token
R2_ACCOUNT_ID               Cloudflare account ID
R2_ACCESS_KEY_ID            R2 API key
R2_SECRET_ACCESS_KEY        R2 API secret
R2_BUCKET_NAME              R2 bucket name (e.g. family-photos)
R2_PUBLIC_URL               Public CDN URL for bucket
```

## Adding new family features
1. Add type to `types/family.ts`
2. Add storage helpers to `services/family-storage.ts`
3. Add API route under `app/api/family/`
4. Create page under `app/family/`
5. Create client widget under `components/family/`
6. Add to NAV_ITEMS in `lib/constants.ts` (Family group)
