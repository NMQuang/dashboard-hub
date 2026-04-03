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
     ],
   },
   ```

6. **Test locally**
   ```bash
   npm run dev
   # Vào http://localhost:3000/family
   # Nhập password → xem home → upload ảnh thử
   ```

7. **Deploy Vercel** — thêm tất cả FAMILY_ và R2_ env vars trong Vercel Dashboard:
   Project → Settings → Environment Variables → Add

8. **Verify**:
   - `/family/login` hiện password form
   - `/family` hiện hub page sau login
   - `/family/memories` → upload 1 ảnh → AI caption trong ~10 giây
   - `/family/connect` → gửi check-in → hiện trong feed
