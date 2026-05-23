import { getBillsByMonth, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import BillsClient from '@/components/family/finance/BillsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string }
}

export default async function BillsPage({ searchParams }: PageProps) {
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7)

  const [billsResult, forexResult] = await Promise.allSettled([
    getBillsByMonth(month),
    fetchForex(),
  ])

  const bills = billsResult.status === 'fulfilled' ? billsResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 155,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return <BillsClient key={month} initialBills={bills} month={month} rates={rates} />
}
