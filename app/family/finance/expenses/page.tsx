import { getExpensesByMonth, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import ExpenseClient from '@/components/family/finance/ExpenseClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string }
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7)

  const [expensesResult, forexResult] = await Promise.allSettled([
    getExpensesByMonth(month),
    fetchForex(),
  ])

  const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 150,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return <ExpenseClient key={month} initialExpenses={expenses} month={month} rates={rates} />
}
