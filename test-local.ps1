# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - TESTES LOCAIS (PowerShell)
# ═══════════════════════════════════════════════════════════
# Script para testar a aplicação localmente
# Uso: .\test-local.ps1 [-TestType <tipo>]
# ═══════════════════════════════════════════════════════════

param(
    [ValidateSet("all", "health", "auth", "database", "api", "n8n")]
    [string]$TestType = "all",
    [string]$BaseUrl = "http://localhost:5000",
    [string]$N8nUrl = "http://localhost:5678"
)

$ErrorActionPreference = "Continue"

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

# Contador de testes
$script:PassedTests = 0
$script:FailedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Info "Testando: $Name"

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params

        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Success "$Name - Status: $($response.StatusCode)"
            $script:PassedTests++

            # Mostrar resposta se for JSON
            try {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "   Resposta: " -NoNewline -ForegroundColor Gray
                Write-Host ($json | ConvertTo-Json -Compress) -ForegroundColor DarkGray
            } catch {}

            return $true
        } else {
            Write-Error "$Name - Status inesperado: $($response.StatusCode) (esperado: $ExpectedStatus)"
            $script:FailedTests++
            return $false
        }

    } catch {
        Write-Error "$Name - Falhou: $($_.Exception.Message)"
        $script:FailedTests++
        return $false
    }
}

# ═══════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════
Clear-Host
Write-Title "🧪 RAPIDFLOW v3.0 - TESTES LOCAIS"

# ═══════════════════════════════════════════════════════════
# 1. TESTE DE SAÚDE (HEALTH CHECK)
# ═══════════════════════════════════════════════════════════
if ($TestType -eq "all" -or $TestType -eq "health") {
    Write-Title "1️⃣  TESTE DE SAÚDE"

    Test-Endpoint -Name "Health Check" -Url "$BaseUrl/health"

    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# 2. TESTE DE BANCO DE DADOS
# ═══════════════════════════════════════════════════════════
if ($TestType -eq "all" -or $TestType -eq "database") {
    Write-Title "2️⃣  TESTE DE BANCO DE DADOS"

    $env:PGPASSWORD = "242036"

    Write-Info "Verificando conexão com PostgreSQL..."
    $dbTest = psql -U postgres -h localhost -d rapidflow -c "SELECT NOW() as current_time" 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Conexão com banco de dados OK"
        $script:PassedTests++
    } else {
        Write-Error "Falha ao conectar com banco de dados"
        $script:FailedTests++
    }

    Write-Info "Verificando tabelas..."
    $tablesCheck = psql -U postgres -h localhost -d rapidflow -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>$null

    if ($tablesCheck -gt 0) {
        Write-Success "Banco de dados possui $tablesCheck tabelas"
        $script:PassedTests++
    } else {
        Write-Error "Nenhuma tabela encontrada no banco"
        $script:FailedTests++
    }

    # Listar tabelas
    Write-Info "Tabelas encontradas:"
    psql -U postgres -h localhost -d rapidflow -c "\dt" 2>$null | ForEach-Object {
        Write-Host "   $_" -ForegroundColor DarkGray
    }

    $env:PGPASSWORD = $null

    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# 3. TESTE DE AUTENTICAÇÃO
# ═══════════════════════════════════════════════════════════
if ($TestType -eq "all" -or $TestType -eq "auth") {
    Write-Title "3️⃣  TESTE DE AUTENTICAÇÃO"

    # Login
    $loginBody = @{
        email = "admin@prismatech.com"
        password = "#serverprisma@dti"
    }

    Write-Info "Tentando login..."
    try {
        $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10

        if ($loginResponse.token) {
            Write-Success "Login bem-sucedido - Token recebido"
            $script:PassedTests++

            $script:AuthToken = $loginResponse.token
            Write-Host "   Token: $($script:AuthToken.Substring(0, 20))..." -ForegroundColor DarkGray

        } else {
            Write-Error "Login falhou - Token não recebido"
            $script:FailedTests++
        }

    } catch {
        Write-Error "Login falhou: $($_.Exception.Message)"
        $script:FailedTests++
    }

    # Testar rota protegida
    if ($script:AuthToken) {
        Write-Info "Testando rota protegida..."

        $headers = @{
            "Authorization" = "Bearer $($script:AuthToken)"
        }

        Test-Endpoint -Name "Listar Campanhas (Auth)" -Url "$BaseUrl/api/campaigns" -Headers $headers
    }

    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# 4. TESTE DE API
# ═══════════════════════════════════════════════════════════
if ($TestType -eq "all" -or $TestType -eq "api") {
    Write-Title "4️⃣  TESTE DE ENDPOINTS DA API"

    if (!$script:AuthToken) {
        Write-Warning "Token de autenticação não disponível - executando login..."

        try {
            $loginBody = @{
                email = "admin@prismatech.com"
                password = "#serverprisma@dti"
            }
            $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
            $script:AuthToken = $loginResponse.token
        } catch {
            Write-Error "Não foi possível obter token de autenticação"
        }
    }

    if ($script:AuthToken) {
        $headers = @{
            "Authorization" = "Bearer $($script:AuthToken)"
        }

        # Listar campanhas
        Test-Endpoint -Name "GET /api/campaigns" -Url "$BaseUrl/api/campaigns" -Headers $headers

        # Listar configurações
        Test-Endpoint -Name "GET /api/config" -Url "$BaseUrl/api/config" -Headers $headers

        # Health check novamente
        Test-Endpoint -Name "GET /health" -Url "$BaseUrl/health"

    } else {
        Write-Error "Testes de API pulados - sem token de autenticação"
    }

    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# 5. TESTE DE N8N
# ═══════════════════════════════════════════════════════════
if ($TestType -eq "all" -or $TestType -eq "n8n") {
    Write-Title "5️⃣  TESTE DE N8N"

    # Verificar se N8N está rodando
    try {
        $n8nResponse = Invoke-WebRequest -Uri $N8nUrl -UseBasicParsing -TimeoutSec 5

        if ($n8nResponse.StatusCode -eq 200) {
            Write-Success "N8N está rodando em $N8nUrl"
            $script:PassedTests++
        } else {
            Write-Warning "N8N respondeu com status: $($n8nResponse.StatusCode)"
        }

    } catch {
        Write-Warning "N8N não está acessível em $N8nUrl"
        Write-Info "Certifique-se de que o N8N está rodando: n8n start"
    }

    # Teste de webhook
    $webhookUrl = "$N8nUrl/webhook/prisma"

    Write-Info "Testando webhook N8N..."
    $testPayload = @{
        test = $true
        contacts = @()
        config = @{
            evolutionEndpoint = "https://test.com"
            evolutionApiKey = "test-key"
        }
    }

    try {
        $webhookResponse = Invoke-RestMethod -Uri $webhookUrl -Method POST -Body ($testPayload | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10

        if ($webhookResponse.success) {
            Write-Success "Webhook N8N respondeu com sucesso"
            $script:PassedTests++
        } else {
            Write-Warning "Webhook N8N respondeu mas sem sucesso"
            Write-Host "   Resposta: $($webhookResponse | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
        }

    } catch {
        Write-Warning "Webhook N8N não respondeu: $($_.Exception.Message)"
        Write-Info "Configure o workflow N8N primeiro"
    }

    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# RESUMO
# ═══════════════════════════════════════════════════════════
Write-Title "📊 RESUMO DOS TESTES"

$totalTests = $script:PassedTests + $script:FailedTests

Write-Host ""
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Success "Testes bem-sucedidos: $($script:PassedTests)"
Write-Error "Testes falharam: $($script:FailedTests)"
Write-Host ""

if ($script:FailedTests -eq 0) {
    Write-ColorOutput "🎉 TODOS OS TESTES PASSARAM!" "Green"
} else {
    Write-ColorOutput "⚠️  ALGUNS TESTES FALHARAM" "Yellow"
}

Write-Host ""

# Retornar código de saída
if ($script:FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}
