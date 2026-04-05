# ============================================================
# 🚀 QUICK START — Inicia o servidor do scraper localmente
# Mantém o terminal aberto com logs ao vivo
# ============================================================
# USO: powershell -ExecutionPolicy Bypass -File scripts\start-scraper-local.ps1

$SCRAPER_DIR = "$PSScriptRoot\..\scraper"

Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🕷️  Scraper Local — Reybraztech      ║" -ForegroundColor Cyan  
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Servidor: http://localhost:3001" -ForegroundColor Gray
Write-Host "  Ctrl+C para parar`n" -ForegroundColor Gray

# Carrega .env
$envFile = "$SCRAPER_DIR\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
        $parts = $_ -split "=", 2
        [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
    }
    Write-Host "✅ .env carregado" -ForegroundColor Green
}

$env:PORT = "3001"

Set-Location $SCRAPER_DIR
npx ts-node src/server.ts
