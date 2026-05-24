import { NextResponse } from 'next/server'
import { fetchVNGold } from '@/services/market'

export async function GET(): Promise<NextResponse> {
  const prices = await fetchVNGold()
  return NextResponse.json({ prices })
}
