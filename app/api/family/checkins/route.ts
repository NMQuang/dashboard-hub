import { NextRequest, NextResponse } from 'next/server'
import { getCheckIns, saveCheckIn, getRecentCheckIns } from '@/services/family-storage'
import { translateCheckIn } from '@/services/family-ai'
import type { DailyCheckIn } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// GET /api/family/checkins?month=2025-06 OR ?recent=14
export async function GET(req: NextRequest) {
  const month  = req.nextUrl.searchParams.get('month')
  const recent = req.nextUrl.searchParams.get('recent')

  if (recent) {
    const checkins = await getRecentCheckIns(Number(recent))
    return NextResponse.json({ checkins })
  }

  const ym = month ?? new Date().toISOString().slice(0, 7)
  const checkins = await getCheckIns(ym)
  return NextResponse.json({ checkins })
}

// POST /api/family/checkins
// Body: { author, mood, text, textJa?, location?, photoUrl? }
export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<DailyCheckIn, 'id' | 'date' | 'createdAt'>

  const checkIn: DailyCheckIn = {
    id: generateId(),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    ...body,
  }

  // Auto-translate Japanese text in background
  if (checkIn.textJa && !checkIn.textViTranslated) {
    void translateCheckIn(checkIn.textJa).then(translated => {
      if (translated) {
        saveCheckIn({ ...checkIn, textViTranslated: translated })
      }
    })
  }

  await saveCheckIn(checkIn)
  return NextResponse.json({ checkIn })
}
