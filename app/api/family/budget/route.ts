import { NextRequest, NextResponse } from 'next/server'
import { getBudgetEntries, saveBudgetEntry } from '@/services/family-storage'
import type { BudgetEntry } from '@/types/family'

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const entries = await getBudgetEntries(month)
  entries.sort((a, b) => b.date.localeCompare(a.date))
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const entry = await req.json() as BudgetEntry
  await saveBudgetEntry(entry)
  return NextResponse.json({ entry })
}
