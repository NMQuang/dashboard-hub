import { getInvestments } from '@/services/familyInvestments'
import { fetchForex } from '@/services/market'
import InvestmentClient from '@/components/family/finance/InvestmentClient'
import type { ForexRates } from '@/services/familyFinance'

export const dynamic = 'force-dynamic'

export default async function InvestmentsPage() {
  const [investmentsResult, forexResult] = await Promise.allSettled([
    getInvestments(),
    fetchForex(),
  ])

  const investments = investmentsResult.status === 'fulfilled' ? investmentsResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 150,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return <InvestmentClient initialInvestments={investments} rates={rates} />
}
