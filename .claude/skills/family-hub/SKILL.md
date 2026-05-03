---
name: family-hub
description: >
  Build or extend the /family section of the dashboard. Triggered when the user
  asks about family features: photo upload, check-in, budget, tasks, calendar,
  R2 storage, Vercel KV, family auth, AI caption, face recognition, stories,
  Google Photos sync, or anything under /family/* routes.
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

Google Photos sync (Picker API):
  OAuth             → /api/google-oauth/start + /api/google-oauth/callback
  Picker session    → /api/family/photos/picker (POST/GET/PUT)
  Picked photos     → saved to KV key family:google_picked_photos
```

## Key files

| File | Purpose |
|------|---------|
| `middleware.ts` | Shared password auth for all `/family` routes |
| `types/family.ts` | All TypeScript interfaces |
| `services/family-storage.ts` | Vercel KV CRUD helpers |
| `services/family-r2.ts` | R2 presigned upload (S3 sig v4, Web Crypto) |
| `services/family-ai.ts` | Claude Vision: caption, faces, story, translate |
| `services/googlePhotos.ts` | Reads picked photos from KV; token refresh |
| `services/googlePhotosPicker.ts` | Google Photos Picker API client |
| `app/api/family/auth/route.ts` | POST login, DELETE logout |
| `app/api/family/upload/route.ts` | Presigned URL + metadata save + AI async |
| `app/api/family/photos/route.ts` | List, delete, generate-story |
| `app/api/family/photos/picker/route.ts` | POST create session · GET poll · PUT save items |
| `app/api/family/checkins/route.ts` | Check-in CRUD |
| `app/api/family/tasks/route.ts` | Task CRUD with priority/assign |
| `app/api/family/budget/route.ts` | Budget entries by month |
| `app/api/google-oauth/start/route.ts` | Redirects to Google OAuth consent |
| `app/api/google-oauth/callback/route.ts` | Exchanges code → saves refresh_token to KV |
| `app/family/setup/page.tsx` | Google Photos setup guide (server component) |
| `app/family/setup/SetupClient.tsx` | Setup UI with error diagnosis |
| `components/family/PhotosHubClient.tsx` | Photos page: timeline, upload, stories, picker sync |
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

## Google Photos sync — Picker API flow

Google Photos Library API is **deprecated for new projects (March 2025)** and requires
restricted-scope app verification. Use the **Picker API** instead:
scope `photospicker.mediaitems.readonly` — not restricted, works in Testing mode.

```
1. User goes to /family/setup → clicks "Connect Google Photos"
2. OAuth start: GET /api/google-oauth/start
   → redirects to Google consent (scope: photospicker.mediaitems.readonly)
3. OAuth callback: GET /api/google-oauth/callback?code=...
   → exchanges code for refresh_token → saves to KV: google_oauth:refresh_token
4. On /family/photos, user clicks "🔄 Sync ảnh"
5. Client: POST /api/family/photos/picker
   → server calls Picker API createSession with fresh access_token
   → returns { sessionId, pickerUri }
6. Client opens pickerUri in new tab (Google's picker UI)
7. Client polls GET /api/family/photos/picker?sessionId=... every 5s
8. When session.mediaItemsSet === true:
   → Client calls PUT /api/family/photos/picker { sessionId }
   → Server fetches media items → saves to KV: family:google_picked_photos
9. Page refreshes → photos appear in timeline
```

**Why Picker API:** User explicitly selects photos to share → no continuous background access needed.
Photos are saved to KV after sync and persist across page loads.
BaseUrls from Picker API are session-scoped; re-sync to refresh.

## Photo upload flow (local R2)
```
1. Client reads file → getImageDimensions() + getExifDate()
2. User selects tags via the upload tag picker (uploadTags state, default: ['family'])
3. POST /api/family/upload → body includes tags: uploadTags → returns { uploadUrl, photo }
4. Client PUTs file directly to R2 uploadUrl
5. Server saves metadata (incl. selected tags) to KV
6. Background: Claude Vision generates caption + detects faces
7. KV updated with caption + faces (tags are NOT overwritten by AI step)
```

**Important:** Upload tags come from the dedicated `uploadTags` state (shown as a tag picker in
the Upload view), NOT from `activeTag` (the filter). These are two separate concerns.

## Vercel KV key schema
```
family:photos                → FamilyPhoto[]          (R2-uploaded photos)
family:photo:{id}            → FamilyPhoto
family:albums                → PhotoAlbum[]
family:checkins:{YYYY-MM}    → DailyCheckIn[]
family:events                → FamilyEvent[]
family:tasks                 → FamilyTask[]
family:budget:{YYYY-MM}      → BudgetEntry[]
family:stories               → PhotoStory[]
family:photo_stories         → FamilyPhotoStory[]     (photos hub stories)
family:google_albums_cache   → { albums, cachedAt }   (unused with Picker API)
family:google_picked_photos  → { photos: GoogleFamilyPhoto[], syncedAt }
google_oauth:refresh_token   → string                 (stored by OAuth callback)
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
GOOGLE_CLIENT_ID            Google OAuth client ID
GOOGLE_CLIENT_SECRET        Google OAuth client secret
# GOOGLE_REFRESH_TOKEN is stored in KV via /family/setup — do not set in .env.local
```

## Adding new family features
1. Add type to `types/family.ts`
2. Add storage helpers to `services/family-storage.ts`
3. Add API route under `app/api/family/`
4. Create page under `app/family/`
5. Create client widget under `components/family/`
6. Add to NAV_ITEMS in `lib/constants.ts` (Family group)
