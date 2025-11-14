# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - SETUP LOCAL (PowerShell)
# ═══════════════════════════════════════════════════════════
# Script para configurar ambiente de desenvolvimento local
# Uso: .\setup-local.ps1
# ═══════════════════════════════════════════════════════════

param(
    [switch]$SkipDatabase = $false,
    [switch]$SkipNpm = $false,
    [switch]$Force = $false
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Cores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
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
Write-Title "🚀 RAPIDFLOW v3.0 - SETUP LOCAL"

# ═══════════════════════════════════════════════════════════
# 1. VERIFICAR PRÉ-REQUISITOS
# ═══════════════════════════════════════════════════════════
Write-Title "1️⃣  VERIFICANDO PRÉ-REQUISITOS"

# Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error "Node.js não encontrado! Instale em: https://nodejs.org"
    exit 1
}

# PostgreSQL
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL instalado: $pgVersion"
} catch {
    Write-Error "PostgreSQL não encontrado! Instale em: https://www.postgresql.org"
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
# 2. CONFIGURAR AMBIENTE
# ═══════════════════════════════════════════════════════════
Write-Title "2️⃣  CONFIGURANDO AMBIENTE"

# Copiar .env.local para .env
$envLocalPath = "backend\.env.local"
$envPath = "backend\.env"

if (Test-Path $envLocalPath) {
    if ((Test-Path $envPath) -and !$Force) {
        Write-Warning "Arquivo .env já existe. Use -Force para sobrescrever."
    } else {
        Copy-Item $envLocalPath $envPath -Force
        Write-Success "Arquivo .env criado a partir de .env.local"
    }
} else {
    Write-Error "Arquivo .env.local não encontrado!"
    exit 1
}

# ═══════════════════════════════════════════════════════════
# 3. INSTALAR DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════
if (!$SkipNpm) {
    Write-Title "3️⃣  INSTALANDO DEPENDÊNCIAS"

    # Backend
    Write-Info "Instalando dependências do backend..."
    Set-Location backend
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependências do backend instaladas"
    } else {
        Write-Error "Falha ao instalar dependências do backend"
        exit 1
    }
    Set-Location ..

} else {
    Write-Warning "Instalação de dependências pulada (--SkipNpm)"
}

# ═══════════════════════════════════════════════════════════
# 4. CONFIGURAR BANCO DE DADOS
# ═══════════════════════════════════════════════════════════
if (!$SkipDatabase) {
    Write-Title "4️⃣  CONFIGURANDO BANCO DE DADOS"

    $dbName = "rapidflow"
    $dbUser = "postgres"
    $dbPassword = "242036"

    # Verificar se banco existe
    Write-Info "Verificando banco de dados '$dbName'..."

    $env:PGPASSWORD = $dbPassword
    $checkDb = psql -U $dbUser -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>$null

    if ($checkDb -eq "1") {
        Write-Success "Banco de dados '$dbName' já existe"

        # Perguntar se quer recriar
        if ($Force) {
            Write-Warning "Recriando banco de dados..."
            psql -U $dbUser -h localhost -c "DROP DATABASE IF EXISTS $dbName" 2>$null
            psql -U $dbUser -h localhost -c "CREATE DATABASE $dbName" 2>$null
            Write-Success "Banco de dados recriado"
        } else {
            Write-Info "Use -Force para recriar o banco"
        }
    } else {
        Write-Info "Criando banco de dados '$dbName'..."
        psql -U $dbUser -h localhost -c "CREATE DATABASE $dbName"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Banco de dados '$dbName' criado"
        } else {
            Write-Error "Falha ao criar banco de dados"
            exit 1
        }
    }

    # Executar migrations
    Write-Info "Executando migrations..."

    # Migration 001
    if (Test-Path "backend\migrations\001_schema.sql") {
        psql -U $dbUser -h localhost -d $dbName -f "backend\migrations\001_schema.sql" 2>$null
        Write-Success "Migration 001_schema.sql executada"
    }

    # Migration 002
    if (Test-Path "backend\migrations\002_enhanced_logging_system.sql") {
        psql -U $dbUser -h localhost -d $dbName -f "backend\migrations\002_enhanced_logging_system.sql" 2>$null
        Write-Success "Migration 002_enhanced_logging_system.sql executada"
    }

    # Add contacts column
    if (Test-Path "backend\migrations\001_add_contacts_column.sql") {
        psql -U $dbUser -h localhost -d $dbName -f "backend\migrations\001_add_contacts_column.sql" 2>$null
        Write-Success "Migration 001_add_contacts_column.sql executada"
    }

    $env:PGPASSWORD = $null

} else {
    Write-Warning "Configuração do banco de dados pulada (--SkipDatabase)"
}

# ═══════════════════════════════════════════════════════════
# 5. RESUMO E PRÓXIMOS PASSOS
# ═══════════════════════════════════════════════════════════
Write-Title "✅ SETUP CONCLUÍDO COM SUCESSO!"

Write-Host ""
Write-ColorOutput "📋 PRÓXIMOS PASSOS:" "Cyan"
Write-Host ""
Write-Host "1. Configure suas chaves de API no arquivo:" -ForegroundColor White
Write-Host "   backend\.env" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Inicie o backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Abra o frontend:" -ForegroundColor White
Write-Host "   Abra frontend\login.html no navegador" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Credenciais de acesso:" -ForegroundColor White
Write-Host "   Email: admin@prismatech.com" -ForegroundColor Green
Write-Host "   Senha: #serverprisma@dti" -ForegroundColor Green
Write-Host ""
Write-ColorOutput "🌐 URLs:" "Cyan"
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000 (ou porta do seu servidor)" -ForegroundColor Yellow
Write-Host "   N8N:      http://localhost:5678" -ForegroundColor Yellow
Write-Host ""

Write-Success "Ambiente pronto para desenvolvimento!"
