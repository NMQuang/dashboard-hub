---
name: market-api
description: >
  Add or update market data features: gold prices, crypto prices, forex, charts,
  alerts. Triggered when the user asks to "add price chart", "show live gold price",
  "add a new coin to watchlist", "build the market page", "set up price alerts".
---

# Skill: Market Data Integration

## Architecture
```
Client page          → /api/prices?symbols=BTC,ETH,XAU
/api/prices/route.ts → services/market.ts
services/market.ts   → GoldAPI.io + CoinGecko + exchangerate-api
```

## API endpoints

### GoldAPI.io (gold price)
```ts
GET https://www.goldapi.io/api/XAU/USD
Headers: { 'x-access-token': process.env.GOLD_API_KEY }
Response: { price: number, ch: number, chp: number, timestamp: number }
```

### CoinGecko (crypto)
```ts
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin,ethereum,solana
  &vs_currencies=usd
  &include_24hr_change=true
  &include_last_updated_at=true
Headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }  // optional
```

### ExchangeRate API (forex, free)
```ts
GET https://open.er-api.com/v6/latest/USD
Response: { rates: { JPY: number, VND: number, ... } }
```

## CoinGecko ID map (add new coins here)
```ts
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana',
  BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano',
  AVAX: 'avalanche-2', MATIC: 'matic-network', DOT: 'polkadot',
  LINK: 'chainlink', UNI: 'uniswap', ATOM: 'cosmos',
}
```

## Adding a new coin to watchlist
1. Add coin ID to `COIN_IDS` map in `services/market.ts`
2. Add symbol to `DEFAULT_WATCHLIST` in `lib/constants.ts`
3. Update `app/invest/watchlist/page.tsx` if showing static list

## Building a price chart with Recharts
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Data format
const data = [{ time: '09:00', price: 3010 }, { time: '10:00', price: 3024 }, ...]

<ResponsiveContainer width="100%" height={200}>
  <LineChart data={data}>
    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--ink3)' }} />
    <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} width={60} />
    <Tooltip
      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
    />
    <Line type="monotone" dataKey="price" stroke="var(--ink)" strokeWidth={1.5} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

## Price alert via Dify
1. Create a Dify workflow that:
   - Takes `{ symbol, currentPrice, threshold }` as input
   - Checks if `|currentPrice - threshold| / threshold > 0.015` (1.5% trigger)
   - If yes: generates a market brief and sends notification
2. Trigger from `/api/dify` with `action: 'trigger'`
3. Schedule via Vercel Cron: `vercel.json` → `"crons": [{"path": "/api/cron/market", "schedule": "0 7 * * *"}]`

## Cache strategy
| Data | revalidate | Reason |
|------|-----------|--------|
| Gold | 300s | GoldAPI free tier limit |
| Crypto | 60s | CoinGecko allows 30 req/min |
| Forex | 3600s | Exchange rates change slowly |
| Chart history | 1800s | Historical data doesn't change |

## .env.local.example additions
```
GOLD_API_KEY=          # goldapi.io → Dashboard → API Key
COINGECKO_API_KEY=     # pro.coingecko.com (optional, free tier OK)
```
