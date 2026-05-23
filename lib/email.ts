/** Shared Resend email sender used by cron jobs and event-driven notifications. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'Family Hub <noreply@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[email] Resend error:', await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error('[email] fetch failed:', e)
    return false
  }
}
