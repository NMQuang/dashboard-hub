import { NextRequest, NextResponse } from 'next/server'
import { triggerWorkflow, getWorkflowRun, chatWithDify } from '@/services/dify'

export async function POST(req: NextRequest) {
  const { action, workflowId, inputs, message, conversationId, apiKey } = await req.json()

  try {
    switch (action) {
      case 'trigger':
        return NextResponse.json(await triggerWorkflow(workflowId, inputs, apiKey))
      case 'run':
        return NextResponse.json(await getWorkflowRun(workflowId, apiKey))
      case 'chat':
        return NextResponse.json(await chatWithDify(message, conversationId, apiKey))
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
