/**
 * Apply all SQL migrations to Supabase (Management API)
 *
 * Required in .env.local:
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_ACCESS_TOKEN=<personal access token>
 *     → lấy tại: https://supabase.com/dashboard/account/tokens
 *
 * Usage: npm run db:migrate
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const supabaseUrl = process.env.SUPABASE_URL
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !accessToken) {
  console.error('\n❌ Thiếu env var. Cần có trong .env.local:')
  console.error('   SUPABASE_URL=https://<ref>.supabase.co')
  console.error('   SUPABASE_ACCESS_TOKEN=<token>')
  console.error('   → Lấy token tại: https://supabase.com/dashboard/account/tokens\n')
  process.exit(1)
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error('❌ SUPABASE_URL không đúng format: https://<ref>.supabase.co')
  process.exit(1)
}

// Thu thập SQL files theo thứ tự: supabase/*.sql rồi supabase/migrations/*.sql
const sqlDirs = [join(ROOT, 'supabase'), join(ROOT, 'supabase', 'migrations')]
const files = []

for (const dir of sqlDirs) {
  if (!existsSync(dir)) continue
  const entries = readdirSync(dir, { withFileTypes: true })
  entries
    .filter(e => e.isFile() && e.name.endsWith('.sql'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(e => files.push({ label: e.name, path: join(dir, e.name) }))
}

if (files.length === 0) {
  console.log('Không có SQL file nào trong supabase/ hoặc supabase/migrations/')
  process.exit(0)
}

console.log(`\n🗄️  Applying ${files.length} file(s) → project: ${projectRef}\n`)

for (const { label, path } of files) {
  process.stdout.write(`  ${label.padEnd(50)} `)
  const query = readFileSync(path, 'utf-8')

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.log('✗')
    console.error(`\n  ❌ ${res.status}: ${err}\n`)
    process.exit(1)
  }

  console.log('✓')
}

console.log('\n✅ Tất cả migrations đã được apply thành công.\n')
