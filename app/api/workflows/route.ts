import { NextRequest, NextResponse } from 'next/server'
import {
  getWorkflowOverrides,
  upsertWorkflowOverride,
  deleteWorkflowOverride,
} from '@/lib/workflow-store'

/** GET /api/workflows — list all overrides */
export async function GET() {
  const overrides = await getWorkflowOverrides()
  return NextResponse.json(overrides)
}

/** PATCH /api/workflows — update fields for one workflow
 *  Body: { id: string, name?: string, desc?: string, schedule?: string, cron?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id?: string; name?: string; desc?: string; schedule?: string; cron?: string }
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const updated = await upsertWorkflowOverride(id, fields)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

/** DELETE /api/workflows — reset one workflow to defaults
 *  Body: { id: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id?: string }
    if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await deleteWorkflowOverride(body.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
