import { NextRequest, NextResponse } from 'next/server'
import { getTasks, saveTask, deleteTask } from '@/services/family-storage'
import type { FamilyTask } from '@/types/family'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export async function GET() {
  const tasks = await getTasks()
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const prio: Record<'high' | 'medium' | 'low', number> = {
      high: 0,
      medium: 1,
      low: 2,
    }

    const aPriority = (a.priority ?? 'medium') as keyof typeof prio
    const bPriority = (b.priority ?? 'medium') as keyof typeof prio

    return prio[aPriority] - prio[bPriority]
  })
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<FamilyTask, 'id' | 'done' | 'createdAt' | 'updatedAt'>
  const task: FamilyTask = {
    id: generateId(),
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...body,
  }
  await saveTask(task)
  return NextResponse.json({ task })
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json() as Partial<FamilyTask> & { id: string }
  const all = await getTasks()
  const task = all.find(t => t.id === id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated: FamilyTask = { ...task, ...updates, updatedAt: new Date().toISOString() }
  if (updates.done && !task.done) {
    updated.doneAt = new Date().toISOString()
  }
  await saveTask(updated)
  return NextResponse.json({ task: updated })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteTask(id)
  return NextResponse.json({ ok: true })
}
