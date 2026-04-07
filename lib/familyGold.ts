/**
 * lib/familyGold.ts
 * Family gold holdings — static data + pure portfolio calculator.
 *
 * COUPLING NOTE: GoldHolding.type must match VNGoldPrice.key values
 * defined in GOLD_GROUPS inside services/market.ts:
 *   'mieng' | 'nhan' | 'nguyen_lieu' | 'nu_trang'
 */
import type { GoldHolding, GoldPortfolioSummary, VNGoldPrice } from '@/types'

/**
 * Family gold holdings.
 * Add real data here. Example row (uncomment and edit):
 *
 * { id: '1', purchasedAt: '2024-06-01', type: 'nhan', quantity: 1, buyPrice: 76_500_000, note: 'Mua tại BTMC' },
 * { id: '2', purchasedAt: '2024-12-15', type: 'mieng', quantity: 0.5, buyPrice: 88_000_000 },
 */
export const GOLD_HOLDINGS: GoldHolding[] = []

const GOLD_TYPE_LABELS: Record<GoldHolding['type'], string> = {
  mieng: 'Vàng Miếng',
  nhan: 'Vàng Nhẫn',
  nguyen_lieu: 'Vàng 24k / Nguyên liệu',
  nu_trang: 'Vàng Nữ Trang',
}

export function goldTypeLabel(type: GoldHolding['type']): string {
  return GOLD_TYPE_LABELS[type]
}

/**
 * Calculates a portfolio summary for the given holdings.
 * Uses the `buy` price (bid) from each VNGoldPrice as the liquidation value.
 * If a matching price is not found or is zero, cost basis is used (PnL = 0 for that holding).
 */
export function calcGoldPortfolio(
  holdings: GoldHolding[],
  vnGoldPrices: VNGoldPrice[],
): GoldPortfolioSummary {
  let totalQuantity = 0
  let totalCostVND = 0
  let totalCurrentVND = 0

  for (const h of holdings) {
    const matched = vnGoldPrices.find((p) => p.key === h.type)
    // Use buy price (what shop pays when customer sells) = liquidation value
    const currentUnitPrice = matched && matched.buy > 0 ? matched.buy : h.buyPrice

    totalQuantity += h.quantity
    totalCostVND += h.quantity * h.buyPrice
    totalCurrentVND += h.quantity * currentUnitPrice
  }

  const totalPnlVND = totalCurrentVND - totalCostVND
  const totalPnlPct = totalCostVND > 0 ? (totalPnlVND / totalCostVND) * 100 : 0

  return {
    totalQuantity,
    totalCostVND,
    totalCurrentVND,
    totalPnlVND,
    totalPnlPct,
    updatedAt: new Date().toISOString(),
  }
}
