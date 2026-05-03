# Setup family hub

Hướng dẫn từng bước để kích hoạt toàn bộ /family section.

## Steps

1. **Tạo Vercel KV database**
   - Vào vercel.com → project → Storage → Create Database → KV
   - Chọn region: sin1 (Singapore)
   - Copy `KV_REST_API_URL` và `KV_REST_API_TOKEN`
   - Thêm vào `.env.local` với prefix `FAMILY_`:
     ```
     FAMILY_KV_REST_API_URL=https://xxx.upstash.io
     FAMILY_KV_REST_API_TOKEN=AxxxQ==
     ```

2. **Tạo Cloudflare R2 bucket**
   - Vào dash.cloudflare.com → R2 → Create bucket → tên: `family-photos`
   - Settings → Public Access → Allow
   - Copy Public Bucket URL → `R2_PUBLIC_URL`
   - R2 → Manage R2 API tokens → Create token (Object Read & Write) → copy keys
   - Thêm vào `.env.local`:
     ```
     R2_ACCOUNT_ID=xxx
     R2_ACCESS_KEY_ID=xxx
     R2_SECRET_ACCESS_KEY=xxx
     R2_BUCKET_NAME=family-photos
     R2_PUBLIC_URL=https://pub-xxx.r2.dev
     ```

3. **Đặt family password**
   ```
   FAMILY_PASSWORD=mat-khau-gia-dinh
   FAMILY_COOKIE_SALT=dashboard-hub-family-2025
   ```

4. **Copy files vào project** (từ family-patch folder):
   - `types/family.ts` → `types/family.ts`
   - `types/family-types.ts` → `types/family-types.ts`
   - `services/family-*.ts` → `services/`
   - `app/family/**` → `app/family/`
   - `app/api/family/**` → `app/api/family/`
   - `components/family/**` → `components/family/`
   - `middleware.ts` → root (merge nếu đã có)

5. **Update lib/constants.ts** — thêm Family nav group:
   ```ts
   {
     group: 'Family',
     items: [
       { label: 'Home',     href: '/family',          icon: '🏠' },
       { label: 'Memories', href: '/family/memories',  icon: '📸' },
       { label: 'Connect',  href: '/family/connect',   icon: '💬' },
       { label: 'Plan',     href: '/family/plan',      icon: '📅' },
       { label: 'Finance',  href: '/family/finance',   icon: '💴' },
       { label: 'Tasks',    href: '/family/tasks',     icon: '✅' },
       { label: 'Photos',   href: '/family/photos',    icon: '🖼' },
     ],
   },
   ```

6. **Cài đặt Google Photos sync (Picker API)**

   > ⚠ Photos Library API bị deprecated từ March 2025. Dùng Picker API thay thế.

   a. **Tạo Google Cloud OAuth credentials**
      - Vào [console.cloud.google.com](https://console.cloud.google.com) → tạo project mới hoặc chọn project có sẵn
      - APIs & Services → Credentials → Create Credentials → OAuth client ID
      - Application type: Web application
      - Authorized redirect URIs: `http://localhost:3000/api/google-oauth/callback`
      - Copy `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` → thêm vào `.env.local`

   b. **Cấu hình OAuth consent screen**
      - APIs & Services → OAuth consent screen
      - User Type: External → Create
      - App name, support email → Save
      - Scopes → Add or Remove Scopes → paste vào "Enter manually":
        ```
        https://www.googleapis.com/auth/photospicker.mediaitems.readonly
        ```
        → Add to table → check → Update → Save
      - Test users → Add your Gmail address → Save

   c. **Enable Google Photos Picker API**
      - APIs & Services → Library → search "Photos Picker" → Enable

   d. **Kết nối từ UI**
      - Vào `/family/setup` → click "Connect Google Photos"
      - Approve consent → thấy "✓ Google Photos connected!"
      - Vào `/family/photos` → click "🔄 Sync ảnh" → chọn ảnh trong picker tab

7. **Test locally**
   ```bash
   npm run dev
   # Vào http://localhost:3000/family
   # Nhập password → xem home → upload ảnh thử
   # Vào /family/photos → sync từ Google Photos
   ```

8. **Deploy Vercel** — thêm tất cả env vars trong Vercel Dashboard:
   Project → Settings → Environment Variables → Add
   ```
   FAMILY_PASSWORD, FAMILY_COOKIE_SALT
   FAMILY_KV_REST_API_URL, FAMILY_KV_REST_API_TOKEN
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   ```
   Sau khi deploy, thêm production redirect URI vào Google Cloud Console:
   `https://your-domain.com/api/google-oauth/callback`

9. **Verify**:
   - `/family/login` hiện password form
   - `/family` hiện hub page sau login
   - `/family/memories` → upload 1 ảnh → AI caption trong ~10 giây
   - `/family/connect` → gửi check-in → hiện trong feed
   - `/family/photos` → sync → ảnh Google Photos hiện trong timeline

## Google Photos Picker flow (tóm tắt)

```
/family/setup → OAuth → refresh_token lưu vào KV
/family/photos → "Sync ảnh" → Picker session → user chọn ảnh → save to KV
KV key: family:google_picked_photos → { photos: GoogleFamilyPhoto[], syncedAt }
```

Photos từ Picker có baseUrl có hiệu lực trong session. Re-sync khi ảnh bị expired.
