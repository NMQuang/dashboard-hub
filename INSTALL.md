# Family Hub — Integration Guide

Patch này thêm toàn bộ `/family` section vào project `my-dashboard`.

## Files trong patch này

```
family-patch/
├── types/
│   ├── family.ts              → Copy vào types/family.ts
│   └── family-types.ts        → Copy vào types/family-types.ts
├── services/
│   ├── family-storage.ts      → Copy vào services/
│   ├── family-r2.ts           → Copy vào services/
│   └── family-ai.ts           → Copy vào services/
├── middleware.ts               → Copy vào ROOT (hoặc merge)
├── app/
│   ├── family/
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── memories/page.tsx
│   │   ├── connect/page.tsx
│   │   ├── plan/page.tsx
│   │   ├── finance/page.tsx
│   │   └── tasks/page.tsx
│   └── api/family/
│       ├── auth/route.ts
│       ├── upload/route.ts
│       ├── photos/route.ts
│       ├── checkins/route.ts
│       ├── tasks/route.ts
│       └── budget/route.ts
├── components/family/
│   ├── MemoriesClient.tsx
│   ├── ConnectClient.tsx
│   ├── TasksClient.tsx
│   └── FinanceClient.tsx
├── lib/
│   └── constants-family-patch.ts  → Xem file này để update lib/constants.ts
├── env-family-additions.txt        → Thêm vào .env.local
└── .agent/
    ├── skills/family-hub/SKILL.md  → Copy vào .agent/skills/
    └── workflows/setup-family.md   → Copy vào .agent/workflows/
```

## Bước tích hợp

### 1. Copy tất cả files
```bash
# Từ thư mục chứa family-patch, chạy:
cp -r family-patch/types/family*.ts        my-dashboard/types/
cp -r family-patch/services/family-*.ts    my-dashboard/services/
cp -r family-patch/app/family              my-dashboard/app/
cp -r family-patch/app/api/family          my-dashboard/app/api/
cp -r family-patch/components/family       my-dashboard/components/
cp    family-patch/middleware.ts           my-dashboard/   # nếu chưa có
cp -r family-patch/.agent/skills/family-hub   my-dashboard/.agent/skills/
cp    family-patch/.agent/workflows/setup-family.md  my-dashboard/.agent/workflows/
```

### 2. Update lib/constants.ts
Mở `lib/constants.ts`, thêm Family group vào `NAV_ITEMS` (xem `lib/constants-family-patch.ts`).

### 3. Update .env.local
Thêm nội dung từ `env-family-additions.txt` vào `.env.local` và `.env.local.example`.

### 4. Setup external services

**Vercel KV** (lưu metadata):
- vercel.com → Project → Storage → Create KV → copy URL + token

**Cloudflare R2** (lưu ảnh):
- dash.cloudflare.com → R2 → Create bucket `family-photos`
- Enable public access → copy Public URL
- R2 API tokens → Create → Object Read & Write → copy keys

### 5. Test
```bash
npm run dev
# http://localhost:3000/family → nhập password
```

## Tổng kết tính năng

| Route | Tính năng |
|-------|-----------|
| `/family` | Hub: stats, recent check-ins, upcoming events, latest photo |
| `/family/memories` | Tags → Timeline, upload, lightbox, AI story generation |
| `/family/connect` | Daily check-in với mood, JP input, AI translate sang VN |
| `/family/plan` | Upcoming events (60 ngày), add lịch bay/sinh nhật/bác sĩ |
| `/family/finance` | Chi tiêu VN + Nhật, tỷ giá JPY/VND live, breakdown theo category |
| `/family/tasks` | Shared task list, priority, assign vợ/chồng, tick done |

## Auth
- 1 password chung → cookie httpOnly 30 ngày
- `/family/login` để đăng nhập
- `DELETE /api/family/auth` để logout
- Không cần tài khoản riêng

## AI features (cần ANTHROPIC_API_KEY)
- Caption ảnh tự động bằng tiếng Việt (Claude Vision)
- Nhận diện bé/vợ/chồng trong ảnh
- Tạo story/narrative từ album ảnh
- Dịch check-in tiếng Nhật → tiếng Việt
