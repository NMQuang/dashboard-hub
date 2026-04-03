import type { DifyRun } from '@/types'

const BASE = process.env.DIFY_BASE_URL ?? 'https://api.dify.ai/v1'

const headers = () => ({
  Authorization: `Bearer ${process.env.DIFY_API_KEY ?? ''}`,
  'Content-Type': 'application/json',
})

const isDifyConfigured = () => Boolean(process.env.DIFY_API_KEY)

/**
 * Trigger a Dify workflow by its workflow_id.
 * The API key must be scoped to the specific Dify app.
 * POST /v1/workflows/run
 */
export async function triggerWorkflow(
  workflowId: string,
  inputs: Record<string, unknown> = {}
): Promise<any> {
  if (!isDifyConfigured()) {
    throw new Error('DIFY_API_KEY is not configured')
  }
  try {
    const res = await fetch(`${BASE}/workflows/run`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        workflow_id: workflowId,
        inputs,
        response_mode: 'blocking',
        user: 'dashboard-hub-dashboard',
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Dify workflow error ${res.status}: ${body}`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error(`Dify workflow unexpected error: ${String(e)}`)
  }
}

/** Get a workflow run result by run ID */
export async function getWorkflowRun(runId: string): Promise<DifyRun> {
  if (!isDifyConfigured()) {
    throw new Error('DIFY_API_KEY is not configured')
  }
  const res = await fetch(`${BASE}/workflows/run/${runId}`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Dify run error: ${res.status}`)
  const data = await res.json()
  return {
    id: data.id,
    workflowId: data.workflow_id,
    status: data.status,
    output: data.outputs?.text ?? JSON.stringify(data.outputs ?? {}),
    startedAt: data.created_at,
    finishedAt: data.finished_at ?? null,
  }
}

/**
 * Chat with a Dify app (used for daily alert bot / market report).
 * POST /v1/chat-messages  — the API key scopes to the target Dify app.
 */
export async function chatWithDify(
  message: string,
  conversationId?: string
): Promise<{ answer: string; conversation_id: string }> {
  if (!isDifyConfigured()) {
    throw new Error('DIFY_API_KEY is not configured')
  }
  try {
    const res = await fetch(`${BASE}/chat-messages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        query: message,
        conversation_id: conversationId,
        response_mode: 'blocking',
        user: 'dashboard-hub-dashboard',
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Dify chat error ${res.status}: ${body}`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error(`Dify chat unexpected error: ${String(e)}`)
  }
}
