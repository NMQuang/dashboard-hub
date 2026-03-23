/**
 * Alert store — persists triggered alert results.
 * Dev: writes to .next/cache/alerts.json
 * Production: swap for Vercel KV by replacing read/write functions.
 */
import { promises as fs } from 'fs'
import path from 'path'

export interface AlertRecord {
  id: string
  action: string       // 'morning-brief' | 'gold-alert' | 'crypto-digest' | 'fx-digest'
  title: string
  summary: string      // AI-generated content from Dify
  triggeredAt: string  // ISO timestamp
  emailSent: boolean
  runId?: string
  outputs?: any        // Full JSON outputs from Dify workflow run
}

const STORE_PATH = path.join(process.cwd(), '.next', 'cache', 'alerts.json')

async function readStore(): Promise<AlertRecord[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8')
    return JSON.parse(raw) as AlertRecord[]
  } catch {
    return []
  }
}

async function writeStore(records: AlertRecord[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
    await fs.writeFile(STORE_PATH, JSON.stringify(records, null, 2))
  } catch (e) {
    console.error('[alert-store] write failed:', e)
  }
}

/** Prepend a new alert and keep the latest 50 */
export async function saveAlert(record: Omit<AlertRecord, 'id'>): Promise<AlertRecord> {
  const existing = await readStore()
  const full: AlertRecord = {
    id: `${record.action}-${Date.now()}`,
    ...record,
  }
  await writeStore([full, ...existing].slice(0, 50))
  return full
}

/** Get all stored alerts, newest first */
export async function getAlerts(action?: string): Promise<AlertRecord[]> {
  const all = await readStore()
  return action ? all.filter(a => a.action === action) : all
}
