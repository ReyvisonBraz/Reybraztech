# ============================================================
# 🧪 TEST LOCAL — Scraper Reybraztech
# Executa e testa o servidor do scraper localmente antes do deploy
# ============================================================
# USO: powershell -ExecutionPolicy Bypass -File scripts\test-scraper-local.ps1

$ErrorActionPreference = "Stop"
$SCRAPER_DIR = "$PSScriptRoot\..\scraper"
$SERVER_URL   = "http://localhost:3001"
$API_KEY      = if ($env:API_KEY) { $env:API_KEY } else { "local-test-key" }

Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧪 Teste Local — Scraper Render    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── 1. Verifica dependências ──────────────────────────────────────────────────
Write-Host "📦 Verificando dependências do scraper..." -ForegroundColor Yellow
Push-Location $SCRAPER_DIR
if (-not (Test-Path "node_modules")) {
    Write-Host "  → Instalando dependências (npm install)..." -ForegroundColor Gray
    npm install
}
Pop-Location

# ── 2. Inicia o servidor em background ───────────────────────────────────────
Write-Host "`n🚀 Iniciando servidor local na porta 3001..." -ForegroundColor Yellow

# Carrega variáveis do .env do scraper
$envFile = "$SCRAPER_DIR\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match "^[A-Z]" } | ForEach-Object {
        $parts = $_ -split "=", 2
        [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1])
    }
    Write-Host "  ✅ Variáveis de .env carregadas" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  scraper\.env não encontrado. Usando variáveis de ambiente do sistema." -ForegroundColor Yellow
    $env:API_KEY = $API_KEY
    $env:PORT = "3001"
}

$serverProcess = Start-Process -PassThru -NoNewWindow -FilePath "npx" `
    -ArgumentList "ts-node", "src/server.ts" `
    -WorkingDirectory $SCRAPER_DIR

Write-Host "  → PID do servidor: $($serverProcess.Id)" -ForegroundColor Gray

# Aguarda o servidor iniciar
Write-Host "  ⏳ Aguardando servidor iniciar (5s)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# ── 3. Testes HTTP ────────────────────────────────────────────────────────────
$headers = @{ "x-api-key" = $API_KEY; "Content-Type" = "application/json" }
$passed = 0; $failed = 0

function Test-Endpoint($name, $method, $url, $body = $null) {
    Write-Host "`n📋 [$name]" -ForegroundColor White
    try {
        $params = @{ Uri = $url; Method = $method; Headers = $headers; TimeoutSec = 30 }
        if ($body) { $params.Body = ($body | ConvertTo-Json) }
        $res = Invoke-WebRequest @params -UseBasicParsing
        $json = $res.Content | ConvertFrom-Json
        Write-Host "  ✅ HTTP $($res.StatusCode): $($res.Content.Substring(0, [Math]::Min(200, $res.Content.Length)))" -ForegroundColor Green
        $script:passed++
        return $json
    } catch {
        Write-Host "  ❌ FALHOU: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

# Teste 1: Health check
Test-Endpoint "GET /health" "GET" "$SERVER_URL/health"

# Teste 2: Jobs list (deve estar vazio)
Test-Endpoint "GET /jobs" "GET" "$SERVER_URL/jobs"

# Teste 3: Job inexistente
Write-Host "`n📋 [GET /job/invalido — deve retornar 404]" -ForegroundColor White
try {
    Invoke-WebRequest -Uri "$SERVER_URL/job/invalido" -Headers $headers -UseBasicParsing | Out-Null
    Write-Host "  ❌ Esperado 404 mas recebeu 200" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✅ 404 correto!" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Teste 4: Inicia job de BUSCA (mais rápido que sync completo)
Write-Host "`n📋 [POST /run action=search — busca rápida para testar]" -ForegroundColor White
$searchBody = @{ action = "search"; query = "reyvison"; searchBy = "buyer_name" }
$jobResponse = Test-Endpoint "POST /run (search)" "POST" "$SERVER_URL/run" $searchBody

if ($jobResponse -and $jobResponse.jobId) {
    $jobId = $jobResponse.jobId
    Write-Host "  🆔 JobId: $jobId — fazendo polling..." -ForegroundColor Cyan
    
    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Seconds 5
        try {
            $poll = Invoke-WebRequest -Uri "$SERVER_URL/job/$jobId" -Headers $headers -UseBasicParsing
            $pollData = $poll.Content | ConvertFrom-Json
            Write-Host "  ⏳ Status: $($pollData.status) | Logs: $($pollData.logs.Count)" -ForegroundColor Gray
            if ($pollData.logs.Count -gt 0) {
                $pollData.logs | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
            }
            if ($pollData.status -eq "done" -or $pollData.status -eq "error") {
                Write-Host "  🏁 Job finalizado: $($pollData.status)" -ForegroundColor $(if ($pollData.status -eq "done") { "Green" } else { "Red" })
                break
            }
        } catch { Write-Host "  ⚠️  Erro no poll: $($_.Exception.Message)" -ForegroundColor Yellow }
    }
}

# ── 4. Resultado ──────────────────────────────────────────────────────────────
Write-Host "`n══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESULTADO: $passed passaram | $failed falharam" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "══════════════════════════════════════`n" -ForegroundColor Cyan

# ── 5. Encerra o servidor ─────────────────────────────────────────────────────
Write-Host "🛑 Encerrando servidor (PID $($serverProcess.Id))..." -ForegroundColor Yellow
Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
Write-Host "✅ Pronto!`n" -ForegroundColor Green
