import { getIncomeByMonth, getExpensesByMonth, getDebts, toVND, type ForexRates } from '@/services/familyFinance'
import { getInvestments } from '@/services/familyInvestments'
import { fetchForex } from '@/services/market'
import DashboardClient, { type MonthlySummary } from '@/components/family/finance/DashboardClient'

export const dynamic = 'force-dynamic'

function prevYearMonth(offset: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - offset)
  return d.toISOString().slice(0, 7)
}

function monthLabel(ym: string): string {
  const parts = ym.split('-')
  return `${parts[1]}/${parts[0]}`
}

export default async function FinanceDashboardPage() {
  const thisMonth = prevYearMonth(0)

  // Fetch current month data, investments, debts, and forex in parallel
  const [incomeResult, expensesResult, investmentsResult, debtsResult, forexResult] = await Promise.allSettled([
    getIncomeByMonth(thisMonth),
    getExpensesByMonth(thisMonth),
    getInvestments(),
    getDebts(),
    fetchForex(),
  ])

  const incomeThisMonth = incomeResult.status === 'fulfilled' ? incomeResult.value : []
  const expensesThisMonth = expensesResult.status === 'fulfilled' ? expensesResult.value : []
  const investments = investmentsResult.status === 'fulfilled' ? investmentsResult.value : []
  const debts = debtsResult.status === 'fulfilled' ? debtsResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 150,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  // Fetch last 5 months for trend chart
  const histOffsets = [1, 2, 3, 4, 5]
  const histKeys = histOffsets.map(o => prevYearMonth(o))

  const histIncome = await Promise.allSettled(histKeys.map(m => getIncomeByMonth(m)))
  const histExpenses = await Promise.allSettled(histKeys.map(m => getExpensesByMonth(m)))

  // Build monthly summaries: oldest → newest
  const olderMonths: MonthlySummary[] = histKeys.map((month, idx) => {
    const inc = histIncome[idx]?.status === 'fulfilled' ? histIncome[idx].value : []
    const exp = histExpenses[idx]?.status === 'fulfilled' ? histExpenses[idx].value : []
    return {
      month,
      incomeVND: inc.reduce((s, i) => s + toVND(i.amount, i.currency, rates), 0),
      expensesVND: exp.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0),
    }
  }).reverse()

  const recentMonths: MonthlySummary[] = [
    ...olderMonths,
    {
      month: thisMonth,
      incomeVND: incomeThisMonth.reduce((s, i) => s + toVND(i.amount, i.currency, rates), 0),
      expensesVND: expensesThisMonth.reduce((s, e) => s + toVND(e.amount, e.currency, rates), 0),
    },
  ]

  return (
    <DashboardClient
      incomeThisMonth={incomeThisMonth}
      expensesThisMonth={expensesThisMonth}
      investments={investments}
      debts={debts}
      rates={rates}
      monthLabel={monthLabel(thisMonth)}
      recentMonths={recentMonths}
    />
  )
}
