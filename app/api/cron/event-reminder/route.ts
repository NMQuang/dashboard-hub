/**
 * Cron: Family Event Reminder
 * Schedule: 0 21 * * *  (21:00 UTC = 06:00 JST = 04:00 ICT/Vietnam)
 *
 * Checks family_events for events happening in exactly 7 days.
 * Sends a reminder email via Dify workflow for each matching event.
 *
 * Required env vars:
 *   DIFY_EVENT_REMINDER_API_KEY   — Dify workflow API key
 *   RECIPIENT_EMAIL               — email address to receive reminders
 *   CRON_SECRET                   — (optional) auth token for cron endpoint
 *
 * Also works with direct Resend integration as fallback if no Dify key is set.
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { saveAlert } from '@/lib/alert-store'

export const dynamic = 'force-dynamic'

// ── Category metadata for email ─────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  flight: '✈️ Lịch bay',
  visit: '🏠 Thăm nhà',
  birthday: '🎂 Sinh nhật',
  medical: '🏥 Bác sĩ',
  holiday: '🎌 Ngày lễ',
  trip: '🗺️ Du lịch',
  vaccine: '💉 Tiêm chủng',
  school: '📚 Trường học',
  other: '📅 Sự kiện',
}

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Send email via Resend (direct, no Dify needed) ──────────────────────

async function sendReminderEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[cron/event-reminder] RESEND_API_KEY not set — skipping email')
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'Family Hub <noreply@resend.dev>',
        to: [to],
        subject,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[cron/event-reminder] Resend error:', err)
      return false
    }

    return true
  } catch (e) {
    console.error('[cron/event-reminder] Resend failed:', e)
    return false
  }
}

// ── Send email via Dify workflow ────────────────────────────────────────

async function sendViaDify(
  events: Array<{ title: string; category: string; date: string; location?: string; description?: string }>,
  recipientEmail: string
): Promise<{ success: boolean; runId?: string }> {
  const apiKey = process.env.DIFY_EVENT_REMINDER_API_KEY
  const baseUrl = process.env.DIFY_BASE_URL ?? 'https://api.dify.ai/v1'

  if (!apiKey) return { success: false }

  const eventList = events.map(e =>
    `• ${CATEGORY_LABELS[e.category] ?? e.category} — ${e.title} (${formatDateVi(e.date)})${e.location ? ` tại ${e.location}` : ''}`
  ).join('\n')

  try {
    const res = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          recipient_email: recipientEmail,
          email_subject: `📅 Nhắc nhở: ${events.length} sự kiện gia đình trong 7 ngày tới`,
          event_list: eventList,
          event_count: String(events.length),
        },
        response_mode: 'blocking',
        user: 'dashboard-hub-cron',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[cron/event-reminder] Dify error:', body)
      return { success: false }
    }

    const data = await res.json()
    return { success: true, runId: data.run_id || data.workflow_run_id }
  } catch (e) {
    console.error('[cron/event-reminder] Dify failed:', e)
    return { success: false }
  }
}

// ── Build HTML email body ───────────────────────────────────────────────

function buildEmailHtml(
  events: Array<{ title: string; category: string; date: string; time?: string; location?: string; description?: string }>
): string {
  const rows = events.map(e => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 20px; text-align: center; width: 40px;">
        ${CATEGORY_LABELS[e.category]?.slice(0, 2) ?? '📅'}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">
        <div style="font-size: 15px; font-weight: 600; color: #1a1917;">${e.title}</div>
        <div style="font-size: 13px; color: #6b6860; margin-top: 3px;">
          📆 ${formatDateVi(e.date)}${e.time ? ` · ⏰ ${e.time}` : ''}${e.location ? ` · 📍 ${e.location}` : ''}
        </div>
        ${e.description ? `<div style="font-size: 12px; color: #a8a49d; margin-top: 4px;">${e.description}</div>` : ''}
      </td>
    </tr>
  `).join('')

  return `
    <div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #1a1917, #2d2b28); color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.5; margin-bottom: 8px;">
          🏠 Family Hub · Nhắc nhở
        </div>
        <div style="font-size: 20px; font-weight: 500;">
          ${events.length} sự kiện trong 7 ngày tới
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e8e6e1; border-top: none;">
        ${rows}
      </table>
      <div style="background: #f5f4f2; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e8e6e1; border-top: none;">
        <div style="font-size: 11px; color: #a8a49d; text-align: center;">
          Gửi tự động từ Dashboard Hub · Family Plan
        </div>
      </div>
    </div>
  `
}

// ── Main handler ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Auth check
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipientEmail = process.env.RECIPIENT_EMAIL
  if (!recipientEmail) {
    return NextResponse.json({ error: 'RECIPIENT_EMAIL not set' }, { status: 500 })
  }

  try {
    // Find events happening in exactly 7 days
    const targetDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    let matchingEvents: Array<{
      id: string; title: string; category: string; date: string;
      time?: string; location?: string; description?: string
    }> = []

    if (supabase) {
      const { data, error } = await supabase
        .from('family_events')
        .select('*')
        .eq('date', targetDate)

      if (error) {
        console.error('[cron/event-reminder] Supabase query error:', error)
        return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
      }

      matchingEvents = (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        title: r.title as string,
        category: r.category as string,
        date: r.date as string,
        time: r.time ? (r.time as string).slice(0, 5) : undefined,
        location: r.location as string | undefined,
        description: r.description as string | undefined,
      }))
    }

    if (matchingEvents.length === 0) {
      console.log(`[cron/event-reminder] No events on ${targetDate}`)
      return NextResponse.json({
        success: true,
        message: `No events on ${targetDate}`,
        eventsFound: 0,
      })
    }

    console.log(`[cron/event-reminder] Found ${matchingEvents.length} event(s) on ${targetDate}`)

    // Try Dify first, then Resend fallback
    let emailSent = false
    let runId: string | undefined

    const difyResult = await sendViaDify(matchingEvents, recipientEmail)
    if (difyResult.success) {
      emailSent = true
      runId = difyResult.runId
    } else {
      // Fallback: send directly via Resend
      const html = buildEmailHtml(matchingEvents)
      const subject = `📅 Nhắc nhở: ${matchingEvents.length} sự kiện gia đình ngày ${formatDateVi(targetDate)}`
      emailSent = await sendReminderEmail(recipientEmail, subject, html)
    }

    // Log to alert store
    const eventTitles = matchingEvents.map(e => e.title).join(', ')
    await saveAlert({
      action: 'event-reminder',
      title: `Event Reminder · ${targetDate}`,
      summary: `${matchingEvents.length} event(s): ${eventTitles}`,
      triggeredAt: new Date().toISOString(),
      emailSent,
      runId,
      status: emailSent ? 'success' : 'failed',
      error: emailSent ? undefined : 'Email sending failed (no Dify key or Resend key)',
    })

    return NextResponse.json({
      success: true,
      targetDate,
      eventsFound: matchingEvents.length,
      events: matchingEvents.map(e => ({ title: e.title, category: e.category })),
      emailSent,
      method: runId ? 'dify' : 'resend',
    })
  } catch (e) {
    console.error('[cron/event-reminder]', e)

    await saveAlert({
      action: 'event-reminder',
      title: 'Event Reminder · ERROR',
      summary: String(e),
      triggeredAt: new Date().toISOString(),
      emailSent: false,
      status: 'failed',
      error: String(e),
    })

    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
