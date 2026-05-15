param(
  [ValidateSet("dev", "deploy", "migrate", "push", "all", "help")]
  [string]$Task = "help",

  # For -Task push only
  [string]$Branch = "",
  [string]$Message = ""
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

# ── 4. Push to branch ────────────────────────────────────────────────────────
function Start-Push {
  param([string]$TargetBranch, [string]$CommitMsg)

  # Resolve branch: param → current branch
  if (-not $TargetBranch) {
    $TargetBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "   No branch specified — using current branch: $TargetBranch" -ForegroundColor Yellow
  }

  $currentBranch = git rev-parse --abbrev-ref HEAD

  # Switch branch if needed
  if ($currentBranch -ne $TargetBranch) {
    Write-Step "Switching to branch: $TargetBranch"
    $exists = git branch --list $TargetBranch
    if ($exists) {
      git checkout $TargetBranch
    } else {
      Write-Host "   Branch '$TargetBranch' not found locally — creating from current branch" -ForegroundColor Yellow
      git checkout -b $TargetBranch
    }
    if ($LASTEXITCODE -ne 0) { Write-Fail "Cannot switch to branch '$TargetBranch'"; exit 1 }
  }

  # Stage all changes
  $hasChanges = (git status --porcelain) -ne $null
  if ($hasChanges) {
    Write-Step "Staging all changes"
    git add -A

    if (-not $CommitMsg) {
      $CommitMsg = "chore: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
      Write-Host "   No message provided — using: $CommitMsg" -ForegroundColor Yellow
    }

    git commit -m $CommitMsg
    if ($LASTEXITCODE -ne 0) { Write-Fail "Commit failed"; exit 1 }
    Write-Ok "Committed: $CommitMsg"
  } else {
    Write-Host "   Nothing to commit — working tree clean" -ForegroundColor Yellow
  }

  # Push
  Write-Step "Pushing to origin/$TargetBranch"
  git push origin $TargetBranch
  if ($LASTEXITCODE -ne 0) {
    Write-Host "   Push failed — trying with --set-upstream..." -ForegroundColor Yellow
    git push --set-upstream origin $TargetBranch
    if ($LASTEXITCODE -ne 0) { Write-Fail "Push failed"; exit 1 }
  }
  Write-Ok "Pushed to origin/$TargetBranch"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────
switch ($Task) {
  "dev"     { Start-Dev }
  "deploy"  { Start-Deploy }
  "migrate" { Start-Migrate }
  "push"    { Start-Push -TargetBranch $Branch -CommitMsg $Message }
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
  npm run workflow:push     Stage + commit + push to a branch (see below)
  npm run workflow:all      Migrate then deploy (no dev server)

Push workflow usage (PowerShell direct):
  .\scripts\workflow.ps1 -Task push
      → commit & push on the current branch (auto message)

  .\scripts\workflow.ps1 -Task push -Branch feature/my-feature
      → switch to (or create) branch, then commit & push

  .\scripts\workflow.ps1 -Task push -Branch main -Message "feat: add dark mode"
      → switch to main, commit with custom message, push

Other direct PowerShell usage:
  .\scripts\workflow.ps1 -Task dev
  .\scripts\workflow.ps1 -Task deploy
  .\scripts\workflow.ps1 -Task migrate
  .\scripts\workflow.ps1 -Task all

"@ -ForegroundColor White
  }
}
