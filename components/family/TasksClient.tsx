'use client'

import { useState } from 'react'
import type { FamilyTask, TaskPriority } from '@/types/family'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#6B7280',
}
const PRIORITY_BG: Record<TaskPriority, string> = {
  high: '#FEF2F2',
  medium: '#FFFBEB',
  low: '#F9FAFB',
}

export default function TasksClient({ initialTasks }: { initialTasks: FamilyTask[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assignedTo, setAssignedTo] = useState<'me' | 'partner' | 'both'>('both')
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const pending = tasks.filter(t => !t.done)
  const completed = tasks.filter(t => t.done)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const res = await fetch('/api/family/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), priority, assignedTo, dueDate: dueDate || undefined, createdBy: 'me' }),
    })
    const { task } = await res.json() as { task: FamilyTask }
    setTasks(prev => [task, ...prev])
    setTitle('')
    setDueDate('')
    setPriority('medium')
    setAdding(false)
    setShowForm(false)
  }

  async function toggleDone(task: FamilyTask) {
    const res = await fetch('/api/family/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, done: !task.done, doneBy: 'me' }),
    })
    const { task: updated } = await res.json() as { task: FamilyTask }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/family/tasks?id=${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Chưa xong" value={pending.length} color="var(--red)" />
        <StatCard label="Xong rồi" value={completed.length} color="var(--green)" />
        <StatCard label="Tổng" value={tasks.length} color="var(--ink3)" />
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%', padding: '10px', borderRadius: 10, marginBottom: 14,
          border: '1.5px dashed var(--border2)', background: 'transparent',
          color: 'var(--ink2)', fontSize: 13.5, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {showForm ? '× Đóng' : '+ Thêm task mới'}
      </button>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 18,
        }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tên công việc..."
            autoFocus
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--ink)', outline: 'none', marginBottom: 10, fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {/* Priority */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: priority === p ? PRIORITY_COLORS[p] : 'var(--border)',
                  background: priority === p ? PRIORITY_BG[p] : 'transparent',
                  color: priority === p ? PRIORITY_COLORS[p] : 'var(--ink3)',
                  fontWeight: priority === p ? 500 : 400,
                }}>
                  {p === 'high' ? '⬆ Cao' : p === 'medium' ? '→ TB' : '⬇ Thấp'}
                </button>
              ))}
            </div>
            {/* Assign */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['me', 'partner', 'both'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAssignedTo(a)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: assignedTo === a ? 'var(--ink)' : 'var(--border)',
                  background: assignedTo === a ? 'var(--ink)' : 'transparent',
                  color: assignedTo === a ? '#fff' : 'var(--ink3)',
                  fontWeight: assignedTo === a ? 500 : 400,
                }}>
                  {a === 'me' ? '🇯🇵 Ba Cafe' : a === 'partner' ? '🇻🇳 Mẹ Cafe' : '👫 Cả hai'}
                </button>
              ))}
            </div>
            {/* Due date */}
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--ink2)', outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>
          <button type="submit" disabled={adding || !title.trim()} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--ink)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            opacity: adding || !title.trim() ? 0.4 : 1,
          }}>
            {adding ? '...' : 'Thêm'}
          </button>
        </form>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Chưa xong · {pending.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map(task => (
              <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Xong rồi · {completed.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completed.slice(0, 10).map(task => (
              <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink3)', fontSize: 14 }}>
          Chưa có task nào. Thêm việc cần làm!
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 22, fontWeight: 500, color, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }: {
  task: FamilyTask
  onToggle: (t: FamilyTask) => void
  onDelete: (id: string) => void
}) {
  const assignIcons = { me: '🇯🇵', partner: '🇻🇳', both: '👫' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px',
      opacity: task.done ? 0.55 : 1,
      borderLeft: task.done ? '3px solid var(--green)' : `3px solid ${PRIORITY_COLORS[task.priority]}`,
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          border: `2px solid ${task.done ? 'var(--green)' : 'var(--border2)'}`,
          background: task.done ? 'var(--green)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff',
        }}
      >
        {task.done ? '✓' : ''}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', textDecoration: task.done ? 'line-through' : 'none', fontWeight: 400 }}>
          {task.title}
        </div>
        <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 2, display: 'flex', gap: 8 }}>
          {task.assignedTo && <span>{assignIcons[task.assignedTo]}</span>}
          {task.dueDate && <span>hạn {new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>}
          {task.doneAt && <span>✓ {new Date(task.doneAt).toLocaleDateString('vi-VN')}</span>}
        </div>
      </div>

      {/* Priority badge */}
      <span style={{
        fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], fontWeight: 500,
      }}>
        {task.priority === 'high' ? '↑ Cao' : task.priority === 'medium' ? '→ TB' : '↓ Thấp'}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, padding: '0 2px', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  )
}
