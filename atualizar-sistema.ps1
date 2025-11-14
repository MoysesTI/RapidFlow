# ═══════════════════════════════════════════════════════════════════════
# RAPIDFLOW - ATUALIZAÇÃO RÁPIDA DO SISTEMA
# ═══════════════════════════════════════════════════════════════════════
# Use este script para atualizar o código e banco de dados
# ═══════════════════════════════════════════════════════════════════════

function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Clear-Host
Write-Host ""
Write-ColorOutput Cyan "╔═══════════════════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║              RAPIDFLOW - ATUALIZAÇÃO DO SISTEMA                       ║"
Write-ColorOutput Cyan "╚═══════════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "backend\package.json")) {
    Write-ColorOutput Red "❌ Execute este script na raiz do projeto RapidFlow!"
    Write-ColorOutput Yellow "   Exemplo: cd C:\projetos\RapidFlow"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# 1. Atualizar código
Write-ColorOutput Cyan "📥 1. Atualizando código do repositório..."
try {
    git fetch origin
    $currentBranch = git branch --show-current
    git pull origin $currentBranch
    Write-ColorOutput Green "✅ Código atualizado!"
} catch {
    Write-ColorOutput Red "❌ Erro ao atualizar código: $_"
    exit 1
}

# 2. Ir para backend
Set-Location backend

# 3. Atualizar dependências
Write-ColorOutput Cyan "`n📦 2. Atualizando dependências npm..."
try {
    npm install
    Write-ColorOutput Green "✅ Dependências atualizadas!"
} catch {
    Write-ColorOutput Yellow "⚠️  Erro ao instalar dependências: $_"
}

# 4. Perguntar sobre banco de dados
Write-Host ""
$updateDb = Read-Host "Deseja atualizar o banco de dados? (novas migrações) [S/N]"

if ($updateDb -eq "S" -or $updateDb -eq "s") {
    Write-ColorOutput Cyan "`n🗄️  3. Atualizando banco de dados..."

    # Verificar se há arquivo .env
    if (-not (Test-Path ".env")) {
        Write-ColorOutput Red "❌ Arquivo .env não encontrado!"
        Write-ColorOutput Yellow "   Execute primeiro: .\setup-completo-windows.ps1"
        Read-Host "Pressione Enter para sair"
        exit 1
    }

    # Carregar configurações do .env
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$key" -Value $value
        }
    }

    $DB_HOST = $env:DB_HOST
    $DB_PORT = $env:DB_PORT
    $DB_NAME = $env:DB_NAME
    $DB_USER = $env:DB_USER
    $DB_PASSWORD = $env:DB_PASSWORD

    # Localizar PostgreSQL
    $PG_PATHS = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\15\bin"
    )

    $PSQL_PATH = $null
    foreach ($path in $PG_PATHS) {
        if (Test-Path "$path\psql.exe") {
            $PSQL_PATH = $path
            break
        }
    }

    if (-not $PSQL_PATH) {
        Write-ColorOutput Red "❌ PostgreSQL não encontrado!"
        Read-Host "Pressione Enter para sair"
        exit 1
    }

    # Definir senha
    $env:PGPASSWORD = $DB_PASSWORD

    # Executar migrações
    $migrations = Get-ChildItem "migrations\*.sql" | Sort-Object Name

    Write-ColorOutput Cyan "   Executando migrações..."
    foreach ($migration in $migrations) {
        Write-ColorOutput White "   📄 $($migration.Name)..."

        $result = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration.FullName 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "   ✅ Sucesso!"
        } else {
            Write-ColorOutput Yellow "   ⚠️  (pode já existir)"
        }
    }

    # Limpar senha
    $env:PGPASSWORD = ""

    Write-ColorOutput Green "`n✅ Banco de dados atualizado!"
}

# 5. Perguntar se quer iniciar
Write-Host ""
$startNow = Read-Host "Deseja iniciar o servidor agora? [S/N]"

if ($startNow -eq "S" -or $startNow -eq "s") {
    Write-Host ""
    Write-ColorOutput Cyan "🚀 Iniciando servidor..."
    Write-ColorOutput Yellow "   (Pressione Ctrl+C para parar)"
    Write-Host ""
    Start-Sleep -Seconds 2
    npm start
} else {
    Write-Host ""
    Write-ColorOutput Green "✅ Atualização concluída!"
    Write-ColorOutput Cyan "Para iniciar o servidor, execute: npm start"
    Write-Host ""
}
