# EGX Advisor — One-click Vercel Deploy (Windows PowerShell)
# Run this from inside the egx-advisor folder:
#   Right-click deploy.ps1 → "Run with PowerShell"
#   OR: powershell -ExecutionPolicy Bypass -File deploy.ps1

Set-Location $PSScriptRoot
Write-Host "=== EGX Advisor Deploy ===" -ForegroundColor Cyan

# 1. Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    pause; exit 1
}
Write-Host "Node $(node -v)  npm $(npm -v)" -ForegroundColor Green

# 2. Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; pause; exit 1 }

# 3. Install Vercel CLI if missing
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "`nInstalling Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# 4. Deploy
Write-Host "`nDeploying to Vercel (you may be asked to log in)..." -ForegroundColor Yellow
vercel deploy --prod --yes --name egx-advisor

Write-Host "`n=== Done! Your EGX Advisor is live. ===" -ForegroundColor Cyan
Write-Host "After deploy, go to Vercel dashboard and add these env vars if not already set:"
Write-Host "  NEXT_PUBLIC_SUPABASE_URL = https://imucwryjgdvpgmwepxqs.supabase.co"
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = (see .env file)"
Write-Host "  CRON_SECRET = egx-advisor-cron-2026"
pause
