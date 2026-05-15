param(
  [ValidateSet("dev", "deploy", "migrate", "all", "help")]
  [string]$Task = "help"
)

$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Write-Step { param([string]$Msg) Write-Host "`n>> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "   OK  $Msg" -ForegroundColor Green }
function Write-Fail { param([string]$Msg) Write-Host "   ERR $Msg" -ForegroundColor Red }

# ── 1. Dev server ────────────────────────────────────────────────────────────
function Start-Dev {
  Write-Step "Starting local dev server on port 3000"

  $occupied = netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
  if ($occupied) {
    $pid = ($occupied -split "\s+")[-1]
    Write-Host "   Port 3000 in use by PID $pid — stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
  }

  Write-Ok "Launching: npm run dev"
  npm run dev
}

# ── 2. Deploy to Vercel ──────────────────────────────────────────────────────
function Start-Deploy {
  Write-Step "Building project"
  npm run build
  if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed — aborting deploy"; exit 1 }
  Write-Ok "Build passed"

  Write-Step "Deploying to Vercel (production)"
  npx vercel --prod
  if ($LASTEXITCODE -ne 0) { Write-Fail "Vercel deploy failed"; exit 1 }
  Write-Ok "Deployed successfully"
}

# ── 3. DB migration ──────────────────────────────────────────────────────────
function Start-Migrate {
  Write-Step "Running Supabase DB migrations"

  if (-not (Test-Path "$Root\.env.local")) {
    Write-Fail ".env.local not found — copy .env.local.example and fill in SUPABASE_URL + SUPABASE_ACCESS_TOKEN"
    exit 1
  }

  node --env-file=.env.local scripts/db-migrate.mjs
  if ($LASTEXITCODE -ne 0) { Write-Fail "Migration failed"; exit 1 }
  Write-Ok "All migrations applied"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────
switch ($Task) {
  "dev"     { Start-Dev }
  "deploy"  { Start-Deploy }
  "migrate" { Start-Migrate }
  "all" {
    Start-Migrate
    Start-Deploy
    Write-Host "`n✅ Migrate + Deploy complete. Start dev separately with: npm run workflow:dev`n" -ForegroundColor Green
  }
  "help" {
    Write-Host @"

Dashboard Hub — Workflow Commands
──────────────────────────────────
  npm run workflow:dev      Start local dev server (port 3000, kills existing)
  npm run workflow:deploy   Build check then deploy to Vercel production
  npm run workflow:migrate  Apply all SQL migrations to Supabase
  npm run workflow:all      Migrate then deploy (no dev server)

Direct PowerShell usage:
  .\scripts\workflow.ps1 -Task dev
  .\scripts\workflow.ps1 -Task deploy
  .\scripts\workflow.ps1 -Task migrate
  .\scripts\workflow.ps1 -Task all

"@ -ForegroundColor White
  }
}
