import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
export const metadata: Metadata = { title: 'Settings' }

const ENV_VARS = [
  { key: 'ANTHROPIC_API_KEY',      label: 'Claude (Anthropic)',   required: true,  hint: 'console.anthropic.com' },
  { key: 'OPENAI_API_KEY',         label: 'OpenAI (GPT-4o)',      required: true,  hint: 'platform.openai.com' },
  { key: 'GEMINI_API_KEY',         label: 'Google Gemini',        required: true,  hint: 'aistudio.google.com' },
  { key: 'GOLD_API_KEY',           label: 'GoldAPI.io',           required: false, hint: 'goldapi.io' },
  { key: 'COINGECKO_API_KEY',      label: 'CoinGecko',            required: false, hint: 'Free tier works without key' },
  { key: 'GITHUB_TOKEN',           label: 'GitHub PAT',           required: false, hint: 'Settings ↁEDeveloper ↁEPAT (classic)' },
  { key: 'GITHUB_USERNAME',        label: 'GitHub username',      required: false, hint: 'Your GitHub handle' },
  { key: 'DIFY_API_KEY',           label: 'Dify API key',         required: false, hint: 'app.dify.ai' },
  { key: 'WEATHER_API_KEY',        label: 'OpenWeatherMap',       required: false, hint: 'openweathermap.org (free tier)' },
  { key: 'NEXT_PUBLIC_ONSITE_DATE',label: 'Japan onsite date',    required: false, hint: 'Format: YYYY-MM-DD' },
]

export default function SettingsPage() {
  return (
    <div className="page-content" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>system / settings</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Settings</h1>
      </div>

      {/* Appearance */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Toggle between light and dark mode. Saved in browser storage.</div>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* Environment Variables */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader><CardTitle>Environment variables</CardTitle></CardHeader>
        <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.6 }}>
          Copy <span className="font-mono" style={{ fontSize: 11.5, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>.env.local.example</span> to{' '}
          <span className="font-mono" style={{ fontSize: 11.5, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>.env.local</span> and fill in your keys.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ENV_VARS.map(v => (
            <div key={v.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{v.key}</span>
                  {v.required && <span style={{ fontSize: 10, color: 'var(--red)', background: 'var(--red-bg)', padding: '1px 6px', borderRadius: 20 }}>required</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{v.label} · {v.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Deploy */}
      <Card>
        <CardHeader><CardTitle>Deploy to Vercel</CardTitle></CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            '1. Push this project to a GitHub repo',
            '2. Import into Vercel (vercel.com/new)',
            '3. Add all env vars in Vercel ↁEProject ↁESettings ↁEEnvironment Variables',
            '4. Deploy  Eauto-deploys on every git push',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', flexShrink: 0, marginTop: 2 }}>0{i + 1}</span>
              <span style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
