# Add Coin to Watchlist

Add a new cryptocurrency to the market dashboard and watchlist.

## Steps

1. Ask: "What coin symbol do you want to add? (e.g. LINK, ATOM, DOT)"

2. Find the CoinGecko ID for the coin:
   - Common IDs: LINK→chainlink, ATOM→cosmos, DOT→polkadot, AVAX→avalanche-2
   - If unknown: check https://api.coingecko.com/api/v3/coins/list

3. Add the coin to `services/market.ts` in the `COIN_IDS` map:
   ```ts
   { SYM: 'coingecko-id' }
   ```

4. Add the symbol to `DEFAULT_WATCHLIST` in `lib/constants.ts`:
   ```ts
   export const DEFAULT_WATCHLIST = ['XAU', 'BTC', 'ETH', 'SOL', 'BNB', ..., 'NEW_COIN']
   ```

5. Update `app/invest/watchlist/page.tsx` to include the new symbol in the static list.

6. Verify the `/api/prices?symbols=NEW_COIN` endpoint returns data by checking
   the CoinGecko API response format in `services/market.ts`.

7. Confirm: "LINK has been added to your watchlist. It will appear in /invest/market and /invest/watchlist."
