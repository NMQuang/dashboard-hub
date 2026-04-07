---
name: vn-gold
description: >
  Build or extend the Vietnam Domestic Gold feature: prices from BTMC, family
  gold portfolio (holdings, PnL), gold news from VnExpress RSS, and gold alert
  enrichment. Triggered when the user asks about "vàng trong nước", "giá vàng",
  "domestic gold page", "family gold holdings", "gold portfolio", "gold news",
  "/invest/domestic-gold", or extending the gold alert with VN data.
---

# Skill: Vietnam Domestic Gold

## Architecture

```
app/invest/domestic-gold/page.tsx   (Server Component, revalidate=1800)
  ├── services/market.ts            fetchVNGold()  → scrapes BTMC HTML
  ├── services/goldNews.ts          fetchGoldNews() → VnExpress RSS
  └── lib/familyGold.ts             GOLD_HOLDINGS + calcGoldPortfolio()

app/invest/market/page.tsx
  └── compact summary card → link to /invest/domestic-gold

app/api/cron/gold-alert/route.ts
  └── enriched payload: VN prices + news headlines + portfolio snapshot
```

## Key files

| File | Purpose |
|------|---------|
| `app/invest/domestic-gold/page.tsx` | Dedicated page: prices + portfolio + news |
| `services/market.ts` | `fetchVNGold()` — scrapes BTMC, maps to 4 gold types |
| `services/goldNews.ts` | `fetchGoldNews()` — VnExpress RSS, always returns `[]` on failure |
| `lib/familyGold.ts` | `GOLD_HOLDINGS[]` static data + `calcGoldPortfolio()` |
| `types/index.ts` | `GoldType`, `GoldHolding`, `GoldPortfolioSummary`, `GoldNewsItem` |
| `lib/constants.ts` | NAV_ITEMS Invest group — includes VN Gold link |

## TypeScript types

```ts
// types/index.ts

export type GoldType = 'mieng' | 'nhan' | 'nguyen_lieu' | 'nu_trang'
// Must stay in sync with GOLD_GROUPS[].key in services/market.ts

export interface GoldHolding {
  id: string
  purchasedAt: string   // YYYY-MM-DD
  type: GoldType
  quantity: number      // lượng (1 lượng = 37.5g)
  buyPrice: number      // VND / lượng at purchase time
  note?: string
}

export interface GoldPortfolioSummary {
  totalQuantity: number
  totalCostVND: number
  totalCurrentVND: number
  totalPnlVND: number
  totalPnlPct: number   // %
  updatedAt: string
}

export interface GoldNewsItem {
  title: string
  url: string
  publishedAt: string   // ISO string
  source: string        // e.g. 'VnExpress'
}
```

## VN Gold data source (BTMC JSON API)

**IMPORTANT**: BTMC loads prices via JavaScript on their HTML page — HTML scraping returns no data.
The actual data comes from their internal JSON API endpoint.

```
GET https://btmc.vn/ProductHome/getGoldDate?date=DD/MM/YYYY
Headers: Referer, X-Requested-With: XMLHttpRequest
Unit: raw value × 10,000 = VND per lượng
Values: HTML-wrapped e.g. "<b>16810</b>" → strip tags → 16810 × 10,000 = 168,100,000 VND/lượng
Date: must use Vietnam timezone (UTC+7), format DD/MM/YYYY
```

```ts
// Field → GoldType key mapping
// btmcvangmiengmua/ban → 'mieng'  (Vàng Miếng BTMC)
// btmcvangnhanmua/ban  → 'nhan'   (Vàng Nhẫn)
// sjcmua/sjcban        → 'nguyen_lieu' (Vàng SJC — repurposed slot)
// trangsucmua/ban      → 'nu_trang'    (Vàng Nữ Trang)

// VNGoldPrice shape
interface VNGoldPrice {
  key: string       // 'mieng' | 'nhan' | 'nguyen_lieu' | 'nu_trang'
  brand: string     // display label
  sourceName: string
  buy: number       // VND/lượng — shop buys from customer (liquidation price)
  sell: number      // VND/lượng — shop sells to customer (replacement price)
  change24h: number // always 0 (no historical comparison yet)
  updatedAt: string
}
```

Example live values (April 2026):
- Vàng Miếng BTMC: mua 168.1 triệu / bán 171.1 triệu
- Vàng Nhẫn: mua 168.1 triệu / bán 171.1 triệu
- Vàng SJC: mua 170.1 triệu / bán 173.1 triệu
- Vàng Nữ Trang: mua 166.1 triệu / bán 170.1 triệu

## Adding / editing family gold holdings

Edit `GOLD_HOLDINGS` in `lib/familyGold.ts`:

```ts
export const GOLD_HOLDINGS: GoldHolding[] = [
  {
    id: '1',
    purchasedAt: '2024-06-01',
    type: 'nhan',           // must match GoldType union
    quantity: 1,            // lượng
    buyPrice: 76_500_000,   // VND / lượng
    note: 'Mua tại BTMC HN',
  },
  {
    id: '2',
    purchasedAt: '2024-12-15',
    type: 'mieng',
    quantity: 0.5,
    buyPrice: 88_000_000,
  },
]
```

## Portfolio calculator

```ts
// lib/familyGold.ts — pure function, no async, no side effects
calcGoldPortfolio(holdings: GoldHolding[], vnGoldPrices: VNGoldPrice[]): GoldPortfolioSummary

// Valuation logic:
// - Matches holding.type === price.key
// - Uses price.buy (bid = liquidation value, conservative)
// - If no price match or price.buy === 0 → uses holding.buyPrice (zero PnL for that lot)
// - Guards: divide-by-zero when totalCostVND === 0
```

## Gold news service

```ts
// services/goldNews.ts
// Source: https://vnexpress.net/rss/kinh-doanh/vang.rss
// revalidate: 1800 (30 min)
// Returns up to 8 items, always [] on any failure
// Parses CDATA titles, <link> or <guid> for URL, <pubDate> for timestamp

fetchGoldNews(): Promise<GoldNewsItem[]>
```

To add a second news source:
1. Write a `fetchSourceX(): Promise<GoldNewsItem[]>` function (same pattern as `fetchVnExpressGold`)
2. Add it to the `Promise.allSettled([...])` array in `fetchGoldNews()`

## Gold alert enrichment

`app/api/cron/gold-alert/route.ts` — when the price threshold is triggered:

```ts
// Fetches enrichment AFTER threshold check (only fires when alert is real)
const [vnGoldResult, newsResult] = await Promise.allSettled([
  fetchVNGold(),
  fetchGoldNews(),
])

// Extra fields sent to Dify workflow:
{
  vn_gold_mieng_buy, vn_gold_mieng_sell,
  vn_gold_nhan_buy, vn_gold_nhan_sell,
  top_news_1, top_news_2, top_news_3,
  portfolio_qty, portfolio_cost_vnd,
  portfolio_value_vnd, portfolio_pnl_vnd, portfolio_pnl_pct,
}
```

## Cache strategy

| Data | revalidate | Source |
|------|-----------|--------|
| VN Gold prices | 1800s (30 min) | BTMC scrape |
| Gold news | 1800s (30 min) | VnExpress RSS |
| Domestic gold page | 1800s | ISR |
| Market page (summary) | 60s | ISR |

## Market page summary card

The market page (`app/invest/market/page.tsx`) shows only `mieng` and `nhan` in a compact 2-tile layout:

```ts
// Filter from existing snapshot — no extra fetch
(snapshot?.vnGold ?? []).filter(g => g.key === 'mieng' || g.key === 'nhan')
```

Always shows "View full →" link to `/invest/domestic-gold`.

## Rules (from instructions.md)

- Server components call `fetchVNGold()` / `fetchGoldNews()` directly — never via `/api/*`
- Always `Promise.allSettled` for multiple services
- `calcGoldPortfolio` is pure — lives in `lib/`, not `services/`
- No `any`, no `@ts-ignore`
- CSS variables only (`var(--ink)`, `var(--green)`, etc.)
- `GoldType` union must stay in sync with `GOLD_GROUPS[].key` in `services/market.ts`
