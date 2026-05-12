/**
 * Family Finance Service
 *
 * Primary: Supabase (durable, normalized)
 * Fallback: in-memory (dev / Supabase not configured)
 *
 * Never throws. Returns empty arrays / false on failure.
 */

import { supabase } from '@/lib/supabase'
import type { FamilyIncome, FamilyExpense } from '@/types/family'

function log(msg: string): void {
  console.warn('[familyFinance]', msg)
}

// ── In-memory fallback ────────────────────────────────────────────────────

const _income = new Map<string, FamilyIncome>()
const _expenses = new Map<string, FamilyExpense>()

// ── Currency conversion ───────────────────────────────────────────────────

export interface ForexRates {
  jpy: number  // JPY per 1 USD
  vnd: number  // VND per 1 USD
}

export function toVND(
  amount: number,
  currency: 'VND' | 'JPY' | 'USD',
  rates: ForexRates,
): number {
  if (currency === 'VND') return amount
  if (currency === 'USD') return Math.round(amount * rates.vnd)
  if (rates.jpy <= 0) return 0
  return Math.round(amount * (rates.vnd / rates.jpy))
}

export function toJPY(
  amount: number,
  currency: 'VND' | 'JPY' | 'USD',
  rates: ForexRates,
): number {
  if (currency === 'JPY') return amount
  if (currency === 'USD') return Math.round(amount * rates.jpy)
  if (rates.vnd <= 0) return 0
  return Math.round(amount * (rates.jpy / rates.vnd))
}

export function formatVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T₫`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`
  return `${value}₫`
}

export function formatJPY(value: number): string {
  return `¥${new Intl.NumberFormat('ja-JP').format(Math.round(value))}`
}

function firstDayOfNextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
}

// ── Row types (snake_case from Supabase) ─────────────────────────────────

type IncomeRow = {
  id: string
  source: string
  country: string
  currency: string
  amount: number
  received_date: string
  category: string | null
  note: string | null
  created_at: string
}

type ExpenseRow = {
  id: string
  country: string
  category: string
  amount: number
  currency: string
  spent_date: string
  payment_method: string | null
  note: string | null
  created_at: string
}

// ── Mappers ───────────────────────────────────────────────────────────────

function rowToIncome(row: IncomeRow): FamilyIncome {
  return {
    id: row.id,
    source: row.source as FamilyIncome['source'],
    country: row.country as 'VN' | 'JP',
    currency: row.currency as FamilyIncome['currency'],
    amount: Number(row.amount),
    receivedDate: row.received_date,
    category: row.category ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

function incomeToRow(i: FamilyIncome): IncomeRow {
  return {
    id: i.id,
    source: i.source,
    country: i.country,
    currency: i.currency,
    amount: i.amount,
    received_date: i.receivedDate,
    category: i.category ?? null,
    note: i.note ?? null,
    created_at: i.createdAt,
  }
}

function rowToExpense(row: ExpenseRow): FamilyExpense {
  return {
    id: row.id,
    country: row.country as 'VN' | 'JP',
    category: row.category as FamilyExpense['category'],
    amount: Number(row.amount),
    currency: row.currency as 'VND' | 'JPY',
    spentDate: row.spent_date,
    paymentMethod: row.payment_method ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

function expenseToRow(e: FamilyExpense): ExpenseRow {
  return {
    id: e.id,
    country: e.country,
    category: e.category,
    amount: e.amount,
    currency: e.currency,
    spent_date: e.spentDate,
    payment_method: e.paymentMethod ?? null,
    note: e.note ?? null,
    created_at: e.createdAt,
  }
}

// ── Income CRUD ───────────────────────────────────────────────────────────

export async function getIncomeByMonth(yearMonth: string): Promise<FamilyIncome[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_income')
        .select('*')
        .gte('received_date', `${yearMonth}-01`)
        .lt('received_date', firstDayOfNextMonth(yearMonth))
        .order('received_date', { ascending: false })
      if (error) throw error
      return (data as IncomeRow[]).map(rowToIncome)
    } catch (err) {
      log(`getIncomeByMonth: ${err}`)
    }
  }
  return Array.from(_income.values())
    .filter(i => i.receivedDate.startsWith(yearMonth))
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
}

export async function getIncomeByYear(year: number): Promise<FamilyIncome[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_income')
        .select('*')
        .gte('received_date', `${year}-01-01`)
        .lte('received_date', `${year}-12-31`)
        .order('received_date', { ascending: false })
      if (error) throw error
      return (data as IncomeRow[]).map(rowToIncome)
    } catch (err) {
      log(`getIncomeByYear: ${err}`)
    }
  }
  return Array.from(_income.values())
    .filter(i => i.receivedDate.startsWith(String(year)))
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
}

export async function saveIncome(income: FamilyIncome): Promise<boolean> {
  _income.set(income.id, income)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_income').upsert(incomeToRow(income))
    if (error) throw error
    return true
  } catch (err) {
    log(`saveIncome: ${err}`)
    return false
  }
}

export async function deleteIncome(id: string): Promise<boolean> {
  _income.delete(id)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_income').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`deleteIncome: ${err}`)
    return false
  }
}

// ── Expense CRUD ──────────────────────────────────────────────────────────

export async function getExpensesByMonth(yearMonth: string): Promise<FamilyExpense[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_expenses')
        .select('*')
        .gte('spent_date', `${yearMonth}-01`)
        .lt('spent_date', firstDayOfNextMonth(yearMonth))
        .order('spent_date', { ascending: false })
      if (error) throw error
      return (data as ExpenseRow[]).map(rowToExpense)
    } catch (err) {
      log(`getExpensesByMonth: ${err}`)
    }
  }
  return Array.from(_expenses.values())
    .filter(e => e.spentDate.startsWith(yearMonth))
    .sort((a, b) => b.spentDate.localeCompare(a.spentDate))
}

export async function getExpensesByYear(year: number): Promise<FamilyExpense[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_expenses')
        .select('*')
        .gte('spent_date', `${year}-01-01`)
        .lte('spent_date', `${year}-12-31`)
        .order('spent_date', { ascending: false })
      if (error) throw error
      return (data as ExpenseRow[]).map(rowToExpense)
    } catch (err) {
      log(`getExpensesByYear: ${err}`)
    }
  }
  return Array.from(_expenses.values())
    .filter(e => e.spentDate.startsWith(String(year)))
    .sort((a, b) => b.spentDate.localeCompare(a.spentDate))
}

export async function saveExpense(expense: FamilyExpense): Promise<boolean> {
  _expenses.set(expense.id, expense)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_expenses').upsert(expenseToRow(expense))
    if (error) throw error
    return true
  } catch (err) {
    log(`saveExpense: ${err}`)
    return false
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  _expenses.delete(id)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_expenses').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`deleteExpense: ${err}`)
    return false
  }
}
