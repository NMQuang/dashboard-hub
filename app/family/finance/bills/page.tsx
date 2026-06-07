import { getBillsByMonth, type ForexRates } from '@/services/familyFinance'
import { fetchForex } from '@/services/market'
import BillsClient from '@/components/family/finance/BillsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string }
}

function prevMonthOf(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export default async function BillsPage({ searchParams }: PageProps) {
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7)
  const prevMonth = prevMonthOf(month)

  const [billsResult, prevBillsResult, forexResult] = await Promise.allSettled([
    getBillsByMonth(month),
    getBillsByMonth(prevMonth),
    fetchForex(),
  ])

  const bills = billsResult.status === 'fulfilled' ? billsResult.value : []
  const prevMonthBills = prevBillsResult.status === 'fulfilled' ? prevBillsResult.value : []
  const forex = forexResult.status === 'fulfilled' ? forexResult.value : []

  const rates: ForexRates = {
    jpy: forex.find(r => r.symbol === 'JPY')?.price ?? 155,
    vnd: forex.find(r => r.symbol === 'VND')?.price ?? 25000,
  }

  return (
    <BillsClient
      key={month}
      initialBills={bills}
      prevMonthBills={prevMonthBills}
      month={month}
      rates={rates}
    />
  )
}
