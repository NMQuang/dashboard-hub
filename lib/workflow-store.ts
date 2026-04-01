/**
 * Workflow config store — persists user overrides for workflow configs.
 * Dev: writes to .next/cache/workflows.json
 * Production: swap readStore/writeStore for Vercel KV.
 */
import { promises as fs } from 'fs'
import path from 'path'

export interface WorkflowOverride {
  id: string
  name?: string
  desc?: string
  schedule?: string  // display label, e.g. "Daily 07:00 JST / 05:00 ICT"
  cron?: string      // cron expression, e.g. "0 22 * * *"
}

const STORE_PATH = path.join(process.cwd(), '.next', 'cache', 'workflows.json')

async function readStore(): Promise<WorkflowOverride[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8')
    return JSON.parse(raw) as WorkflowOverride[]
  } catch {
    return []
  }
}

async function writeStore(records: WorkflowOverride[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
    await fs.writeFile(STORE_PATH, JSON.stringify(records, null, 2))
  } catch (e) {
    console.error('[workflow-store] write failed:', e)
  }
}

/** Get all overrides */
export async function getWorkflowOverrides(): Promise<WorkflowOverride[]> {
  return readStore()
}

/** Upsert fields for a workflow id */
export async function upsertWorkflowOverride(
  id: string,
  fields: Partial<Omit<WorkflowOverride, 'id'>>
): Promise<WorkflowOverride> {
  const all = await readStore()
  const idx = all.findIndex(w => w.id === id)
  const updated: WorkflowOverride = idx >= 0
    ? { ...all[idx], ...fields }
    : { id, ...fields }
  const next = idx >= 0
    ? all.map((w, i) => (i === idx ? updated : w))
    : [...all, updated]
  await writeStore(next)
  return updated
}

/** Delete overrides for a workflow id (reset to default) */
export async function deleteWorkflowOverride(id: string): Promise<void> {
  const all = await readStore()
  await writeStore(all.filter(w => w.id !== id))
}
