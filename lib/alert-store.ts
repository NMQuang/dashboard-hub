/**
 * Alert store — persists triggered cron-job results.
 *
 * Production : writes to Supabase table `cron_runs`
 * Dev fallback: writes to .next/cache/alerts.json  (when SUPABASE_URL not set)
 *
 * Table DDL (run once in Supabase SQL editor):
 * ─────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS cron_runs (
 *   id           TEXT PRIMARY KEY,
 *   action       TEXT        NOT NULL,
 *   title        TEXT,
 *   summary      TEXT,
 *   triggered_at TIMESTAMPTZ,
 *   email_sent   BOOLEAN     DEFAULT false,
 *   run_id       TEXT,
 *   outputs      JSONB,
 *   status       TEXT        DEFAULT 'success',   -- 'success' | 'failed'
 *   error        TEXT,
 *   created_at   TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE INDEX IF NOT EXISTS cron_runs_action_idx ON cron_runs (action);
 * CREATE INDEX IF NOT EXISTS cron_runs_triggered_at_idx ON cron_runs (triggered_at DESC);
 * ─────────────────────────────────────────────
 */
import { promises as fs } from 'fs'
import path from 'path'
import { supabase } from './supabase'

export interface AlertRecord {
  id: string
  action: string        // 'morning-brief' | 'gold-alert' | 'crypto-digest' | 'fx-digest'
  title: string
  summary: string
  triggeredAt: string   // ISO timestamp
  emailSent: boolean
  runId?: string
  outputs?: Record<string, unknown>
  status?: 'success' | 'failed'
  error?: string
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function toRow(r: AlertRecord) {
  return {
    id:           r.id,
    action:       r.action,
    title:        r.title,
    summary:      r.summary,
    triggered_at: r.triggeredAt,
    email_sent:   r.emailSent,
    run_id:       r.runId ?? null,
    outputs:      r.outputs ?? null,
    status:       r.status ?? 'success',
    error:        r.error ?? null,
  }
}

function fromRow(row: Record<string, unknown>): AlertRecord {
  return {
    id:          row.id as string,
    action:      row.action as string,
    title:       row.title as string,
    summary:     row.summary as string,
    triggeredAt: row.triggered_at as string,
    emailSent:   row.email_sent as boolean,
    runId:       row.run_id as string | undefined,
    outputs:     row.outputs as Record<string, unknown> | undefined,
    status:      row.status as 'success' | 'failed' | undefined,
    error:       row.error as string | undefined,
  }
}

async function dbSave(record: AlertRecord): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('cron_runs').upsert(toRow(record))
  if (error) console.error('[alert-store] Supabase upsert error:', error.message)
}

async function dbGetAll(action?: string): Promise<AlertRecord[]> {
  if (!supabase) return []
  let q = supabase
    .from('cron_runs')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(50)
  if (action) q = q.eq('action', action)
  const { data, error } = await q
  if (error) {
    console.error('[alert-store] Supabase select error:', error.message)
    return []
  }
  return (data ?? []).map(fromRow)
}

// ── File-based fallback (local dev only) ──────────────────────────────────────

const STORE_PATH = path.join(process.cwd(), '.next', 'cache', 'alerts.json')

async function fileSave(record: AlertRecord): Promise<void> {
  try {
    let existing: AlertRecord[] = []
    try {
      existing = JSON.parse(await fs.readFile(STORE_PATH, 'utf-8'))
    } catch { /* first run */ }
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
    await fs.writeFile(
      STORE_PATH,
      JSON.stringify([record, ...existing].slice(0, 50), null, 2),
    )
  } catch (e) {
    console.error('[alert-store] file write failed:', e)
  }
}

async function fileGetAll(action?: string): Promise<AlertRecord[]> {
  try {
    const all: AlertRecord[] = JSON.parse(await fs.readFile(STORE_PATH, 'utf-8'))
    return action ? all.filter(a => a.action === action) : all
  } catch {
    return []
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Persist a cron-job run (success or failure). */
export async function saveAlert(record: Omit<AlertRecord, 'id'>): Promise<AlertRecord> {
  const full: AlertRecord = {
    id:     `${record.action}-${Date.now()}`,
    status: 'success',
    ...record,
  }
  if (supabase) {
    await dbSave(full)
  } else {
    await fileSave(full)
  }
  return full
}

/** Get stored alerts, newest first. */
export async function getAlerts(action?: string): Promise<AlertRecord[]> {
  return supabase ? dbGetAll(action) : fileGetAll(action)
}
