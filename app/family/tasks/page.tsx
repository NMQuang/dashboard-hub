// ─────────────────────────────────────────────────────────────────────────
// app/family/tasks/page.tsx
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { getTasks } from '@/services/family-storage'
import TasksClient from '@/components/family/TasksClient'
export const metadata: Metadata = { title: 'Tasks · Family' }

export default async function TasksPage() {
  const tasks = await getTasks()
  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / tasks</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Tasks <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>việc nhà ✅</span></h1>
      </div>
      <TasksClient initialTasks={tasks} />
    </div>
  )
}
