import { getIncomeByMonth, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import IncomeClient from '@/components/family/finance/IncomeClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string }
}

export default async function IncomePage({ searchParams }: PageProps) {
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7)

  const [incomeResult, forexResult] = await Promise.allSettled([
    getIncomeByMonth(month),
    fetchForex(),
  ])

  const income = incomeResult.status === 'fulfilled' ? incomeResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 150,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return <IncomeClient key={month} initialIncome={income} month={month} rates={rates} />
}
