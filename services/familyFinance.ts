/**
 * Family Finance Service
 *
 * Primary: Supabase (durable, normalized)
 * Fallback: in-memory (dev / Supabase not configured)
 *
 * Never throws. Returns empty arrays / false on failure.
 */

import { supabase } from '@/lib/supabase'
import type { FamilyIncome, FamilyExpense, FamilyBill, FamilyBillTemplate, FamilyDebt, DebtStatus } from '@/types/family'

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

// ── Bills CRUD ────────────────────────────────────────────────────────────

const _bills = new Map<string, FamilyBill>()

type BillRow = {
  id: string
  month: string
  country: string
  name: string
  category: string
  estimated_amount: number | null
  actual_amount: number | null
  currency: string
  due_date: string | null
  status: string
  expense_id: string | null
  note: string | null
  created_at: string
}

function rowToBill(row: BillRow): FamilyBill {
  return {
    id: row.id,
    month: row.month,
    country: row.country as 'JP' | 'VN',
    name: row.name,
    category: row.category,
    estimatedAmount: row.estimated_amount ?? undefined,
    actualAmount: row.actual_amount ?? undefined,
    currency: row.currency as FamilyBill['currency'],
    dueDate: row.due_date ?? undefined,
    status: row.status as FamilyBill['status'],
    expenseId: row.expense_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

function billToRow(b: FamilyBill): BillRow {
  return {
    id: b.id,
    month: b.month,
    country: b.country,
    name: b.name,
    category: b.category,
    estimated_amount: b.estimatedAmount ?? null,
    actual_amount: b.actualAmount ?? null,
    currency: b.currency,
    due_date: b.dueDate ?? null,
    status: b.status,
    expense_id: b.expenseId ?? null,
    note: b.note ?? null,
    created_at: b.createdAt,
  }
}

export async function getBillsByMonth(yearMonth: string): Promise<FamilyBill[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_bills')
        .select('*')
        .eq('month', yearMonth)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as BillRow[]).map(rowToBill)
    } catch (err) {
      log(`getBillsByMonth: ${err}`)
    }
  }
  return Array.from(_bills.values()).filter(b => b.month === yearMonth)
}

export async function saveBill(bill: FamilyBill): Promise<boolean> {
  _bills.set(bill.id, bill)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_bills').upsert(billToRow(bill))
    if (error) throw error
    return true
  } catch (err) {
    log(`saveBill: ${err}`)
    return false
  }
}

export async function deleteBill(id: string): Promise<boolean> {
  _bills.delete(id)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_bills').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`deleteBill: ${err}`)
    return false
  }
}

// ── Bill Templates ────────────────────────────────────────────────────────

type TemplateRow = {
  id: string
  country: string
  name: string
  category: string
  currency: string
  estimated_amount: number | null
  enabled: boolean
  sort_order: number
  created_at: string
}

function rowToTemplate(row: TemplateRow): FamilyBillTemplate {
  return {
    id: row.id,
    country: row.country as 'JP' | 'VN',
    name: row.name,
    category: row.category,
    currency: row.currency as 'JPY' | 'VND',
    estimatedAmount: row.estimated_amount ?? undefined,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

export async function getBillTemplates(): Promise<FamilyBillTemplate[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('family_bill_templates')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data as TemplateRow[]).map(rowToTemplate)
  } catch (err) {
    log(`getBillTemplates: ${err}`)
    return []
  }
}

export async function updateBillTemplate(
  id: string,
  updates: { enabled?: boolean; estimated_amount?: number | null },
): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('family_bill_templates')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`updateBillTemplate: ${err}`)
    return false
  }
}

// Lấy actual amount của bill cùng tên tháng trước (smart estimate)
async function getPrevMonthActual(
  name: string,
  country: string,
  targetMonth: string,
): Promise<number | null> {
  if (!supabase) return null
  const [y, m] = targetMonth.split('-').map(Number)
  const prevMonth = m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`
  try {
    const { data } = await supabase
      .from('family_bills')
      .select('actual_amount')
      .eq('name', name)
      .eq('country', country)
      .eq('month', prevMonth)
      .eq('status', 'paid')
      .limit(1)
    return (data?.[0]?.actual_amount as number) ?? null
  } catch {
    return null
  }
}

// Sinh bills tự động cho 1 tháng từ templates đang enabled
// Trả về số bill được tạo mới
export async function generateBillsForMonth(targetMonth: string): Promise<{
  created: number
  skipped: number
  month: string
}> {
  const templates = await getBillTemplates()
  const enabled = templates.filter(t => t.enabled)
  const existing = await getBillsByMonth(targetMonth)
  const existingKeys = new Set(existing.map(b => `${b.country}|${b.name}`))

  let created = 0
  let skipped = 0

  for (const tpl of enabled) {
    const key = `${tpl.country}|${tpl.name}`
    if (existingKeys.has(key)) { skipped++; continue }

    // Smart estimate: template amount → prev month actual → null
    let estimate: number | undefined = tpl.estimatedAmount
    if (!estimate) {
      const prev = await getPrevMonthActual(tpl.name, tpl.country, targetMonth)
      if (prev) estimate = prev
    }

    const bill: FamilyBill = {
      id: `bill-auto-${targetMonth}-${tpl.id}`,
      month: targetMonth,
      country: tpl.country,
      name: tpl.name,
      category: tpl.category,
      estimatedAmount: estimate,
      currency: tpl.currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    await saveBill(bill)
    created++
  }

  return { created, skipped, month: targetMonth }
}

// ── Debts CRUD ────────────────────────────────────────────────────────────

const _debts = new Map<string, FamilyDebt>()

type DebtRow = {
  id: string
  type: string
  person: string
  amount: number
  currency: string
  description: string | null
  due_date: string | null
  status: string
  paid_amount: number
  created_at: string
  settled_at: string | null
}

function rowToDebt(row: DebtRow): FamilyDebt {
  return {
    id: row.id,
    type: row.type as FamilyDebt['type'],
    person: row.person,
    amount: Number(row.amount),
    currency: row.currency as FamilyDebt['currency'],
    description: row.description ?? undefined,
    dueDate: row.due_date ?? undefined,
    status: row.status as DebtStatus,
    paidAmount: Number(row.paid_amount),
    createdAt: row.created_at,
    settledAt: row.settled_at ?? undefined,
  }
}

function debtToRow(d: FamilyDebt): DebtRow {
  return {
    id: d.id,
    type: d.type,
    person: d.person,
    amount: d.amount,
    currency: d.currency,
    description: d.description ?? null,
    due_date: d.dueDate ?? null,
    status: d.status,
    paid_amount: d.paidAmount,
    created_at: d.createdAt,
    settled_at: d.settledAt ?? null,
  }
}

export async function getDebts(): Promise<FamilyDebt[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('family_debts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as DebtRow[]).map(rowToDebt)
    } catch (err) {
      log(`getDebts: ${err}`)
    }
  }
  return Array.from(_debts.values())
}

export async function saveDebt(debt: FamilyDebt): Promise<boolean> {
  _debts.set(debt.id, debt)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_debts').upsert(debtToRow(debt))
    if (error) throw error
    return true
  } catch (err) {
    log(`saveDebt: ${err}`)
    return false
  }
}

export async function deleteDebt(id: string): Promise<boolean> {
  _debts.delete(id)
  if (!supabase) return false
  try {
    const { error } = await supabase.from('family_debts').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    log(`deleteDebt: ${err}`)
    return false
  }
}
