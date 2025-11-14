# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - IMPORTAR PARA C:\boot
# ═══════════════════════════════════════════════════════════
# Script para clonar repositório e configurar em C:\boot
# Uso: Execute este script de qualquer lugar
# ═══════════════════════════════════════════════════════════

param(
    [string]$TargetPath = "C:\boot\RapidFlow",
    [switch]$Force = $false
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
Write-Title "🚀 RAPIDFLOW v3.0 - IMPORTAR DO GIT PARA C:\boot"

Write-Host ""
Write-ColorOutput "📁 Diretório de destino: $TargetPath" "Cyan"
Write-Host ""

# ═══════════════════════════════════════════════════════════
# 1. VERIFICAR PRÉ-REQUISITOS
# ═══════════════════════════════════════════════════════════
Write-Title "1️⃣  VERIFICANDO PRÉ-REQUISITOS"

# Git
try {
    $gitVersion = git --version
    Write-Success "Git instalado: $gitVersion"
} catch {
    Write-Error "Git não encontrado!"
    Write-Info "Instale em: https://git-scm.com/"
    exit 1
}

# Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error "Node.js não encontrado!"
    Write-Info "Instale em: https://nodejs.org"
    exit 1
}

# PostgreSQL
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL instalado: $pgVersion"
} catch {
    Write-Error "PostgreSQL não encontrado!"
    Write-Info "Instale em: https://www.postgresql.org/download/windows/"
    exit 1
}

# npm
try {
    $npmVersion = npm --version
    Write-Success "npm instalado: v$npmVersion"
} catch {
    Write-Error "npm não encontrado!"
    exit 1
}

# ═══════════════════════════════════════════════════════════
# 2. VERIFICAR DIRETÓRIO DE DESTINO
# ═══════════════════════════════════════════════════════════
Write-Title "2️⃣  VERIFICANDO DIRETÓRIO DE DESTINO"

# Verificar se C:\boot existe
if (!(Test-Path "C:\boot")) {
    Write-Info "Criando diretório C:\boot..."
    New-Item -ItemType Directory -Path "C:\boot" -Force | Out-Null
    Write-Success "Diretório C:\boot criado"
}

# Verificar se destino já existe
if (Test-Path $TargetPath) {
    if ($Force) {
        Write-Warning "Removendo diretório existente..."
        Remove-Item -Path $TargetPath -Recurse -Force
        Write-Success "Diretório removido"
    } else {
        Write-Error "Diretório $TargetPath já existe!"
        Write-Info "Use -Force para sobrescrever"
        Write-Host ""
        $response = Read-Host "Deseja continuar mesmo assim? (S/N)"
        if ($response -ne "S" -and $response -ne "s") {
            Write-Warning "Operação cancelada pelo usuário"
            exit 0
        }
    }
}

# ═══════════════════════════════════════════════════════════
# 3. CLONAR REPOSITÓRIO
# ═══════════════════════════════════════════════════════════
Write-Title "3️⃣  CLONANDO REPOSITÓRIO DO GITHUB"

$repoUrl = "https://github.com/MoysesTI/RapidFlow.git"

Write-Info "Clonando de: $repoUrl"
Write-Info "Para: $TargetPath"
Write-Host ""

try {
    git clone $repoUrl $TargetPath

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Repositório clonado com sucesso!"
    } else {
        Write-Error "Falha ao clonar repositório"
        exit 1
    }
} catch {
    Write-Error "Erro ao clonar: $($_.Exception.Message)"
    exit 1
}

# Mudar para o diretório clonado
Set-Location $TargetPath
Write-Info "Diretório atual: $PWD"

# ═══════════════════════════════════════════════════════════
# 4. CONFIGURAR AMBIENTE
# ═══════════════════════════════════════════════════════════
Write-Title "4️⃣  CONFIGURANDO AMBIENTE"

# Copiar .env.local para .env
$envLocalPath = "backend\.env.local"
$envPath = "backend\.env"

if (Test-Path $envLocalPath) {
    Copy-Item $envLocalPath $envPath -Force
    Write-Success "Arquivo .env criado"
} else {
    Write-Warning "Arquivo .env.local não encontrado - criando .env manualmente..."

    $envContent = @"
# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - CONFIGURAÇÃO LOCAL
# ═══════════════════════════════════════════════════════════

# AMBIENTE
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# BANCO DE DADOS (PostgreSQL Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=242036
DB_SSL=false

# SEGURANÇA
JWT_SECRET=rapidflow_local_secret_key_development_2025_ultra_secure_token
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500

# ADMIN PADRÃO
ADMIN_USERNAME=admin
ADMIN_PASSWORD=#serverprisma@dti

# N8N WEBHOOK
DEFAULT_WEBHOOK_URL=http://localhost:5678/webhook/prisma
N8N_URL=http://localhost:5678

# EVOLUTION API (Configurar com seus dados)
DEFAULT_EVOLUTION_ENDPOINT=https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem
DEFAULT_EVOLUTION_API_KEY=YOUR_EVOLUTION_KEY_HERE

# OPENAI API
DEFAULT_OPENAI_API_KEY=sk-your-openai-key-here
DEFAULT_OPENAI_MODEL=gpt-4o-mini

# LOGGING
LOG_LEVEL=debug
ENABLE_DETAILED_LOGGING=true
ENABLE_ANALYTICS=true

# PERFORMANCE
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT_MS=30000
WEBHOOK_RETRY_ATTEMPTS=3

# RECURSOS
ENABLE_AI=true
ENABLE_CIRCUIT_BREAKER=true
ENABLE_RATE_LIMITING=false
"@

    Set-Content -Path $envPath -Value $envContent
    Write-Success "Arquivo .env criado manualmente"
}

# ═══════════════════════════════════════════════════════════
# 5. INSTALAR DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════
Write-Title "5️⃣  INSTALANDO DEPENDÊNCIAS"

Write-Info "Instalando dependências do backend..."
Set-Location backend

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependências instaladas com sucesso"
} else {
    Write-Error "Falha ao instalar dependências"
    exit 1
}

Set-Location ..

# ═══════════════════════════════════════════════════════════
# 6. CONFIGURAR BANCO DE DADOS
# ═══════════════════════════════════════════════════════════
Write-Title "6️⃣  CONFIGURANDO BANCO DE DADOS"

$dbName = "rapidflow"
$dbUser = "postgres"
$dbPassword = "242036"

Write-Info "Verificando banco de dados '$dbName'..."

$env:PGPASSWORD = $dbPassword

# Verificar se banco existe
$checkDb = psql -U $dbUser -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>$null

if ($checkDb -eq "1") {
    Write-Success "Banco de dados '$dbName' já existe"

    Write-Warning "O banco já existe. Deseja recriar? (S/N)"
    $recreate = Read-Host

    if ($recreate -eq "S" -or $recreate -eq "s") {
        Write-Info "Recriando banco de dados..."

        # Desconectar usuários
        psql -U $dbUser -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$dbName' AND pid <> pg_backend_pid();" 2>$null

        # Dropar e recriar
        psql -U $dbUser -h localhost -c "DROP DATABASE IF EXISTS $dbName" 2>$null
        psql -U $dbUser -h localhost -c "CREATE DATABASE $dbName" 2>$null

        Write-Success "Banco recriado"
    }
} else {
    Write-Info "Criando banco de dados '$dbName'..."
    psql -U $dbUser -h localhost -c "CREATE DATABASE $dbName"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Banco de dados criado"
    } else {
        Write-Error "Falha ao criar banco de dados"
        Write-Info "Verifique se o PostgreSQL está rodando e a senha está correta"
        exit 1
    }
}

# Executar migrations
Write-Info "Executando migrations..."

$migrations = @(
    "backend\migrations\001_schema.sql",
    "backend\migrations\002_enhanced_logging_system.sql",
    "backend\migrations\001_add_contacts_column.sql"
)

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Info "Executando: $migration"
        psql -U $dbUser -h localhost -d $dbName -f $migration 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ $migration"
        } else {
            Write-Warning "⚠ Falha em $migration (pode ser normal se já foi executada)"
        }
    } else {
        Write-Warning "Migration não encontrada: $migration"
    }
}

$env:PGPASSWORD = $null

# Verificar tabelas criadas
Write-Info "Verificando tabelas criadas..."
$env:PGPASSWORD = $dbPassword
$tableCount = psql -U $dbUser -h localhost -d $dbName -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>$null
$env:PGPASSWORD = $null

if ($tableCount -gt 0) {
    Write-Success "Banco configurado com $tableCount tabelas"
} else {
    Write-Warning "Nenhuma tabela encontrada - verifique as migrations"
}

# ═══════════════════════════════════════════════════════════
# 7. VERIFICAR INSTALAÇÃO
# ═══════════════════════════════════════════════════════════
Write-Title "7️⃣  VERIFICANDO INSTALAÇÃO"

$checks = @(
    @{ Name = "Diretório do projeto"; Test = { Test-Path "$TargetPath" } },
    @{ Name = "Backend package.json"; Test = { Test-Path "$TargetPath\backend\package.json" } },
    @{ Name = "Backend node_modules"; Test = { Test-Path "$TargetPath\backend\node_modules" } },
    @{ Name = "Frontend index.html"; Test = { Test-Path "$TargetPath\frontend\index.html" } },
    @{ Name = "Arquivo .env"; Test = { Test-Path "$TargetPath\backend\.env" } },
    @{ Name = "Logger"; Test = { Test-Path "$TargetPath\backend\src\utils\logger.js" } },
    @{ Name = "Error Handler"; Test = { Test-Path "$TargetPath\backend\src\utils\errorHandler.js" } },
    @{ Name = "Migration 002"; Test = { Test-Path "$TargetPath\backend\migrations\002_enhanced_logging_system.sql" } },
    @{ Name = "Workflow N8N v3.0"; Test = { Test-Path "$TargetPath\n8n-workflow-v3.0.json" } },
    @{ Name = "Script setup-local.ps1"; Test = { Test-Path "$TargetPath\setup-local.ps1" } },
    @{ Name = "Script start-dev.ps1"; Test = { Test-Path "$TargetPath\start-dev.ps1" } },
    @{ Name = "Script test-local.ps1"; Test = { Test-Path "$TargetPath\test-local.ps1" } }
)

$allGood = $true
foreach ($check in $checks) {
    if (& $check.Test) {
        Write-Success $check.Name
    } else {
        Write-Error "$($check.Name) - NÃO ENCONTRADO"
        $allGood = $false
    }
}

if (!$allGood) {
    Write-Warning "Alguns arquivos não foram encontrados - pode haver problemas"
}

# ═══════════════════════════════════════════════════════════
# 8. RESUMO E PRÓXIMOS PASSOS
# ═══════════════════════════════════════════════════════════
Write-Title "✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!"

Write-Host ""
Write-ColorOutput "📁 LOCALIZAÇÃO:" "Cyan"
Write-Host "   $TargetPath" -ForegroundColor Yellow
Write-Host ""

Write-ColorOutput "🔐 CREDENCIAIS DO BANCO:" "Cyan"
Write-Host "   Host:     localhost" -ForegroundColor Yellow
Write-Host "   Porta:    5432" -ForegroundColor Yellow
Write-Host "   Database: rapidflow" -ForegroundColor Yellow
Write-Host "   Usuário:  postgres" -ForegroundColor Yellow
Write-Host "   Senha:    242036" -ForegroundColor Yellow
Write-Host ""

Write-ColorOutput "👤 CREDENCIAIS DA APLICAÇÃO:" "Cyan"
Write-Host "   Email: admin@prismatech.com" -ForegroundColor Green
Write-Host "   Senha: #serverprisma@dti" -ForegroundColor Green
Write-Host ""

Write-ColorOutput "📋 PRÓXIMOS PASSOS:" "Cyan"
Write-Host ""
Write-Host "1. Navegue até o diretório:" -ForegroundColor White
Write-Host "   cd $TargetPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Configure suas chaves de API no arquivo:" -ForegroundColor White
Write-Host "   notepad backend\.env" -ForegroundColor Yellow
Write-Host "   (Evolution API Key e OpenAI API Key)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Inicie o ambiente de desenvolvimento:" -ForegroundColor White
Write-Host "   .\start-dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. OU inicie manualmente:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Acesse a aplicação:" -ForegroundColor White
Write-Host "   Frontend: file://$TargetPath\frontend\login.html" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Health:   http://localhost:5000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. (Opcional) Instalar e configurar N8N:" -ForegroundColor White
Write-Host "   npm install -g n8n" -ForegroundColor Yellow
Write-Host "   n8n start" -ForegroundColor Yellow
Write-Host "   Importar: $TargetPath\n8n-workflow-v3.0.json" -ForegroundColor Yellow
Write-Host ""

Write-ColorOutput "📚 DOCUMENTAÇÃO:" "Cyan"
Write-Host "   SETUP-LOCAL-PT.md  - Guia completo" -ForegroundColor Yellow
Write-Host "   CHANGELOG.md       - Mudanças da v3.0" -ForegroundColor Yellow
Write-Host ""

Write-Success "Ambiente pronto para desenvolvimento em C:\boot!"
Write-Host ""
