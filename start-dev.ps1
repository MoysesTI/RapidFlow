# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - INICIAR DESENVOLVIMENTO (PowerShell)
# ═══════════════════════════════════════════════════════════
# Script para iniciar todos os serviços necessários
# Uso: .\start-dev.ps1
# ═══════════════════════════════════════════════════════════

param(
    [switch]$SkipN8n = $false,
    [switch]$SkipBrowser = $false
)

$ErrorActionPreference = "Stop"

# Cores
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param([string]$msg) Write-ColorOutput "✅ $msg" "Green" }
function Write-Error { param([string]$msg) Write-ColorOutput "❌ $msg" "Red" }
function Write-Warning { param([string]$msg) Write-ColorOutput "⚠️  $msg" "Yellow" }
function Write-Info { param([string]$msg) Write-ColorOutput "ℹ️  $msg" "Cyan" }
function Write-Title { param([string]$msg) Write-ColorOutput "`n══════════════════════════════════════════`n$msg`n══════════════════════════════════════════" "Magenta" }

# ═══════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════
Clear-Host
Write-Title "🚀 RAPIDFLOW v3.0 - AMBIENTE DE DESENVOLVIMENTO"

# ═══════════════════════════════════════════════════════════
# 1. VERIFICAR AMBIENTE
# ═══════════════════════════════════════════════════════════
Write-Title "1️⃣  VERIFICANDO AMBIENTE"

# Verificar se .env existe
if (!(Test-Path "backend\.env")) {
    Write-Error "Arquivo backend\.env não encontrado!"
    Write-Info "Execute primeiro: .\setup-local.ps1"
    exit 1
}

Write-Success "Arquivo .env encontrado"

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
} catch {
    Write-Error "Node.js não instalado!"
    exit 1
}

# Verificar PostgreSQL
Write-Info "Verificando PostgreSQL..."
$env:PGPASSWORD = "242036"
$pgCheck = psql -U postgres -h localhost -d rapidflow -c "SELECT 1" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "PostgreSQL conectado"
} else {
    Write-Error "Não foi possível conectar ao PostgreSQL"
    Write-Info "Certifique-se de que o PostgreSQL está rodando"
    exit 1
}
$env:PGPASSWORD = $null

# ═══════════════════════════════════════════════════════════
# 2. VERIFICAR DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════
Write-Title "2️⃣  VERIFICANDO DEPENDÊNCIAS"

if (!(Test-Path "backend\node_modules")) {
    Write-Warning "Dependências não instaladas. Instalando..."
    Set-Location backend
    npm install
    Set-Location ..
    Write-Success "Dependências instaladas"
} else {
    Write-Success "Dependências já instaladas"
}

# ═══════════════════════════════════════════════════════════
# 3. INICIAR SERVIÇOS
# ═══════════════════════════════════════════════════════════
Write-Title "3️⃣  INICIANDO SERVIÇOS"

# Armazenar jobs
$jobs = @()

# Backend
Write-Info "Iniciando Backend..."
Set-Location backend

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm start
} -Name "RapidFlow-Backend"

$jobs += $backendJob
Write-Success "Backend iniciado em background (Job ID: $($backendJob.Id))"

Set-Location ..

# Aguardar backend iniciar
Write-Info "Aguardando backend inicializar..."
Start-Sleep -Seconds 3

# Verificar se backend está rodando
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Success "Backend está respondendo!"
} catch {
    Write-Warning "Backend ainda não está respondendo (isso é normal)"
}

# N8N (opcional)
if (!$SkipN8n) {
    Write-Info "Verificando N8N..."

    # Verificar se n8n está instalado
    $n8nInstalled = Get-Command n8n -ErrorAction SilentlyContinue

    if ($n8nInstalled) {
        Write-Info "Iniciando N8N..."

        $n8nJob = Start-Job -ScriptBlock {
            n8n start
        } -Name "N8N"

        $jobs += $n8nJob
        Write-Success "N8N iniciado em background (Job ID: $($n8nJob.Id))"

    } else {
        Write-Warning "N8N não está instalado"
        Write-Info "Instale com: npm install -g n8n"
    }
} else {
    Write-Info "N8N pulado (--SkipN8n)"
}

# ═══════════════════════════════════════════════════════════
# 4. ABRIR NAVEGADOR
# ═══════════════════════════════════════════════════════════
if (!$SkipBrowser) {
    Write-Title "4️⃣  ABRINDO NAVEGADOR"

    Start-Sleep -Seconds 2

    # Abrir frontend
    $frontendPath = Resolve-Path "frontend\login.html"
    Write-Info "Abrindo frontend: $frontendPath"

    Start-Process "chrome" "file:///$frontendPath" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Start-Process "msedge" "file:///$frontendPath" -ErrorAction SilentlyContinue
        if ($LASTEXITCODE -ne 0) {
            Start-Process "firefox" "file:///$frontendPath" -ErrorAction SilentlyContinue
        }
    }

    Write-Success "Frontend aberto no navegador"
}

# ═══════════════════════════════════════════════════════════
# 5. INFORMAÇÕES
# ═══════════════════════════════════════════════════════════
Write-Title "✅ AMBIENTE INICIADO COM SUCESSO!"

Write-Host ""
Write-ColorOutput "🌐 URLs Disponíveis:" "Cyan"
Write-Host "   Backend API:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Health Check: http://localhost:5000/health" -ForegroundColor Yellow

if (!$SkipN8n) {
    Write-Host "   N8N:          http://localhost:5678" -ForegroundColor Yellow
}

Write-Host ""
Write-ColorOutput "🔐 Credenciais de Acesso:" "Cyan"
Write-Host "   Email: admin@prismatech.com" -ForegroundColor Green
Write-Host "   Senha: #serverprisma@dti" -ForegroundColor Green

Write-Host ""
Write-ColorOutput "📝 Jobs em Execução:" "Cyan"
Get-Job | Format-Table -AutoSize

Write-Host ""
Write-ColorOutput "ℹ️  COMANDOS ÚTEIS:" "Cyan"
Write-Host "   Ver logs do backend:  " -NoNewline; Write-Host "Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor Yellow
Write-Host "   Parar todos os jobs:  " -NoNewline; Write-Host "Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Yellow
Write-Host "   Executar testes:      " -NoNewline; Write-Host ".\test-local.ps1" -ForegroundColor Yellow
Write-Host ""

Write-ColorOutput "⌨️  Pressione Ctrl+C para encerrar todos os serviços" "Yellow"
Write-Host ""

# ═══════════════════════════════════════════════════════════
# 6. MONITORAR JOBS
# ═══════════════════════════════════════════════════════════
Write-Title "📊 MONITORANDO SERVIÇOS (pressione Ctrl+C para parar)"

try {
    while ($true) {
        Start-Sleep -Seconds 5

        # Verificar se jobs ainda estão rodando
        $runningJobs = Get-Job | Where-Object { $_.State -eq "Running" }

        if ($runningJobs.Count -eq 0) {
            Write-Error "Todos os serviços pararam!"
            break
        }

        # Mostrar status
        Write-Host "`r[$(Get-Date -Format 'HH:mm:ss')] Serviços ativos: $($runningJobs.Count)  " -NoNewline -ForegroundColor Green

        # Verificar health do backend
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 2
            Write-Host "| Backend: ✅  " -NoNewline -ForegroundColor Green
        } catch {
            Write-Host "| Backend: ❌  " -NoNewline -ForegroundColor Red
        }

        # Verificar N8N
        if (!$SkipN8n) {
            try {
                $n8nHealth = Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing -TimeoutSec 2
                Write-Host "| N8N: ✅  " -NoNewline -ForegroundColor Green
            } catch {
                Write-Host "| N8N: ❌  " -NoNewline -ForegroundColor Red
            }
        }
    }

} finally {
    # Cleanup ao sair (Ctrl+C)
    Write-Host "`n"
    Write-Warning "Encerrando serviços..."

    Get-Job | Stop-Job
    Get-Job | Remove-Job

    Write-Success "Todos os serviços foram encerrados"
}
