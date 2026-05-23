import { getDebts, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import DebtsClient from '@/components/family/finance/DebtsClient'

export const dynamic = 'force-dynamic'

export default async function DebtsPage() {
  const [debtsResult, forexResult] = await Promise.allSettled([
    getDebts(),
    fetchForex(),
  ])

  const debts = debtsResult.status === 'fulfilled' ? debtsResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 155,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return <DebtsClient initialDebts={debts} rates={rates} />
}
