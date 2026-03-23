# nexus.hq — Personal Command Center

> Dashboard cá nhân: Japanese learning · IBM Mainframe/COBOL · Market prices · AI Hub · GitHub projects

**Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS · Vercel

---

## Mục lục

- [Cấu trúc project](#cấu-trúc-project)
- [Quick start (local)](#quick-start-local)
- [API Keys](#api-keys)
- [Deploy lên Vercel](#deploy-lên-vercel)
- [Tính năng từng trang](#tính-năng-từng-trang)
- [Làm việc với Antigravity Agent](#làm-việc-với-antigravity-agent)
  - [Rules](#rules)
  - [Skills](#skills)
  - [Workflows](#workflows)
- [Mở rộng project](#mở-rộng-project)
- [Troubleshooting](#troubleshooting)

---

## Cấu trúc project

```
my-dashboard/
├── app/                          ← Next.js App Router pages & API routes
│   ├── page.tsx                  ← Home: command center
│   ├── layout.tsx                ← Root layout (sidebar + fonts)
│   ├── globals.css               ← CSS variables, base styles
│   ├── learn/
│   │   ├── japanese/page.tsx     ← AI chat + N2 study tracker
│   │   ├── mainframe/page.tsx    ← COBOL reader + IBM docs
│   │   └── ai-dev/page.tsx       ← Dify / AWS / Claude docs
│   ├── work/
│   │   ├── tools/page.tsx        ← App launcher
│   │   ├── ai-hub/page.tsx       ← Claude + GPT + Gemini + saved prompts
│   │   └── projects/
│   │       ├── page.tsx          ← GitHub repo list
│   │       └── [repo]/page.tsx   ← Repo detail / README / docs
│   ├── invest/
│   │   ├── market/page.tsx       ← Gold + crypto dashboard
│   │   ├── alerts/page.tsx       ← Dify workflow config + history
│   │   └── watchlist/page.tsx    ← Saved symbols
│   ├── settings/page.tsx         ← API keys guide + deploy info
│   └── api/
│       ├── prices/route.ts       ← GoldAPI + CoinGecko proxy
│       ├── ai-chat/route.ts      ← Claude / OpenAI / Gemini streaming
│       ├── github/route.ts       ← GitHub API proxy
│       └── dify/route.ts         ← Dify workflow trigger
│
├── components/
│   ├── layout/Sidebar.tsx        ← Navigation sidebar
│   ├── ui/                       ← Shared primitives (Card, ChatBox)
│   └── widgets/                  ← Page-specific client components
│
├── services/                     ← Server-only fetch functions
│   ├── market.ts                 ← GoldAPI + CoinGecko + Forex
│   ├── github.ts                 ← GitHub REST + GraphQL
│   ├── ai.ts                     ← Claude / OpenAI / Gemini streaming
│   └── dify.ts                   ← Dify workflow + chat
│
├── lib/
│   ├── utils.ts                  ← Helpers: formatPrice, timeAgo, greetingJapanese
│   ├── constants.ts              ← NAV_ITEMS, AI_PROVIDERS, COBOL_KEYWORDS
│   └── hooks.ts                  ← useMarket, useClock, useLocalStorage
│
├── types/index.ts                ← All TypeScript interfaces
├── data/prompts.ts               ← Saved AI prompts library
│
├── .agent/                       ← Antigravity agent configuration
│   ├── rules/rules.md            ← Always-on coding rules
│   ├── skills/                   ← Context-triggered knowledge
│   └── workflows/                ← Step-by-step task playbooks
│
├── .env.local.example            ← API key template
├── vercel.json                   ← Vercel deploy config (region: sin1)
└── README.md                     ← This file
```

---

## Quick start (local)

### Yêu cầu
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)

### 1. Clone hoặc giải nén project

```bash
# Nếu clone từ GitHub
git clone https://github.com/your-username/my-dashboard.git
cd my-dashboard

# Nếu giải nén từ zip
unzip my-dashboard.zip
cd my-dashboard
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình environment

```bash
cp .env.local.example .env.local
```

Mở `.env.local` và điền API keys (xem chi tiết ở [phần API Keys](#api-keys)).

### 4. Chạy dev server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

### 5. Build production (kiểm tra trước khi deploy)

```bash
npm run build
npm run start
```

---

## API Keys

Tất cả keys được lưu trong `.env.local` — file này **không bao giờ được commit** lên Git (đã có trong `.gitignore`).

### Bảng tổng hợp

| Variable | Bắt buộc | Lấy ở đâu | Dùng cho |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | [console.anthropic.com](https://console.anthropic.com) | AI chat (Claude) |
| `OPENAI_API_KEY` | ✅ | [platform.openai.com](https://platform.openai.com) | AI chat (GPT-4o) |
| `GEMINI_API_KEY` | ✅ | [aistudio.google.com](https://aistudio.google.com) | AI chat (Gemini) |
| `GOLD_API_KEY` | ⚡ | [goldapi.io](https://goldapi.io) | Giá vàng realtime |
| `COINGECKO_API_KEY` | optional | [coingecko.com](https://www.coingecko.com/en/api) | Giá crypto (free tier OK) |
| `GITHUB_TOKEN` | ⚡ | GitHub → Settings → PAT | Load repos + README |
| `GITHUB_USERNAME` | ⚡ | GitHub handle của bạn | Xác định repos |
| `DIFY_API_KEY` | optional | [app.dify.ai](https://app.dify.ai) | Daily market brief |
| `DIFY_BASE_URL` | optional | `https://api.dify.ai/v1` | Dify API endpoint |
| `WEATHER_API_KEY` | optional | [openweathermap.org](https://openweathermap.org/api) | Thời tiết Tokyo/HCM |
| `NEXT_PUBLIC_ONSITE_DATE` | optional | Ngày bạn onsite Nhật | Countdown timer |
| `NEXT_PUBLIC_GITHUB_USERNAME` | optional | GitHub handle | Hiển thị trên UI |

> **⚡** = Strongly recommended — tính năng chính bị ảnh hưởng nếu thiếu

### Hướng dẫn lấy từng key

#### Anthropic (Claude)
1. Vào [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Copy key bắt đầu bằng `sk-ant-...`

#### OpenAI (GPT-4o)
1. Vào [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Create new secret key**
3. Copy key bắt đầu bằng `sk-...`

#### Google Gemini
1. Vào [aistudio.google.com](https://aistudio.google.com)
2. **Get API Key** → **Create API key**
3. Copy key bắt đầu bằng `AIza...`

#### GoldAPI (giá vàng)
1. Đăng ký tại [goldapi.io](https://goldapi.io) (free tier: 100 req/month)
2. Dashboard → **API Key**
3. Copy key

#### GitHub PAT
1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** → Chọn scopes: `repo` (read), `read:user`
3. Copy token bắt đầu bằng `ghp_...`

#### Dify
1. Đăng ký tại [app.dify.ai](https://app.dify.ai)
2. Tạo app mới (Workflow type)
3. **API Access** → Copy API key bắt đầu bằng `app-...`

### File `.env.local` hoàn chỉnh

```bash
# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxx

# Market
GOLD_API_KEY=goldapi-xxxxxxxxxxxxxxxx
COINGECKO_API_KEY=CG-xxxxxxxxxxxxxxxx

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-handle

# Dify
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1

# Weather
WEATHER_API_KEY=xxxxxxxxxxxxxxxx

# App config
NEXT_PUBLIC_ONSITE_DATE=2025-07-01
NEXT_PUBLIC_GITHUB_USERNAME=your-github-handle
NEXT_PUBLIC_APP_NAME=QuangNM HUB
```

---

## Deploy lên Vercel

### Option A: CLI (nhanh nhất)

```bash
# Cài Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Option B: GitHub → Vercel (recommended cho CI/CD)

1. Push project lên GitHub repo
2. Vào [vercel.com/new](https://vercel.com/new) → **Import** repo
3. Framework: **Next.js** (tự detect)
4. **Add environment variables** (xem bảng ở trên) — paste toàn bộ từ `.env.local`
5. **Deploy**

Mỗi lần `git push` lên `main` sẽ auto-deploy.

### Cấu hình Vercel

`vercel.json` đã được cấu hình sẵn với region `sin1` (Singapore — gần nhất với HCMC và Tokyo):

```json
{
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

### Thêm Cron Job (daily market brief)

Thêm vào `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/market-brief",
      "schedule": "0 22 * * *"
    }
  ]
}
```

> `0 22 * * *` UTC = **07:00 JST** (Japan) = **05:00 ICT** (Vietnam)

### Kiểm tra sau deploy

```bash
# Health check
curl https://your-app.vercel.app/api/prices

# Test AI chat
curl -X POST https://your-app.vercel.app/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello","id":"1","createdAt":"2025-01-01"}],"provider":"claude"}'
```

---

## Tính năng từng trang

| Route | Tính năng | API cần |
|---|---|---|
| `/` | Greeting JP, countdown, market mini, GitHub activity, focus tracker | Market + GitHub |
| `/learn/japanese` | AI conversation, N2 progress, quick prompts, study plan | `ANTHROPIC_API_KEY` |
| `/learn/mainframe` | COBOL paste + AI analyzer, IBM docs links, PIC cheatsheet | `ANTHROPIC_API_KEY` |
| `/learn/ai-dev` | Dify/AWS/Claude docs, AI assistant | `ANTHROPIC_API_KEY` |
| `/work/tools` | App launcher grid | — |
| `/work/ai-hub` | Multi-model chat (Claude/GPT/Gemini), saved prompts | All 3 AI keys |
| `/work/projects` | GitHub repo list | `GITHUB_TOKEN` |
| `/work/projects/[repo]` | README render, file tree, commits | `GITHUB_TOKEN` |
| `/invest/market` | Live gold + crypto + forex, charts | `GOLD_API_KEY` + `COINGECKO_API_KEY` |
| `/invest/alerts` | Dify workflow status + trigger | `DIFY_API_KEY` |
| `/invest/watchlist` | Saved symbols manager | — |
| `/settings` | API key guide, deploy instructions | — |

---

## Làm việc với Antigravity Agent

Project này được cấu hình sẵn cho [Antigravity](https://antigravity.dev) với 3 loại agent config trong thư mục `.agent/`.

```
.agent/
├── rules/
│   └── rules.md            ← Luôn active — coding conventions
├── skills/                 ← Tự kích hoạt theo intent
│   ├── next-page/
│   ├── cobol-reader/
│   ├── market-api/
│   ├── japanese-tutor/
│   ├── github-sync/
│   ├── dify-workflow/
│   ├── deploy-vercel/
│   └── add-feature/
└── workflows/              ← Gọi bằng /command
    ├── new-page.md
    ├── add-coin.md
    ├── sync-github-docs.md
    ├── setup-dify-alert.md
    ├── deploy.md
    └── add-prompt.md
```

---

### Rules

**File:** `.agent/rules/rules.md`

Rules luôn được load vào context agent — hoạt động như system prompt cho toàn bộ project. Bao gồm:

- TypeScript conventions (strict mode, no `any`, type placement)
- Next.js App Router patterns (Server vs Client components)
- File structure rules (service files là server-only, v.v.)
- CSS variable usage (không hardcode màu hex)
- Forbidden actions (không `npm install` mà không hỏi, không commit `.env.local`)
- Git commit message format

**Không cần làm gì** — rules tự động áp dụng khi dùng Antigravity trong project này.

---

### Skills

Skills được **tự động kích hoạt** khi agent nhận diện intent phù hợp. Bạn không cần gọi skill bằng tên — chỉ cần nói tự nhiên.

#### `cobol-reader` — Phân tích COBOL/JCL

**Kích hoạt khi:** bạn paste COBOL code, hỏi về mainframe, JCL, VSAM, DB2, ISPF, z/OS.

```
# Ví dụ prompts kích hoạt skill này:
"Giải thích đoạn COBOL này"
"Write a JCL to run my COBOL batch job"
"What does COMP-3 mean in a PIC clause?"
"How do I read a VSAM KSDS file in COBOL?"
```

Skill cung cấp cho agent: PIC clause reference, JCL patterns, IBM docs links, COBOL division structure, common patterns (file I/O, DB2 cursor, COPY books).

---

#### `market-api` — Market data integration

**Kích hoạt khi:** hỏi về giá vàng/crypto, thêm coin mới, build chart, cấu hình price alert.

```
"Add a price chart for gold"
"Add LINK token to the watchlist"
"Why is the CoinGecko API returning 429?"
"Build a 24h price trend chart with Recharts"
```

Skill cung cấp: API endpoints, CoinGecko ID map, Recharts templates, cache strategy, alert setup.

---

#### `japanese-tutor` — Japanese learning features

**Kích hoạt khi:** hỏi về tính năng học tiếng Nhật, JLPT, shadowing, kanji, keigo.

```
"Add a shadowing exercise feature"
"Create a JLPT N2 quiz generator"
"Add NHK Easy integration to the Japanese page"
"Show useful Japanese phrases for IBM workplace"
```

Skill cung cấp: NHK Easy integration, quick prompt list, keigo patterns, study tracker, JLPT skill targets.

---

#### `github-sync` — GitHub integration

**Kích hoạt khi:** hỏi về load repos, sync docs, file tree, contributions, GitHub API.

```
"Load README from my ibm repo"
"Why is GitHub API returning 401?"
"Add contribution heatmap to the home page"
"Sync my COBOL docs from the ibm repo into /learn/mainframe"
```

Skill cung cấp: API actions reference, repo config, markdown rendering guide, rate limit info, contributions GraphQL query.

---

#### `dify-workflow` — Dify integration

**Kích hoạt khi:** hỏi về Dify, daily report, automated alert, workflow trigger.

```
"Set up a daily market brief using Dify"
"Build a price alert that triggers when gold moves 1.5%"
"How do I pass inputs to a Dify workflow?"
"Create a Vercel cron for the daily brief"
```

Skill cung cấp: Dify API format, workflow node design, cron setup, Vercel schedule config.

---

#### `deploy-vercel` — Deployment

**Kích hoạt khi:** hỏi về deploy, build error, env vars on Vercel, custom domain.

```
"Deploy the dashboard to Vercel"
"Fix: Type error: Property X does not exist"
"Add the GOLD_API_KEY to production"
"Set up a custom domain"
```

Skill cung cấp: pre-deploy checklist, CLI commands, env var list, common error fixes, cron setup.

---

#### `next-page` — Tạo page mới

**Kích hoạt khi:** hỏi về thêm page, section, route mới.

```
"Add a /learn/vocabulary page"
"Create a new section for work notes"
"Build the /invest/portfolio page"
```

Skill cung cấp: page template, metadata pattern, sidebar update steps, client widget pattern.

---

#### `add-feature` — Thêm UI component

**Kích hoạt khi:** hỏi về component mới, widget, chart, dark mode, table.

```
"Add a dark mode toggle"
"Create a reusable Badge component"
"Build a data table for the market page"
"Add a loading skeleton to the home page"
```

Skill cung cấp: component templates (server + client), color variables reference, Recharts wrapper, Badge pattern.

---

### Workflows

Workflows là **step-by-step playbooks** được trigger bằng lệnh `/workflow-name` trong Antigravity chat.

#### `/new-page` — Tạo page mới hoàn chỉnh

Tự động:
1. Hỏi route muốn tạo
2. Tạo `page.tsx` với đúng template
3. Thêm link vào sidebar (`lib/constants.ts`)
4. Thêm vào Home quick-nav nếu cần
5. Tạo client widget nếu cần interactivity
6. Tạo API route + service nếu cần data

```
# Dùng như thế này trong Antigravity:
/new-page
> Tôi muốn tạo trang /learn/vocabulary
```

---

#### `/add-coin` — Thêm coin vào watchlist

Tự động:
1. Hỏi symbol coin (e.g. LINK, ATOM)
2. Tìm CoinGecko ID tương ứng
3. Cập nhật `services/market.ts` (COIN_IDS map)
4. Cập nhật `lib/constants.ts` (DEFAULT_WATCHLIST)
5. Cập nhật `app/invest/watchlist/page.tsx`

```
/add-coin
> Tôi muốn thêm Chainlink (LINK)
```

---

#### `/sync-github-docs` — Đồng bộ docs từ GitHub repo

Tự động:
1. Hỏi repo nào muốn sync (ibm, aws, claude, ai)
2. Fetch file listing từ GitHub API
3. Tạo/cập nhật `data/docs-*.ts`
4. Cập nhật trang Learn tương ứng để render docs

```
/sync-github-docs
> Sync tất cả .md files từ repo ibm vào /learn/mainframe
```

---

#### `/setup-dify-alert` — Cấu hình Dify daily market brief

Hướng dẫn từng bước:
1. Kiểm tra Dify account + API key
2. Thiết kế workflow nodes trong Dify UI
3. Thêm env vars (`DIFY_WORKFLOW_ID`, v.v.)
4. Tạo cron job API route
5. Cập nhật `vercel.json`
6. Deploy + test

```
/setup-dify-alert
> Tôi muốn nhận báo cáo giá vàng và BTC lúc 7 giờ sáng mỗi ngày
```

---

#### `/deploy` — Deploy đầy đủ lên Vercel

Checklist và hướng dẫn:
1. Chạy `npm run build` + `npm run lint`
2. Commit + push code
3. Cấu hình env vars trên Vercel
4. Deploy + verify

```
/deploy
```

---

#### `/add-prompt` — Thêm saved prompt vào AI Hub

Tự động:
1. Hỏi category và nội dung prompt
2. Thêm vào `data/prompts.ts`
3. Nếu là Japanese/COBOL prompt: thêm vào quick prompts của trang tương ứng

```
/add-prompt
> Thêm prompt hỏi về COBOL EVALUATE statement với ví dụ thực tế
```

---

## Mở rộng project

### Thêm AI model mới

1. Thêm vào `lib/constants.ts`:
```ts
{ id: 'mistral', label: 'Mistral', model: 'mistral-large', color: '#FF7000' }
```

2. Thêm streaming function vào `services/ai.ts`:
```ts
export async function streamMistral(messages, system) { ... }
```

3. Cập nhật router trong `services/ai.ts`:
```ts
case 'mistral': return streamMistral(messages, system)
```

4. Thêm `MISTRAL_API_KEY` vào `.env.local.example` và `app/settings/page.tsx`.

### Thêm trang học mới

```bash
# Dùng workflow:
/new-page
# Hoặc tự tạo:
mkdir -p app/learn/vocabulary
touch app/learn/vocabulary/page.tsx
```

### Thêm data source market mới

1. Tạo fetch function trong `services/market.ts`
2. Thêm case vào `app/api/prices/route.ts`
3. Cập nhật type `AssetPrice` trong `types/index.ts` nếu cần

---

## Troubleshooting

### `npm install` lỗi

```bash
# Xóa cache và retry
rm -rf node_modules package-lock.json
npm install
```

### Build lỗi TypeScript

```bash
# Check errors
npm run build 2>&1 | grep "error TS"

# Common fixes:
# - Thêm type vào types/index.ts
# - Dùng optional chaining: data?.field
# - Thêm null check: if (!data) return
```

### API trả về 401 Unauthorized

- Kiểm tra key trong `.env.local` đúng không (không có khoảng trắng thừa)
- Restart dev server sau khi đổi `.env.local`: `Ctrl+C` → `npm run dev`
- Kiểm tra key còn hạn và có đủ permissions

### API trả về 429 Too Many Requests

- CoinGecko free tier: 30 req/min — tăng `revalidate` trong `services/market.ts`
- GoldAPI free tier: 100 req/month — cache lâu hơn
- GitHub: 60 req/hour (no token) → 5000 req/hour (với token)

### Vercel build thất bại

```bash
# Xem log lỗi tại:
# vercel.com → Project → Deployments → [failed deploy] → View logs

# Common causes:
# 1. Missing env var → Add in Vercel Dashboard
# 2. TypeScript error → Fix locally, repush
# 3. Missing dependency → npm install package && git push
```

### AI chat không stream

- Kiểm tra API key đúng provider đang chọn
- Xem Network tab trong DevTools → `/api/ai-chat` → Response tab
- Lỗi thường gặp: `{"error":"Claude error: 401"}` → API key sai

### Sidebar không hiện trang mới

- Đảm bảo đã thêm vào `NAV_ITEMS` trong `lib/constants.ts`
- Restart dev server

---

## Conventions tóm tắt

```
Server Component (default)     → app/**/page.tsx, components/ui/*.tsx
Client Component ('use client') → components/widgets/*.tsx
Server-only                    → services/*.ts, app/api/**/route.ts
Shared types                   → types/index.ts (không tạo file type riêng)
Color                          → var(--ink), var(--surface), ... (không hardcode hex)
Commit                         → feat(scope): description
```

---

## Links hữu ích

| Resource | URL |
|---|---|
| Next.js 14 docs | https://nextjs.org/docs |
| Vercel deploy | https://vercel.com/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| Anthropic API | https://docs.anthropic.com |
| CoinGecko API | https://docs.coingecko.com |
| GoldAPI docs | https://www.goldapi.io/dashboard |
| Dify docs | https://docs.dify.ai |
| IBM COBOL docs | https://www.ibm.com/docs/en/cobol-zos |
| JLPT N2 info | https://jlptsensei.com/jlpt-N2 |
| NHK Web Easy | https://www3.nhk.or.jp/news/easy |
