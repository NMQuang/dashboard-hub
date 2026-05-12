import { getIncomeByYear, getExpensesByYear, toVND, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import ReportsClient, { type MonthlyReport } from '@/components/family/finance/ReportsClient'
import type { FamilyExpense } from '@/types/family'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { year?: string }
}

const MONTH_LABELS = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12']

export default async function ReportsPage({ searchParams }: PageProps) {
  const year = parseInt(searchParams.year ?? String(new Date().getFullYear()), 10)

  const [incomeResult, expensesResult, forexResult] = await Promise.allSettled([
    getIncomeByYear(year),
    getExpensesByYear(year),
    fetchForex(),
  ])

  const allIncome = incomeResult.status === 'fulfilled' ? incomeResult.value : []
  const allExpenses = expensesResult.status === 'fulfilled' ? expensesResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 150,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  // Build per-month summaries
  const months: MonthlyReport[] = Array.from({ length: 12 }, (_, idx) => {
    const mm = String(idx + 1).padStart(2, '0')
    const monthKey = `${year}-${mm}`

    const monthIncome = allIncome.filter(i => i.receivedDate.startsWith(monthKey))
    const monthExpenses = allExpenses.filter(e => e.spentDate.startsWith(monthKey))

    const incomeVND = monthIncome.reduce((s, i) => s + toVND(i.amount, i.currency, rates), 0)
    const expensesVND = monthExpenses.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)
    const vnExpensesVND = monthExpenses
      .filter(e => e.country === 'VN')
      .reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)
    const jpExpensesVND = monthExpenses
      .filter(e => e.country === 'JP')
      .reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0)

    const incomeRawVND = monthIncome.filter(i => i.currency === 'VND').reduce((s, i) => s + i.amount, 0)
    const incomeRawJPY = monthIncome.filter(i => i.currency === 'JPY').reduce((s, i) => s + i.amount, 0)
    const expRawVND = monthExpenses.filter(e => e.currency === 'VND').reduce((s, e) => s + e.amount, 0)
    const expRawJPY = monthExpenses.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0)
    const vnExpRawVND = monthExpenses.filter(e => e.country === 'VN').reduce((s, e) => s + e.amount, 0)
    const jpExpRawJPY = monthExpenses.filter(e => e.country === 'JP').reduce((s, e) => s + e.amount, 0)

    return {
      month: monthKey,
      label: MONTH_LABELS[idx],
      incomeVND,
      expensesVND,
      savingsVND: incomeVND - expensesVND,
      vnExpensesVND,
      jpExpensesVND,
      incomeRawVND,
      incomeRawJPY,
      expRawVND,
      expRawJPY,
      savingsRawVND: incomeRawVND - expRawVND,
      savingsRawJPY: incomeRawJPY - expRawJPY,
      vnExpRawVND,
      jpExpRawJPY,
    }
  })

  // Category breakdown for the whole year
  const catMap: Partial<Record<FamilyExpense['category'], number>> = {}
  for (const e of allExpenses) {
    const vnd = toVND(e.amount, e.currency, rates)
    catMap[e.category] = (catMap[e.category] ?? 0) + vnd
  }
  const categoryBreakdown = Object.entries(catMap)
    .map(([cat, totalVND]) => ({
      category: cat as FamilyExpense['category'],
      totalVND,
    }))
    .sort((a, b) => b.totalVND - a.totalVND)

  return (
    <ReportsClient
      year={year}
      months={months}
      categoryBreakdown={categoryBreakdown}
      rates={rates}
    />
  )
}
