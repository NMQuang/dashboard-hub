import type { DifyRun } from '@/types'

const BASE = process.env.DIFY_BASE_URL ?? 'https://api.dify.ai/v1'

/**
 * Trigger a Dify workflow.
 * Each Dify app has its own API key — pass the correct key for the target workflow.
 * POST /v1/workflows/run
 *
 * Note: The Dify API identifies the workflow by the API key, NOT by workflow_id.
 * The _workflowId param is kept for logging / identification only.
 */
export async function triggerWorkflow(
  _workflowId: string,
  inputs: Record<string, unknown> = {},
  apiKey?: string
): Promise<any> {
  const key = apiKey ?? ''
  if (!key) {
    throw new Error('Dify API key is not configured — set the per-workflow DIFY_*_API_KEY env var')
  }
  try {
    const res = await fetch(`${BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
export async function getWorkflowRun(runId: string, apiKey?: string): Promise<DifyRun> {
  const key = apiKey ?? ''
  if (!key) {
    throw new Error('Dify API key is not configured')
  }
  const res = await fetch(`${BASE}/workflows/run/${runId}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
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
  conversationId?: string,
  apiKey?: string
): Promise<{ answer: string; conversation_id: string }> {
  const key = apiKey ?? ''
  if (!key) {
    throw new Error('Dify API key is not configured')
  }
  try {
    const res = await fetch(`${BASE}/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
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
