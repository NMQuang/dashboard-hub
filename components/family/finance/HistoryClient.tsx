'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FinanceHistoryEntry, FinanceEntityType, FinanceHistoryAction } from '@/types/family'

const ENTITY_FILTERS: { key: FinanceEntityType | 'all'; label: string; icon: string }[] = [
  { key: 'all',        label: 'Tất cả',    icon: '◉' },
  { key: 'income',     label: 'Thu nhập',  icon: '↑' },
  { key: 'expense',    label: 'Chi tiêu',  icon: '↓' },
  { key: 'bill',       label: 'Hóa đơn',  icon: '🗒' },
  { key: 'debt',       label: 'Nợ',        icon: '⇄' },
  { key: 'investment', label: 'Đầu tư',   icon: '◈' },
]

const ACTION_COLOR: Record<FinanceHistoryAction, string> = {
  created: '#22c55e',
  updated: '#3b82f6',
  deleted: '#ef4444',
}

const ACTION_LABEL: Record<FinanceHistoryAction, string> = {
  created: 'Thêm',
  updated: 'Cập nhật',
  deleted: 'Xóa',
}

const ENTITY_LABEL: Record<FinanceEntityType, string> = {
  income:     'Thu nhập',
  expense:    'Chi tiêu',
  bill:       'Hóa đơn',
  debt:       'Nợ',
  investment: 'Đầu tư',
}

const ENTITY_ICON: Record<FinanceEntityType, string> = {
  income:     '↑',
  expense:    '↓',
  bill:       '🗒',
  debt:       '⇄',
  investment: '◈',
}

function groupByDay(entries: FinanceHistoryEntry[]): { label: string; entries: FinanceHistoryEntry[] }[] {
  const map = new Map<string, FinanceHistoryEntry[]>()
  for (const e of entries) {
    const day = e.createdAt.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(e)
  }
  return Array.from(map.entries()).map(([day, items]) => ({
    label: formatDayLabel(day),
    entries: items,
  }))
}

function formatDayLabel(day: string): string {
  const d = new Date(day + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryClient() {
  const [entries, setEntries] = useState<FinanceHistoryEntry[]>([])
  const [filter, setFilter] = useState<FinanceEntityType | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const PAGE = 50

  const load = useCallback(async (off: number, typ: FinanceEntityType | 'all', replace: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(off) })
      if (typ !== 'all') params.set('type', typ)
      const res = await fetch(`/api/family/finance/history?${params}`)
      const data = (await res.json()) as { entries: FinanceHistoryEntry[]; hasMore: boolean }
      setEntries(prev => replace ? data.entries : [...prev, ...data.entries])
      setHasMore(data.hasMore)
      setOffset(off + data.entries.length)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setEntries([])
    setOffset(0)
    setHasMore(false)
    load(0, filter, true)
  }, [filter, load])

  const groups = groupByDay(entries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ENTITY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
              background: filter === f.key ? 'var(--ink)' : 'var(--surface2)',
              color: filter === f.key ? '#fff' : 'var(--ink2)',
              border: '1px solid', borderColor: filter === f.key ? 'var(--ink)' : 'var(--border)',
              fontWeight: filter === f.key ? 500 : 400,
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            <span style={{ fontSize: 10, opacity: filter === f.key ? 1 : 0.6 }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading && entries.length === 0 ? (
        <div style={{ color: 'var(--ink3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
          Đang tải lịch sử…
        </div>
      ) : entries.length === 0 ? (
        <div style={{ color: 'var(--ink3)', fontSize: 13, padding: '48px 0', textAlign: 'center' }}>
          Chưa có lịch sử nào.{filter !== 'all' && ' Thử chọn "Tất cả".'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map(group => (
            <div key={group.label}>
              {/* Day header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 600, color: 'var(--ink2)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                  {group.entries.length} thao tác
                </span>
              </div>

              {/* Entries */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 0,
                border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
              }}>
                {group.entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 14px',
                      background: 'var(--surface)',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Action dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: ACTION_COLOR[entry.action],
                      marginTop: 5, flexShrink: 0,
                    }} />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {/* Entity badge */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10.5, padding: '1px 7px', borderRadius: 10,
                          background: 'var(--surface2)', color: 'var(--ink2)',
                          border: '1px solid var(--border)',
                          fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 9 }}>{ENTITY_ICON[entry.entityType]}</span>
                          {ENTITY_LABEL[entry.entityType]}
                        </span>
                        {/* Action badge */}
                        <span style={{
                          fontSize: 10.5, padding: '1px 7px', borderRadius: 10,
                          background: ACTION_COLOR[entry.action] + '18',
                          color: ACTION_COLOR[entry.action],
                          border: `1px solid ${ACTION_COLOR[entry.action]}30`,
                          fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {ACTION_LABEL[entry.action]}
                        </span>
                        {/* Month tag */}
                        {entry.month && (
                          <span style={{
                            fontSize: 10.5, color: 'var(--ink3)', whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            {entry.month}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--ink)', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.description}
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{
                      fontSize: 11.5, color: 'var(--ink3)', whiteSpace: 'nowrap',
                      flexShrink: 0, marginTop: 4,
                    }}>
                      {formatTime(entry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => load(offset, filter, false)}
                disabled={loading}
                style={{
                  padding: '8px 24px', borderRadius: 20, fontSize: 13, cursor: loading ? 'default' : 'pointer',
                  background: 'var(--surface2)', color: 'var(--ink2)',
                  border: '1px solid var(--border)', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Đang tải…' : 'Xem thêm'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
