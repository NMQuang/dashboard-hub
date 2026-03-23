import { NextRequest, NextResponse } from 'next/server'
import { triggerWorkflow, getWorkflowRun, chatWithDify } from '@/services/dify'

export async function POST(req: NextRequest) {
  const { action, workflowId, inputs, message, conversationId } = await req.json()

  try {
    switch (action) {
      case 'trigger':
        return NextResponse.json(await triggerWorkflow(workflowId, inputs))
      case 'run':
        return NextResponse.json(await getWorkflowRun(workflowId))
      case 'chat':
        return NextResponse.json(await chatWithDify(message, conversationId))
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
