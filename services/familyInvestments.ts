/**
 * Family Investments Service
 *
 * Primary: Supabase
 * Fallback: in-memory (dev / Supabase not configured)
 *
 * Never throws.
 */

import { supabase } from '@/lib/supabase'
import type { FamilyInvestment } from '@/types/family'

function log(msg: string): void {
  console.warn('[familyInvestments]', msg)
}

const _investments = new Map<string, FamilyInvestment>()

// ── Row type ──────────────────────────────────────────────────────────────

type InvestmentRow = {
  id: string
  type: string
  asset_name: string
  quantity: number
  average_buy_price: number | null
  current_price: number | null
  currency: string
  note: string | null
  updated_at: string
}

// ── Mappers ───────────────────────────────────────────────────────────────

function rowToInvestment(row: InvestmentRow): FamilyInvestment {
  return {
    id: row.id,
    type: row.type as 'gold' | 'crypto',
    assetName: row.asset_name,
    quantity: Number(row.quantity),
    averageBuyPrice: row.average_buy_price != null ? Number(row.average_buy_price) : undefined,
    currentPrice: row.current_price != null ? Number(row.current_price) : undefined,
    currency: row.currency,
    note: row.note ?? undefined,
    updatedAt: row.updated_at,
  }
}

function investmentToRow(i: FamilyInvestment): InvestmentRow {
  return {
    id: i.id,
    type: i.type,
    asset_name: i.assetName,
    quantity: i.quantity,
    average_buy_price: i.averageBuyPrice ?? null,
    current_price: i.currentPrice ?? null,
    currency: i.currency,
    note: i.note ?? null,
    updated_at: i.updatedAt,
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function getInvestments(): Promise<FamilyInvestment[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_investments')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data as InvestmentRow[]).map(rowToInvestment)
    } catch (err) {
      log(`getInvestments: ${err}`)
    }
  }
  return Array.from(_investments.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveInvestment(investment: FamilyInvestment): Promise<boolean> {
  _investments.set(investment.id, investment)
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('family_investments')
      .upsert(investmentToRow(investment))
    if (error) throw error
    return true
  } catch (err) {
    log(`saveInvestment: ${err}`)
    return false
  }
}

export async function deleteInvestment(id: string): Promise<boolean> {
  _investments.delete(id)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_investments').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`deleteInvestment: ${err}`)
    return false
  }
}
